const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Contexts
  console.log('Creating contexts...');
  const academicContext = await prisma.context.upsert({
    where: { name: 'Academic' },
    update: {},
    create: {
      name: 'Academic',
      description: 'Traditional high school classroom setting with daily instruction'
    }
  });

  const youthProgramContext = await prisma.context.upsert({
    where: { name: 'YouthProgram' },
    update: {},
    create: {
      name: 'YouthProgram',
      description: 'After-school or community youth program with flexible scheduling'
    }
  });

  // Create demo users
  console.log('Creating demo users...');
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);
  const facilitatorPassword = await bcrypt.hash('facilitator123', 10);

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@wealthbuilder.com' },
    update: {},
    create: {
      email: 'teacher@wealthbuilder.com',
      passwordHash: teacherPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'Teacher'
    }
  });

  const facilitator = await prisma.user.upsert({
    where: { email: 'facilitator@wealthbuilder.com' },
    update: {},
    create: {
      email: 'facilitator@wealthbuilder.com',
      passwordHash: facilitatorPassword,
      firstName: 'Marcus',
      lastName: 'Williams',
      role: 'Facilitator'
    }
  });

  const student1 = await prisma.user.upsert({
    where: { email: 'student1@wealthbuilder.com' },
    update: {},
    create: {
      email: 'student1@wealthbuilder.com',
      passwordHash: studentPassword,
      firstName: 'Emma',
      lastName: 'Davis',
      role: 'Student'
    }
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@wealthbuilder.com' },
    update: {},
    create: {
      email: 'student2@wealthbuilder.com',
      passwordHash: studentPassword,
      firstName: 'James',
      lastName: 'Rodriguez',
      role: 'Student'
    }
  });

  // Create Course 1
  console.log('Creating Course 1...');
  const course1 = await prisma.course.upsert({
    where: { courseNumber: 101 },
    update: {},
    create: {
      courseNumber: 101,
      title: 'Financial Foundations & Smart Money Management',
      description: 'An 18-week course covering essential financial literacy skills including budgeting, banking, credit, debt management, and consumer protection.',
      durationWeeks: 18,
      targetAgeMin: 15,
      targetAgeMax: 17,
      isActive: true
    }
  });

  // Create Unit 1
  console.log('Creating Unit 1...');
  const unit1 = await prisma.unit.create({
    data: {
      courseId: course1.id,
      unitNumber: 1,
      title: 'Foundations of Money & Goal Setting',
      description: 'Understanding money, financial goals, and budgeting basics',
      weekStart: 1,
      weekEnd: 4,
      learningObjectives: [
        'Understand the history and functions of money',
        'Differentiate between needs and wants',
        'Set SMART financial goals',
        'Create a basic budget using the 50/20/30 rule'
      ],
      isCore: true
    }
  });

  // Create Week 1
  console.log('Creating Week 1...');
  const week1 = await prisma.week.create({
    data: {
      unitId: unit1.id,
      weekNumber: 1,
      title: 'What is Money? History & Functions',
      overview: 'Explore the evolution of money from barter systems to digital currency'
    }
  });

  // Create a sample lesson
  console.log('Creating sample lesson...');
  await prisma.lesson.create({
    data: {
      weekId: week1.id,
      dayNumber: 1,
      title: 'The Barter System and Early Trade',
      learningObjectives: [
        'Understand how barter systems worked',
        'Identify limitations of barter',
        'Recognize the need for currency'
      ],
      contentBlocks: [
        {
          type: 'introduction',
          content: 'Before money existed, people traded goods and services directly through barter.'
        },
        {
          type: 'key_points',
          content: [
            'Barter is the direct exchange of goods without money',
            'The double coincidence of wants problem made barter inefficient',
            'Different cultures developed various items as mediums of exchange'
          ]
        }
      ],
      materials: ['Textbook Chapter 1', 'Barter simulation cards'],
      estimatedDuration: 50,
      sortOrder: 1
    }
  });

  // Create demo class
  console.log('Creating demo class...');
  const demoClass = await prisma.classGroup.create({
    data: {
      name: 'Financial Literacy - Period 3',
      courseId: course1.id,
      contextId: academicContext.id,
      instructorId: teacher.id,
      schoolYear: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-01-15'),
      meetingSchedule: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        time: '10:30 AM'
      },
      gradingWeights: {
        projects: 40,
        quizzes: 30,
        participation: 20,
        realWorld: 10
      },
      enrollmentCode: 'FINLIT2024',
      isCondensed: false
    }
  });

  // Enroll demo students
  await prisma.enrollment.createMany({
    data: [
      {
        studentId: student1.id,
        classGroupId: demoClass.id,
        status: 'Active'
      },
      {
        studentId: student2.id,
        classGroupId: demoClass.id,
        status: 'Active'
      }
    ]
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📚 Demo Accounts Created:');
  console.log('Teacher: teacher@wealthbuilder.com / teacher123');
  console.log('Facilitator: facilitator@wealthbuilder.com / facilitator123');
  console.log('Student 1: student1@wealthbuilder.com / student123');
  console.log('Student 2: student2@wealthbuilder.com / student123');
  console.log('\n🎓 Demo Class Created:');
  console.log(`Class: ${demoClass.name}`);
  console.log(`Enrollment Code: ${demoClass.enrollmentCode}`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
