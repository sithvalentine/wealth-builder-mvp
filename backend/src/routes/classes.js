const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Create new class (Teachers/Facilitators only)
router.post('/', authenticateToken, requireRole('Teacher', 'Facilitator'), async (req, res) => {
  try {
    const { name, courseId, contextId, schoolYear, startDate, endDate, meetingSchedule, gradingWeights, isCondensed } = req.body;

    const classGroup = await prisma.classGroup.create({
      data: {
        name,
        courseId,
        contextId,
        instructorId: req.user.id,
        schoolYear,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        meetingSchedule: meetingSchedule || { days: ['Mon', 'Wed', 'Fri'], time: '10:00' },
        gradingWeights: gradingWeights || { projects: 40, quizzes: 30, participation: 20, realWorld: 10 },
        isCondensed: isCondensed || false
      },
      include: {
        course: true,
        context: true
      }
    });

    res.status(201).json({
      message: 'Class created successfully',
      classGroup
    });
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Get all classes for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    let classes;

    if (req.user.role === 'Student') {
      // Get enrolled classes
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: req.user.id },
        include: {
          classGroup: {
            include: {
              course: true,
              instructor: {
                select: { firstName: true, lastName: true }
              },
              _count: {
                select: { enrollments: true }
              }
            }
          }
        }
      });

      classes = enrollments.map(e => ({
        ...e.classGroup,
        enrollment: {
          id: e.id,
          status: e.status,
          finalGrade: e.finalGrade
        }
      }));
    } else {
      // Get classes taught by teacher/facilitator
      classes = await prisma.classGroup.findMany({
        where: { instructorId: req.user.id },
        include: {
          course: true,
          context: true,
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get single class with details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const classGroup = await prisma.classGroup.findUnique({
      where: { id },
      include: {
        course: true,
        context: true,
        instructor: {
          select: { firstName: true, lastName: true, email: true }
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });

    if (!classGroup) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check authorization
    if (req.user.role === 'Student') {
      const isEnrolled = classGroup.enrollments.some(e => e.studentId === req.user.id);
      if (!isEnrolled) {
        return res.status(403).json({ error: 'Not enrolled in this class' });
      }
    } else if (req.user.role !== 'Admin' && classGroup.instructorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this class' });
    }

    res.json({ classGroup });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// Enroll student in class (using enrollment code)
router.post('/:id/enroll', authenticateToken, requireRole('Student'), async (req, res) => {
  try {
    const { id } = req.params;
    const { enrollmentCode } = req.body;

    // Verify class and enrollment code
    const classGroup = await prisma.classGroup.findFirst({
      where: {
        OR: [
          { id },
          { enrollmentCode }
        ]
      }
    });

    if (!classGroup) {
      return res.status(404).json({ error: 'Class not found or invalid code' });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_classGroupId: {
          studentId: req.user.id,
          classGroupId: classGroup.id
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this class' });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: req.user.id,
        classGroupId: classGroup.id
      },
      include: {
        classGroup: {
          include: {
            course: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment
    });
  } catch (error) {
    console.error('Error enrolling in class:', error);
    res.status(500).json({ error: 'Failed to enroll in class' });
  }
});

module.exports = router;
