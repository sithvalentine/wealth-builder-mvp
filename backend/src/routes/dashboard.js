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
            course: {
              include: {
                units: {
                  orderBy: { unitNumber: 'asc' },
                  include: {
                    weeks: {
                      orderBy: { weekNumber: 'asc' }
                    }
                  }
                }
              }
            },
            instructor: {
              select: { firstName: true, lastName: true, email: true }
            }
          }
        },
        grades: {
          include: {
            lesson: true,
            quiz: true,
            project: true
          }
        }
      }
    });

    // Calculate progress for each enrollment
    const classProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = enrollment.classGroup.course;

        // Get all lessons in the course
        const totalLessons = await prisma.lesson.count({
          where: {
            week: {
              unit: {
                courseId: course.id
              }
            }
          }
        });

        // Get completed lessons
        const completedLessons = await prisma.lessonCompletion.count({
          where: {
            studentId: req.user.id,
            lesson: {
              week: {
                unit: {
                  courseId: course.id
                }
              }
            },
            status: 'Completed'
          }
        });

        // Calculate grade breakdown by category
        const gradesByCategory = {
          Projects: { earned: 0, possible: 0 },
          Quiz: { earned: 0, possible: 0 },
          Participation: { earned: 0, possible: 0 },
          RealWorld: { earned: 0, possible: 0 }
        };

        enrollment.grades.forEach(grade => {
          if (gradesByCategory[grade.category]) {
            gradesByCategory[grade.category].earned += grade.earnedPoints;
            gradesByCategory[grade.category].possible += grade.possiblePoints;
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
          Quiz: weights.quizzes,
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
          courseName: course.name,
          instructor: enrollment.classGroup.instructor,
          currentGrade: currentGrade.toFixed(2),
          letterGrade: calculateLetterGrade(currentGrade),
          progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
          completedLessons,
          totalLessons,
          gradesByCategory,
          recentActivity: enrollment.grades
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
        };
      })
    );

    // Get recent quiz attempts
    const recentQuizzes = await prisma.quizAttempt.findMany({
      where: {
        studentId: req.user.id,
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
        studentId: req.user.id,
        isHypothetical: false
      },
      orderBy: { date: 'desc' }
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
        score: q.score,
        earnedPoints: q.earnedPoints,
        possiblePoints: q.possiblePoints,
        submittedAt: q.submittedAt
      })),
      wealthTracker: latestWealth ? {
        netWorth: latestWealth.netWorth,
        totalAssets: latestWealth.totalAssets,
        totalLiabilities: latestWealth.totalLiabilities,
        lastUpdated: latestWealth.date
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
          Quiz: { earned: 0, possible: 0 },
          Participation: { earned: 0, possible: 0 },
          RealWorld: { earned: 0, possible: 0 }
        };

        enrollment.grades.forEach(grade => {
          if (gradesByCategory[grade.category]) {
            gradesByCategory[grade.category].earned += grade.earnedPoints;
            gradesByCategory[grade.category].possible += grade.possiblePoints;
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
          Quiz: weights.quizzes,
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
        contextType: classGroup.context.type,
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
        },
        lesson: {
          select: { title: true }
        },
        quiz: {
          select: { title: true }
        },
        project: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' },
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
        itemTitle: grade.lesson?.title || grade.quiz?.title || grade.project?.title,
        earnedPoints: grade.earnedPoints,
        possiblePoints: grade.possiblePoints,
        percentage: grade.possiblePoints > 0 ? (grade.earnedPoints / grade.possiblePoints) * 100 : 0,
        submittedAt: grade.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get gradebook for specific class
router.get('/gradebook/:classId', authenticateToken, async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify teacher owns this class
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: classId },
      include: {
        course: true
      }
    });

    if (!classGroup) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (classGroup.instructorId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Not authorized to view this gradebook' });
    }

    // Get all enrollments with grades
    const enrollments = await prisma.enrollment.findMany({
      where: { classGroupId: classId },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        grades: {
          include: {
            lesson: true,
            quiz: true,
            project: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // Calculate detailed gradebook
    const gradebook = enrollments.map(enrollment => {
      const gradesByCategory = {
        Projects: { earned: 0, possible: 0, items: [] },
        Quiz: { earned: 0, possible: 0, items: [] },
        Participation: { earned: 0, possible: 0, items: [] },
        RealWorld: { earned: 0, possible: 0, items: [] }
      };

      enrollment.grades.forEach(grade => {
        if (gradesByCategory[grade.category]) {
          gradesByCategory[grade.category].earned += grade.earnedPoints;
          gradesByCategory[grade.category].possible += grade.possiblePoints;
          gradesByCategory[grade.category].items.push({
            title: grade.lesson?.title || grade.quiz?.title || grade.project?.title,
            earnedPoints: grade.earnedPoints,
            possiblePoints: grade.possiblePoints,
            percentage: grade.possiblePoints > 0 ? (grade.earnedPoints / grade.possiblePoints) * 100 : 0,
            date: grade.createdAt
          });
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
        Quiz: weights.quizzes,
        Participation: weights.participation,
        RealWorld: weights.realWorld
      };

      const categoryScores = {};
      Object.entries(gradesByCategory).forEach(([category, scores]) => {
        const percentage = scores.possible > 0 ? (scores.earned / scores.possible) * 100 : 0;
        const weight = categoryMapping[category];

        categoryScores[category] = {
          percentage: percentage.toFixed(2),
          earned: scores.earned,
          possible: scores.possible,
          weight: weight
        };

        if (scores.possible > 0) {
          weightedGrade += (percentage * weight) / 100;
          totalWeight += weight;
        }
      });

      const finalGrade = totalWeight > 0 ? (weightedGrade / totalWeight) * 100 : 0;

      return {
        studentId: enrollment.student.id,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        studentEmail: enrollment.student.email,
        enrollmentStatus: enrollment.status,
        categoryScores,
        finalGrade: finalGrade.toFixed(2),
        letterGrade: calculateLetterGrade(finalGrade),
        gradeDetails: gradesByCategory
      };
    });

    res.json({
      classId: classGroup.id,
      className: classGroup.name,
      courseName: classGroup.course.name,
      gradingWeights: classGroup.gradingWeights,
      studentCount: enrollments.length,
      gradebook
    });
  } catch (error) {
    console.error('Error fetching gradebook:', error);
    res.status(500).json({ error: 'Failed to fetch gradebook' });
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
