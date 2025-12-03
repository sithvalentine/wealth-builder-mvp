const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSampleData() {
  try {
    console.log('Adding sample grades and quiz data...');

    // Get the student enrollment
    const student = await prisma.user.findUnique({
      where: { email: 'student1@wealthbuilder.com' }
    });

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id }
    });

    if (!enrollment) {
      console.log('No enrollment found for student');
      return;
    }

    console.log('Found enrollment:', enrollment.id);

    // Get the first lesson and quiz
    const lesson = await prisma.lesson.findFirst();
    const quiz = await prisma.quiz.findFirst();

    console.log('Found lesson:', lesson?.id);
    console.log('Found quiz:', quiz?.id);

    // Add some grades
    const grades = [
      {
        enrollmentId: enrollment.id,
        category: 'Quizzes',
        itemType: 'Quiz',
        itemId: quiz?.id || 'sample-quiz-1',
        pointsEarned: 85,
        pointsPossible: 100,
        percentage: 85.00
      },
      {
        enrollmentId: enrollment.id,
        category: 'Quizzes',
        itemType: 'Quiz',
        itemId: quiz?.id || 'sample-quiz-2',
        pointsEarned: 92,
        pointsPossible: 100,
        percentage: 92.00
      },
      {
        enrollmentId: enrollment.id,
        category: 'Projects',
        itemType: 'Project',
        itemId: 'sample-project-1',
        pointsEarned: 88,
        pointsPossible: 100,
        percentage: 88.00
      },
      {
        enrollmentId: enrollment.id,
        category: 'Participation',
        itemType: 'Participation',
        itemId: 'sample-participation-1',
        pointsEarned: 95,
        pointsPossible: 100,
        percentage: 95.00
      }
    ];

    for (const grade of grades) {
      await prisma.grade.create({
        data: grade
      });
      console.log(`Created grade: ${grade.category} - ${grade.percentage}%`);
    }

    // Add quiz attempts if we have a quiz
    if (quiz) {
      const quizAttempt = await prisma.quizAttempt.create({
        data: {
          enrollmentId: enrollment.id,
          quizId: quiz.id,
          attemptNumber: 1,
          submittedAt: new Date(),
          score: 85.00,
          responses: { answers: ['a', 'b', 'c'] },
          timeSpent: 600
        }
      });
      console.log('Created quiz attempt:', quizAttempt.id);
    }

    // Add wealth tracker entry
    const wealthEntry = await prisma.wealthTrackerEntry.create({
      data: {
        enrollmentId: enrollment.id,
        recordDate: new Date(),
        assets: {
          checking: 500,
          savings: 1200,
          investments: 0
        },
        liabilities: {
          creditCard: 150,
          studentLoan: 0
        },
        netWorth: 1550,
        notes: 'First wealth tracking entry'
      }
    });
    console.log('Created wealth tracker entry:', wealthEntry.id);

    console.log('✅ Sample data added successfully!');
  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleData();
