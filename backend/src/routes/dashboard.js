const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get student dashboard data
router.get('/student', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({ error: 'Student role required' });
    }

    // Get all enrollments with class and course data
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: req.user.id },
      include: {
        classGroup: {
          include: {
            course: true,
            instructor: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        grades: {
          orderBy: { recordedAt: 'desc' }
        }
      }
    });

    // Calculate progress for each enrollment
    const classProgress = enrollments.map((enrollment) => {
      // Calculate grade breakdown by category
      const gradesByCategory = {
        Projects: { earned: 0, possible: 0 },
        Quizzes: { earned: 0, possible: 0 },
        Participation: { earned: 0, possible: 0 },
        RealWorld: { earned: 0, possible: 0 }
      };

      enrollment.grades.forEach(grade => {
        if (gradesByCategory[grade.category]) {
          gradesByCategory[grade.category].earned += parseFloat(grade.pointsEarned);
          gradesByCategory[grade.category].possible += parseFloat(grade.pointsPossible);
        }
      });

      // Calculate weighted grade
      const weights = enrollment.classGroup.gradingWeights || {
        projects: 40,
        quizzes: 30,
        participation: 20,
        realWorld: 10
      };

      let weightedGrade = 0;
      let totalWeight = 0;

      const categoryMapping = {
        Projects: weights.projects,
        Quizzes: weights.quizzes,
        Participation: weights.participation,
        RealWorld: weights.realWorld
      };

      Object.entries(gradesByCategory).forEach(([category, scores]) => {
        if (scores.possible > 0) {
          const categoryPercent = (scores.earned / scores.possible) * 100;
          const weight = categoryMapping[category];
          weightedGrade += (categoryPercent * weight) / 100;
          totalWeight += weight;
        }
      });

      const currentGrade = totalWeight > 0 ? (weightedGrade / totalWeight) * 100 : 0;

      return {
        classId: enrollment.classGroup.id,
        className: enrollment.classGroup.name,
        courseName: enrollment.classGroup.course.name,
        instructor: enrollment.classGroup.instructor,
        currentGrade: currentGrade.toFixed(2),
        letterGrade: calculateLetterGrade(currentGrade),
        gradesByCategory,
        recentActivity: enrollment.grades.slice(0, 5).map(g => ({
          category: g.category,
          itemType: g.itemType,
          earnedPoints: parseFloat(g.pointsEarned),
          possiblePoints: parseFloat(g.pointsPossible),
          percentage: parseFloat(g.percentage),
          recordedAt: g.recordedAt
        }))
      };
    });

    // Get recent quiz attempts
    const recentQuizzes = await prisma.quizAttempt.findMany({
      where: {
        enrollmentId: { in: enrollments.map(e => e.id) },
        submittedAt: { not: null }
      },
      include: {
        quiz: {
          select: { title: true }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: 5
    });

    // Get wealth tracker summary
    const latestWealth = await prisma.wealthTrackerEntry.findFirst({
      where: {
        enrollmentId: { in: enrollments.map(e => e.id) }
      },
      orderBy: { recordDate: 'desc' }
    });

    res.json({
      user: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      },
      classes: classProgress,
      recentQuizzes: recentQuizzes.map(q => ({
        quizTitle: q.quiz.title,
        score: q.score ? parseFloat(q.score) : 0,
        submittedAt: q.submittedAt
      })),
      wealthTracker: latestWealth ? {
        netWorth: latestWealth.netWorth,
        // totalAssets in JSON
        // totalLiabilities in JSON
        lastUpdated: latestWealth.recordDate
      } : null
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get teacher dashboard data
router.get('/teacher', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Teacher' && req.user.role !== 'Facilitator') {
      return res.status(403).json({ error: 'Teacher or Facilitator role required' });
    }

    // Get all classes taught
    const classes = await prisma.classGroup.findMany({
      where: { instructorId: req.user.id },
      include: {
        course: true,
        context: true,
        enrollments: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, email: true }
            },
            grades: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate class statistics
    const classStats = classes.map(classGroup => {
      const students = classGroup.enrollments;

      // Calculate average grade for the class
      const studentGrades = students.map(enrollment => {
        const gradesByCategory = {
          Projects: { earned: 0, possible: 0 },
          Quizzes: { earned: 0, possible: 0 },
          Participation: { earned: 0, possible: 0 },
          RealWorld: { earned: 0, possible: 0 }
        };

        enrollment.grades.forEach(grade => {
          if (gradesByCategory[grade.category]) {
            gradesByCategory[grade.category].earned += parseFloat(grade.pointsEarned);
            gradesByCategory[grade.category].possible += parseFloat(grade.pointsPossible);
          }
        });

        const weights = classGroup.gradingWeights || {
          projects: 40,
          quizzes: 30,
          participation: 20,
          realWorld: 10
        };

        let weightedGrade = 0;
        let totalWeight = 0;

        const categoryMapping = {
          Projects: weights.projects,
          Quizzes: weights.quizzes,
          Participation: weights.participation,
          RealWorld: weights.realWorld
        };

        Object.entries(gradesByCategory).forEach(([category, scores]) => {
          if (scores.possible > 0) {
            const categoryPercent = (scores.earned / scores.possible) * 100;
            const weight = categoryMapping[category];
            weightedGrade += (categoryPercent * weight) / 100;
            totalWeight += weight;
          }
        });

        return totalWeight > 0 ? (weightedGrade / totalWeight) * 100 : 0;
      });

      const averageGrade = studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + g, 0) / studentGrades.length
        : 0;

      return {
        classId: classGroup.id,
        className: classGroup.name,
        courseName: classGroup.course.name,
        contextType: classGroup.context.name,
        studentCount: students.length,
        averageGrade: averageGrade.toFixed(2),
        startDate: classGroup.startDate,
        endDate: classGroup.endDate,
        enrollmentCode: classGroup.enrollmentCode
      };
    });

    // Get recent student activity across all classes
    const recentActivity = await prisma.grade.findMany({
      where: {
        enrollment: {
          classGroup: {
            instructorId: req.user.id
          }
        }
      },
      include: {
        enrollment: {
          include: {
            student: {
              select: { firstName: true, lastName: true }
            },
            classGroup: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { recordedAt: 'desc' },
      take: 20
    });

    res.json({
      user: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        role: req.user.role
      },
      classes: classStats,
      totalStudents: classStats.reduce((sum, c) => sum + c.studentCount, 0),
      recentActivity: recentActivity.map(grade => ({
        studentName: `${grade.enrollment.student.firstName} ${grade.enrollment.student.lastName}`,
        className: grade.enrollment.classGroup.name,
        category: grade.category,
        itemTitle: `${grade.itemType} Assessment`,
        earnedPoints: parseFloat(grade.pointsEarned),
        possiblePoints: parseFloat(grade.pointsPossible),
        percentage: parseFloat(grade.percentage),
        submittedAt: grade.recordedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Helper function to calculate letter grade
function calculateLetterGrade(percentage) {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

module.exports = router;
