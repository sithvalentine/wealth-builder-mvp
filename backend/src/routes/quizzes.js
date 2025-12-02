const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get quiz details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        week: {
          include: {
            unit: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Get student's previous attempts
    let attempts = [];
    let bestScore = null;
    if (req.user.role === 'Student') {
      attempts = await prisma.quizAttempt.findMany({
        where: {
          studentId: req.user.id,
          quizId: id
        },
        orderBy: { attemptNumber: 'desc' },
        select: {
          id: true,
          attemptNumber: true,
          score: true,
          earnedPoints: true,
          possiblePoints: true,
          startedAt: true,
          submittedAt: true
        }
      });

      if (attempts.length > 0) {
        bestScore = Math.max(...attempts.map(a => a.score));
      }
    }

    // Don't send answers to students before they submit
    const quizData = {
      ...quiz,
      questions: req.user.role === 'Student'
        ? quiz.questions.map(q => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            points: q.points
          }))
        : quiz.questions
    };

    res.json({
      quiz: quizData,
      attempts: attempts.length,
      bestScore,
      recentAttempts: attempts.slice(0, 5)
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Start quiz attempt
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { classGroupId } = req.body;

    if (req.user.role !== 'Student') {
      return res.status(403).json({ error: 'Only students can take quizzes' });
    }

    // Verify enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classGroupId: {
          studentId: req.user.id,
          classGroupId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this class' });
    }

    // Get quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Count previous attempts
    const previousAttempts = await prisma.quizAttempt.count({
      where: {
        studentId: req.user.id,
        quizId: id
      }
    });

    // Check attempt limit if set
    if (quiz.attemptsAllowed && previousAttempts >= quiz.attemptsAllowed) {
      return res.status(400).json({
        error: 'Maximum attempts reached',
        attemptsAllowed: quiz.attemptsAllowed
      });
    }

    // Create new attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        studentId: req.user.id,
        quizId: id,
        attemptNumber: previousAttempts + 1,
        startedAt: new Date(),
        possiblePoints: quiz.totalPoints
      }
    });

    res.status(201).json({
      message: 'Quiz attempt started',
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      timeLimit: quiz.timeLimit
    });
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

// Submit quiz attempt with auto-grading
router.post('/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { attemptId, answers, classGroupId } = req.body;

    if (req.user.role !== 'Student') {
      return res.status(403).json({ error: 'Only students can submit quizzes' });
    }

    // Get attempt
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: true
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    if (attempt.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not your quiz attempt' });
    }

    if (attempt.submittedAt) {
      return res.status(400).json({ error: 'Quiz already submitted' });
    }

    // Check time limit
    if (attempt.quiz.timeLimit) {
      const elapsedMinutes = (new Date() - attempt.startedAt) / 1000 / 60;
      if (elapsedMinutes > attempt.quiz.timeLimit) {
        return res.status(400).json({
          error: 'Time limit exceeded',
          timeLimit: attempt.quiz.timeLimit
        });
      }
    }

    // Auto-grade the quiz
    const questions = attempt.quiz.questions;
    let earnedPoints = 0;
    const gradedAnswers = {};

    questions.forEach(question => {
      const studentAnswer = answers[question.id];
      let isCorrect = false;
      let pointsEarned = 0;

      if (question.questionType === 'MultipleChoice' || question.questionType === 'TrueFalse') {
        isCorrect = studentAnswer === question.correctAnswer;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.questionType === 'MultipleSelect') {
        // For multiple select, all correct options must be selected and no incorrect ones
        const correctAnswers = question.correctAnswer.sort();
        const studentAnswers = (studentAnswer || []).sort();
        isCorrect = JSON.stringify(correctAnswers) === JSON.stringify(studentAnswers);
        pointsEarned = isCorrect ? question.points : 0;
      }

      earnedPoints += pointsEarned;
      gradedAnswers[question.id] = {
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        pointsEarned,
        possiblePoints: question.points
      };
    });

    const score = attempt.quiz.totalPoints > 0
      ? (earnedPoints / attempt.quiz.totalPoints) * 100
      : 0;

    // Update attempt with results
    const submittedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        answers: gradedAnswers,
        earnedPoints,
        score
      }
    });

    // Create grade record
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classGroupId: {
          studentId: req.user.id,
          classGroupId
        }
      }
    });

    if (enrollment) {
      await prisma.grade.create({
        data: {
          enrollmentId: enrollment.id,
          category: 'Quiz',
          earnedPoints,
          possiblePoints: attempt.quiz.totalPoints,
          quizId: id
        }
      });
    }

    res.json({
      message: 'Quiz submitted successfully',
      score,
      earnedPoints,
      possiblePoints: attempt.quiz.totalPoints,
      gradedAnswers,
      attemptNumber: attempt.attemptNumber
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get quiz attempt results
router.get('/attempt/:attemptId', authenticateToken, async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: true
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Quiz attempt not found' });
    }

    // Students can only view their own attempts
    if (req.user.role === 'Student' && attempt.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this attempt' });
    }

    if (!attempt.submittedAt) {
      return res.status(400).json({ error: 'Quiz not yet submitted' });
    }

    res.json({
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        earnedPoints: attempt.earnedPoints,
        possiblePoints: attempt.possiblePoints,
        answers: attempt.answers
      },
      quiz: {
        title: attempt.quiz.title,
        description: attempt.quiz.description,
        questions: attempt.quiz.questions
      }
    });
  } catch (error) {
    console.error('Error fetching quiz attempt:', error);
    res.status(500).json({ error: 'Failed to fetch quiz attempt' });
  }
});

module.exports = router;
