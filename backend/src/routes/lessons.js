const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get lesson details with completion status
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
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

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Get completion status for student
    let completion = null;
    if (req.user.role === 'Student') {
      completion = await prisma.lessonCompletion.findUnique({
        where: {
          studentId_lessonId: {
            studentId: req.user.id,
            lessonId: id
          }
        }
      });
    }

    res.json({
      lesson,
      completion: completion ? {
        completedAt: completion.completedAt,
        status: completion.status
      } : null
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Mark lesson as complete
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { classGroupId } = req.body;

    if (req.user.role !== 'Student') {
      return res.status(403).json({ error: 'Only students can complete lessons' });
    }

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Verify student is enrolled in the class
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

    // Create or update completion record
    const completion = await prisma.lessonCompletion.upsert({
      where: {
        studentId_lessonId: {
          studentId: req.user.id,
          lessonId: id
        }
      },
      create: {
        studentId: req.user.id,
        lessonId: id,
        status: 'Completed',
        completedAt: new Date()
      },
      update: {
        status: 'Completed',
        completedAt: new Date()
      }
    });

    // Award participation points (create grade record)
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: classGroupId }
    });

    const participationPoints = 10; // Base points for lesson completion

    await prisma.grade.create({
      data: {
        enrollmentId: enrollment.id,
        category: 'Participation',
        earnedPoints: participationPoints,
        possiblePoints: participationPoints,
        lessonId: id
      }
    });

    res.json({
      message: 'Lesson marked as complete',
      completion,
      pointsEarned: participationPoints
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

// Get all lessons for a week
router.get('/week/:weekId', authenticateToken, async (req, res) => {
  try {
    const { weekId } = req.params;

    const lessons = await prisma.lesson.findMany({
      where: { weekId },
      orderBy: { dayNumber: 'asc' }
    });

    // Get completion status for each lesson if student
    if (req.user.role === 'Student') {
      const completions = await prisma.lessonCompletion.findMany({
        where: {
          studentId: req.user.id,
          lessonId: { in: lessons.map(l => l.id) }
        }
      });

      const completionMap = {};
      completions.forEach(c => {
        completionMap[c.lessonId] = {
          completedAt: c.completedAt,
          status: c.status
        };
      });

      const lessonsWithCompletion = lessons.map(lesson => ({
        ...lesson,
        completion: completionMap[lesson.id] || null
      }));

      return res.json({ lessons: lessonsWithCompletion });
    }

    res.json({ lessons });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

module.exports = router;
