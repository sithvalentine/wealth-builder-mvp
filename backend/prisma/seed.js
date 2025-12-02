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

  // Create Course 1: Financial Foundations & Smart Money Management
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

  // Unit 1: Foundations of Money & Goal Setting (Weeks 1-4)
  console.log('Creating Unit 1...');
  const unit1 = await prisma.unit.create({
    data: {
      courseId: course1.id,
      unitNumber: 1,
      name: 'Foundations of Money & Goal Setting',
      description: 'Understanding money, financial goals, and budgeting basics',
      learningObjectives: [
        'Understand the history and functions of money',
        'Differentiate between needs and wants',
        'Set SMART financial goals',
        'Create a basic budget using the 50/20/30 rule'
      ]
    }
  });

  // Week 1: What is Money? History & Functions
  console.log('Creating Week 1...');
  const week1 = await prisma.week.create({
    data: {
      unitId: unit1.id,
      weekNumber: 1,
      title: 'What is Money? History & Functions',
      overview: 'Explore the evolution of money from barter systems to digital currency'
    }
  });

  // Week 1 Lessons
  await prisma.lesson.createMany({
    data: [
      {
        weekId: week1.id,
        dayNumber: 1,
        title: 'The Barter System and Early Trade',
        content: {
          introduction: 'Before money existed, people traded goods and services directly through barter. Learn how this system worked and why it had limitations.',
          keyPoints: [
            'Barter is the direct exchange of goods and services without using money',
            'The "double coincidence of wants" problem made barter inefficient',
            'Different cultures developed various items as mediums of exchange'
          ],
          activities: [
            'Group activity: Simulate a barter economy in the classroom',
            'Discussion: What challenges would you face in a barter system today?'
          ],
          vocabulary: {
            barter: 'The exchange of goods or services without using money',
            commodity: 'A basic good used in commerce that is interchangeable with other goods of the same type'
          }
        },
        duration: 50
      },
      {
        weekId: week1.id,
        dayNumber: 2,
        title: 'The Three Functions of Money',
        content: {
          introduction: 'Money serves three essential functions in our economy: medium of exchange, unit of account, and store of value.',
          keyPoints: [
            'Medium of Exchange: Money facilitates transactions by eliminating the need for barter',
            'Unit of Account: Money provides a common measure for valuing goods and services',
            'Store of Value: Money can be saved and used for future purchases'
          ],
          activities: [
            'Identify examples of each function in everyday life',
            'Analyze why certain items make good or bad money'
          ],
          realWorldConnection: 'Consider how cryptocurrency like Bitcoin functions as money'
        },
        duration: 50
      },
      {
        weekId: week1.id,
        dayNumber: 3,
        title: 'From Coins to Cash: Physical Money',
        content: {
          introduction: 'Learn about the development of physical money from precious metals to modern paper currency.',
          keyPoints: [
            'Metal coins provided durability and intrinsic value',
            'Paper money was initially backed by gold or silver',
            'Fiat money derives value from government backing, not precious metals'
          ],
          activities: [
            'Examine security features on modern currency',
            'Research how different countries design their money'
          ]
        },
        duration: 50
      },
      {
        weekId: week1.id,
        dayNumber: 4,
        title: 'Digital Money and the Future',
        content: {
          introduction: 'Explore how money has evolved into digital forms including credit cards, mobile payments, and cryptocurrency.',
          keyPoints: [
            'Digital transactions now exceed cash transactions in many countries',
            'Credit and debit cards are forms of electronic money',
            'Cryptocurrency represents a decentralized digital currency system',
            'Mobile payment apps make transactions faster and more convenient'
          ],
          activities: [
            'Compare different mobile payment apps (Venmo, CashApp, Apple Pay)',
            'Discuss the pros and cons of a cashless society'
          ],
          toolIntegration: 'Introduction to the Budget Calculator tool'
        },
        duration: 50
      }
    ]
  });

  // Week 1 Quiz
  await prisma.quiz.create({
    data: {
      weekId: week1.id,
      title: 'Week 1: Money History & Functions Quiz',
      description: 'Test your understanding of money\'s history and functions',
      timeLimit: 20,
      attemptsAllowed: 3,
      totalPoints: 100,
      questions: [
        {
          id: 'q1',
          questionText: 'What is the main problem with a barter system?',
          questionType: 'MultipleChoice',
          options: [
            'It requires a double coincidence of wants',
            'It is too expensive',
            'It only works with digital items',
            'It requires government approval'
          ],
          correctAnswer: 'It requires a double coincidence of wants',
          points: 10,
          explanation: 'Barter requires both parties to want what the other has, which is difficult to coordinate.'
        },
        {
          id: 'q2',
          questionText: 'Which of the following is NOT a function of money?',
          questionType: 'MultipleChoice',
          options: [
            'Medium of exchange',
            'Store of value',
            'Unit of account',
            'Source of happiness'
          ],
          correctAnswer: 'Source of happiness',
          points: 10,
          explanation: 'The three functions of money are medium of exchange, store of value, and unit of account.'
        },
        {
          id: 'q3',
          questionText: 'Fiat money is backed by precious metals like gold.',
          questionType: 'TrueFalse',
          options: ['True', 'False'],
          correctAnswer: 'False',
          points: 10,
          explanation: 'Fiat money is backed by government decree, not precious metals. The US left the gold standard in 1971.'
        },
        {
          id: 'q4',
          questionText: 'Which of these are examples of digital money? (Select all that apply)',
          questionType: 'MultipleSelect',
          options: [
            'Credit cards',
            'Bitcoin',
            'Paper dollars',
            'Mobile payment apps'
          ],
          correctAnswer: ['Credit cards', 'Bitcoin', 'Mobile payment apps'],
          points: 20,
          explanation: 'Credit cards, cryptocurrency, and mobile payment apps are all forms of digital money.'
        },
        {
          id: 'q5',
          questionText: 'What makes money a good "medium of exchange"?',
          questionType: 'MultipleChoice',
          options: [
            'It is widely accepted for transactions',
            'It is heavy and difficult to carry',
            'It expires quickly',
            'It can only be used once'
          ],
          correctAnswer: 'It is widely accepted for transactions',
          points: 10,
          explanation: 'A medium of exchange must be widely accepted to facilitate transactions efficiently.'
        },
        {
          id: 'q6',
          questionText: 'The value of cryptocurrency is determined by:',
          questionType: 'MultipleChoice',
          options: [
            'Government regulation only',
            'Supply and demand in the market',
            'The amount of gold backing it',
            'A fixed price set by banks'
          ],
          correctAnswer: 'Supply and demand in the market',
          points: 15,
          explanation: 'Cryptocurrency value fluctuates based on market supply and demand, similar to stocks.'
        },
        {
          id: 'q7',
          questionText: 'When money serves as a "unit of account," it:',
          questionType: 'MultipleChoice',
          options: [
            'Provides a common measure to value goods and services',
            'Can be deposited in a bank account',
            'Increases in value over time',
            'Is used to pay taxes'
          ],
          correctAnswer: 'Provides a common measure to value goods and services',
          points: 15,
          explanation: 'As a unit of account, money provides a standard way to measure and compare values.'
        },
        {
          id: 'q8',
          questionText: 'Mobile payment apps like Venmo are examples of cashless transactions.',
          questionType: 'TrueFalse',
          options: ['True', 'False'],
          correctAnswer: 'True',
          points: 10,
          explanation: 'Mobile payment apps facilitate digital transactions without physical cash.'
        }
      ]
    }
  });

  // Week 2: Needs vs. Wants & Financial Values
  console.log('Creating Week 2...');
  const week2 = await prisma.week.create({
    data: {
      unitId: unit1.id,
      weekNumber: 2,
      title: 'Needs vs. Wants & Financial Values',
      description: 'Learn to distinguish between needs and wants, and identify your financial values',
      learningObjectives: [
        'Differentiate between needs, wants, and wishes',
        'Identify personal financial values',
        'Understand how advertising influences spending decisions'
      ]
    }
  });

  await prisma.lesson.createMany({
    data: [
      {
        weekId: week2.id,
        dayNumber: 1,
        title: 'Understanding Needs: The Essentials',
        content: {
          introduction: 'Needs are things required for survival and basic well-being. Learn to identify true needs.',
          keyPoints: [
            'Basic needs include food, shelter, clothing, healthcare, and safety',
            'Needs are essential for survival and maintaining health',
            'The level of "need" can vary based on circumstances and location'
          ],
          activities: [
            'Create a list of your personal needs',
            'Discuss: Is internet access a need or want in 2024?'
          ]
        },
        duration: 50
      },
      {
        weekId: week2.id,
        dayNumber: 2,
        title: 'Understanding Wants: Desires Beyond Basics',
        content: {
          introduction: 'Wants are things that enhance quality of life but aren\'t essential for survival.',
          keyPoints: [
            'Wants improve comfort and happiness but aren\'t essential',
            'Many wants can seem like needs due to social pressure',
            'Distinguishing needs from wants is key to financial success'
          ],
          activities: [
            'Analyze your recent purchases: need or want?',
            'Group discussion: When does a want become a need?'
          ]
        },
        duration: 50
      },
      {
        weekId: week2.id,
        dayNumber: 3,
        title: 'How Advertising Influences Spending',
        content: {
          introduction: 'Advertisers use psychological techniques to turn wants into perceived needs.',
          keyPoints: [
            'Advertising creates desire through emotional appeals',
            'Social media influencers shape spending habits',
            'Understanding marketing tactics helps resist impulse purchases',
            'FOMO (Fear of Missing Out) drives unnecessary spending'
          ],
          activities: [
            'Analyze advertisements: What techniques do they use?',
            'Track ads you see in one day and how they make you feel'
          ]
        },
        duration: 50
      },
      {
        weekId: week2.id,
        dayNumber: 4,
        title: 'Identifying Your Financial Values',
        content: {
          introduction: 'Your financial values guide spending decisions and help prioritize what matters most to you.',
          keyPoints: [
            'Financial values reflect what\'s truly important to you',
            'Values-based spending leads to greater satisfaction',
            'Conflict between values and spending causes financial stress',
            'Clear values help resist peer pressure and advertising'
          ],
          activities: [
            'Complete a financial values assessment',
            'Create a personal financial values statement'
          ],
          toolIntegration: 'Use Budget Calculator to align spending with values'
        },
        duration: 50
      }
    ]
  });

  // Week 3: SMART Goals & Financial Planning
  console.log('Creating Week 3...');
  const week3 = await prisma.week.create({
    data: {
      unitId: unit1.id,
      weekNumber: 3,
      title: 'SMART Goals & Financial Planning',
      description: 'Learn to set effective financial goals using the SMART framework',
      learningObjectives: [
        'Define SMART financial goals',
        'Distinguish between short-term, medium-term, and long-term goals',
        'Create an action plan to achieve financial goals'
      ]
    }
  });

  await prisma.lesson.createMany({
    data: [
      {
        weekId: week3.id,
        dayNumber: 1,
        title: 'Introduction to SMART Goals',
        content: {
          introduction: 'SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.',
          keyPoints: [
            'Specific: Clearly define what you want to achieve',
            'Measurable: Identify how you\'ll track progress',
            'Achievable: Ensure the goal is realistic',
            'Relevant: Align with your values and priorities',
            'Time-bound: Set a deadline for completion'
          ],
          examples: [
            'Vague: "Save money" → SMART: "Save $500 for emergency fund by December 31"',
            'Vague: "Spend less" → SMART: "Reduce dining out to $100/month for next 3 months"'
          ]
        },
        duration: 50
      },
      {
        weekId: week3.id,
        dayNumber: 2,
        title: 'Short-Term vs. Long-Term Goals',
        content: {
          introduction: 'Financial goals can be categorized by timeframe: short-term (< 1 year), medium-term (1-5 years), and long-term (5+ years).',
          keyPoints: [
            'Short-term: Emergency fund, paying off credit card, saving for concert',
            'Medium-term: Down payment on car, college savings, vacation fund',
            'Long-term: Retirement savings, buying a home, starting a business',
            'Balance all three types for comprehensive financial health'
          ],
          activities: [
            'Identify one goal in each timeframe',
            'Create a vision board for your long-term goals'
          ]
        },
        duration: 50
      },
      {
        weekId: week3.id,
        dayNumber: 3,
        title: 'Creating Your Financial Action Plan',
        content: {
          introduction: 'An action plan breaks down goals into specific steps with deadlines.',
          keyPoints: [
            'Identify the specific actions needed to reach your goal',
            'Set milestones to track progress',
            'Anticipate obstacles and plan solutions',
            'Review and adjust your plan regularly'
          ],
          activities: [
            'Create a detailed action plan for one SMART goal',
            'Identify potential obstacles and solutions'
          ]
        },
        duration: 50
      },
      {
        weekId: week3.id,
        dayNumber: 4,
        title: 'Staying Motivated & Adjusting Goals',
        content: {
          introduction: 'Learn strategies to maintain motivation and adjust goals as circumstances change.',
          keyPoints: [
            'Track progress visually (charts, apps, journals)',
            'Celebrate milestones along the way',
            'Build accountability through sharing goals with others',
            'Adjust goals when circumstances change',
            'Learn from setbacks rather than giving up'
          ],
          activities: [
            'Set up a goal-tracking system',
            'Partner accountability check-ins'
          ],
          toolIntegration: 'Introduction to Wealth Tracker tool'
        },
        duration: 50
      }
    ]
  });

  // Week 4: Introduction to Budgeting & 50/20/30 Rule
  console.log('Creating Week 4...');
  const week4 = await prisma.week.create({
    data: {
      unitId: unit1.id,
      weekNumber: 4,
      title: 'Introduction to Budgeting & 50/20/30 Rule',
      description: 'Learn budgeting fundamentals and apply the 50/20/30 rule',
      learningObjectives: [
        'Explain why budgeting is essential for financial success',
        'Apply the 50/20/30 budgeting rule',
        'Create a personal budget',
        'Track income and expenses'
      ]
    }
  });

  await prisma.lesson.createMany({
    data: [
      {
        weekId: week4.id,
        dayNumber: 1,
        title: 'What is a Budget and Why It Matters',
        content: {
          introduction: 'A budget is a plan for how to spend and save your money. It\'s the foundation of financial success.',
          keyPoints: [
            'A budget helps ensure you don\'t spend more than you earn',
            'Budgeting enables you to save for goals and emergencies',
            'Without a budget, money often "disappears" on untracked expenses',
            'Budgets provide financial freedom, not restriction'
          ],
          activities: [
            'Discuss: Why do many people avoid budgeting?',
            'Estimate your current monthly spending'
          ]
        },
        duration: 50
      },
      {
        weekId: week4.id,
        dayNumber: 2,
        title: 'The 50/20/30 Rule Explained',
        content: {
          introduction: 'The 50/20/30 rule is a simple budgeting framework: 50% needs, 20% savings, 30% wants.',
          keyPoints: [
            '50% of income goes to needs (housing, food, utilities, transportation)',
            '20% goes to savings and debt repayment',
            '30% goes to wants (entertainment, hobbies, dining out)',
            'This rule provides flexibility while ensuring savings',
            'Percentages can be adjusted based on circumstances'
          ],
          activities: [
            'Calculate 50/20/30 split for different income levels',
            'Discuss: When might you adjust these percentages?'
          ]
        },
        duration: 50
      },
      {
        weekId: week4.id,
        dayNumber: 3,
        title: 'Tracking Income and Expenses',
        content: {
          introduction: 'Accurate tracking is essential for effective budgeting. Learn methods to track your money flow.',
          keyPoints: [
            'Track all income sources (job, allowance, gifts, side hustles)',
            'Record all expenses, no matter how small',
            'Use apps, spreadsheets, or paper methods',
            'Review spending patterns weekly',
            'Categorize expenses to identify problem areas'
          ],
          activities: [
            'Set up an expense tracking system',
            'Track all spending for one day'
          ],
          toolIntegration: 'Hands-on practice with Budget Calculator'
        },
        duration: 50
      },
      {
        weekId: week4.id,
        dayNumber: 4,
        title: 'Creating Your First Budget',
        content: {
          introduction: 'Put it all together by creating your own budget using the 50/20/30 rule.',
          keyPoints: [
            'Start with total monthly income',
            'List fixed expenses first (rent, insurance, subscriptions)',
            'Estimate variable expenses (food, entertainment)',
            'Apply 50/20/30 rule to categorize spending',
            'Identify areas to adjust if spending exceeds income'
          ],
          activities: [
            'Create a complete monthly budget',
            'Share and get feedback from a partner',
            'Identify two ways to reduce spending or increase income'
          ],
          toolIntegration: 'Complete Budget Calculator exercise',
          projectAssignment: 'Unit 1 Project: Create a 3-month budget plan with specific savings goal'
        },
        duration: 50
      }
    ]
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
  console.log('\n📖 Course 1 Units 1-4 created with lessons and quizzes');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
