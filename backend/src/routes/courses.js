const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all courses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        units: {
          orderBy: { unitNumber: 'asc' },
          include: {
            weeks: {
              orderBy: { weekNumber: 'asc' }
            }
          }
        }
      },
      orderBy: { courseNumber: 'asc' }
    });

    res.json({ courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course with full curriculum
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { unitNumber: 'asc' },
          include: {
            weeks: {
              orderBy: { weekNumber: 'asc' },
              include: {
                lessons: {
                  orderBy: { dayNumber: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

module.exports = router;
