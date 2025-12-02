# Wealth Builder MVP - Financial Literacy Platform

A comprehensive financial literacy SaaS platform for high school students and youth programs, aligned with ED/IES SBIR Phase I requirements.

## Overview

Wealth Builder is an educational platform designed to teach financial literacy to students ages 15-17 through interactive lessons, assessments, and real-world tools. The platform supports both traditional academic classrooms and flexible youth program settings.

### Key Features

- **Two Comprehensive Courses**
  - Course 1: Financial Foundations & Smart Money Management (18 weeks, required)
  - Course 2: Investing & Wealth Building (18 weeks, optional)

- **Three User Roles**
  - Students: Complete lessons, take quizzes, use financial tools
  - Teachers: Manage classes, track progress, grade assignments
  - Facilitators: Run youth program sessions with flexible scheduling

- **Interactive Financial Tools**
  - Budget Calculator (50/20/30 rule)
  - Wealth Tracker (net worth tracking)
  - Portfolio Simulator (virtual $100K investment practice)

- **Adaptive Learning System**
  - Personalized dashboards
  - Progress tracking
  - Auto-graded assessments
  - Real-world project assignments

## Tech Stack

### Backend
- **Node.js** with **Express.js** - RESTful API server
- **PostgreSQL** - Relational database
- **Prisma ORM** - Type-safe database access
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend (Planned)
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **TailwindCSS** - Styling

## Project Structure

```
wealth-builder-mvp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Database seed script
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js         # Authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # Authentication endpoints
│   │   │   ├── users.js        # User profile endpoints
│   │   │   ├── courses.js      # Course curriculum endpoints
│   │   │   ├── classes.js      # Class management endpoints
│   │   │   ├── lessons.js      # Lesson viewing & completion
│   │   │   ├── quizzes.js      # Quiz taking & grading
│   │   │   ├── budget.js       # Budget Calculator tool
│   │   │   ├── wealthTracker.js # Wealth Tracker tool
│   │   │   └── dashboard.js    # Dashboard data aggregation
│   │   └── server.js           # Express app entry point
│   ├── .env.example            # Environment variables template
│   └── package.json
└── frontend/                   # (To be built)
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

### Backend Setup

1. **Clone the repository**
   ```bash
   cd wealth-builder-mvp/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/wealth_builder"
   JWT_SECRET="your-super-secret-jwt-key-change-this"
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL="http://localhost:3000"
   JWT_EXPIRES_IN="7d"
   ```

4. **Create PostgreSQL database**
   ```bash
   psql -U postgres
   CREATE DATABASE wealth_builder;
   \q
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Seed the database**
   ```bash
   npm run seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be running at `http://localhost:5000`

### Demo Accounts

After seeding, these accounts are available for testing:

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher@wealthbuilder.com | teacher123 |
| Facilitator | facilitator@wealthbuilder.com | facilitator123 |
| Student | student1@wealthbuilder.com | student123 |
| Student | student2@wealthbuilder.com | student123 |

**Demo Class Enrollment Code:** `FINLIT2024`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and receive JWT token

### User Profile
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update user profile

### Courses & Curriculum
- `GET /api/courses` - List all active courses
- `GET /api/courses/:id` - Get course with full curriculum

### Class Management
- `POST /api/classes` - Create new class (Teacher/Facilitator)
- `GET /api/classes` - Get user's classes
- `GET /api/classes/:id` - Get class details
- `POST /api/classes/:id/enroll` - Enroll in class (Student)

### Lessons
- `GET /api/lessons/:id` - Get lesson content
- `POST /api/lessons/:id/complete` - Mark lesson complete
- `GET /api/lessons/week/:weekId` - Get all lessons for a week

### Quizzes
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes/:id/start` - Start quiz attempt
- `POST /api/quizzes/:id/submit` - Submit quiz for grading
- `GET /api/quizzes/attempt/:attemptId` - Get attempt results

### Budget Calculator Tool
- `GET /api/budget` - Get all budget entries
- `GET /api/budget/:id` - Get single budget entry
- `POST /api/budget` - Create budget entry
- `PATCH /api/budget/:id` - Update budget entry
- `DELETE /api/budget/:id` - Delete budget entry
- `POST /api/budget/calculate` - Calculate 50/20/30 recommendation

### Wealth Tracker Tool
- `GET /api/wealth-tracker` - Get wealth entries
- `GET /api/wealth-tracker/:id` - Get single entry
- `POST /api/wealth-tracker` - Create wealth entry
- `PATCH /api/wealth-tracker/:id` - Update wealth entry
- `DELETE /api/wealth-tracker/:id` - Delete wealth entry
- `GET /api/wealth-tracker/analytics/growth` - Get growth analytics

### Dashboards
- `GET /api/dashboard/student` - Get student dashboard data
- `GET /api/dashboard/teacher` - Get teacher dashboard data
- `GET /api/dashboard/gradebook/:classId` - Get class gradebook

## Database Schema

### Core Entities

- **User** - Students, Teachers, Facilitators
- **Course** - Course 1 & Course 2
- **Unit** - Course units (4-5 per course)
- **Week** - Weekly curriculum (4 weeks per unit)
- **Lesson** - Daily lessons with content
- **Quiz** - Weekly assessments with auto-grading
- **ClassGroup** - Class instances
- **Enrollment** - Student-class relationships
- **Grade** - Points earned across categories
- **LessonCompletion** - Lesson progress tracking
- **QuizAttempt** - Quiz submissions with results
- **BudgetEntry** - Budget Calculator data
- **WealthTrackerEntry** - Wealth Tracker data

### Grading System

Four weighted categories (customizable per class):
- **Projects** (40%) - Real-world applications
- **Quizzes** (30%) - Weekly assessments
- **Participation** (20%) - Lesson completion
- **Real-World** (10%) - Tool usage & reflections

## Development Scripts

```bash
# Start development server with hot reload
npm run dev

# Run Prisma migrations
npm run migrate

# Seed database with demo data
npm run seed

# Open Prisma Studio (database GUI)
npm run studio

# Generate Prisma Client
npx prisma generate

# Reset database (careful!)
npx prisma migrate reset
```

## MVP Scope (Phase I)

### Completed
- ✅ Backend API with Express and PostgreSQL
- ✅ Authentication system (JWT)
- ✅ User management (Students, Teachers, Facilitators)
- ✅ Course 1 Units 1-4 curriculum
- ✅ Lesson viewing and completion tracking
- ✅ Quiz system with auto-grading
- ✅ Budget Calculator tool
- ✅ Wealth Tracker tool
- ✅ Student and Teacher dashboards
- ✅ Gradebook with weighted grading
- ✅ Class management and enrollment

### In Progress
- 🔄 React frontend development
- 🔄 Student Dashboard UI
- 🔄 Teacher Dashboard UI
- 🔄 Lesson viewer component
- 🔄 Quiz interface
- 🔄 Budget Calculator UI
- 🔄 Wealth Tracker UI

### Future Enhancements (Phase II)
- Course 1 Units 5-18
- Course 2 complete curriculum
- Portfolio Simulator tool
- Mobile app (iOS/Android)
- Parent portal
- Advanced analytics
- Gamification elements
- Integration with LMS platforms

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Role-based access control (RBAC)
- Request rate limiting
- Helmet.js security headers
- CORS configuration
- Input validation
- SQL injection prevention (Prisma ORM)

## Testing

```bash
# Run tests (when implemented)
npm test

# Test API endpoints
# Use Postman, Insomnia, or curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@wealthbuilder.com","password":"student123"}'
```

## Deployment

### Backend Deployment (Heroku, Render, Railway)

1. Set environment variables
2. Connect PostgreSQL database
3. Run migrations: `npm run migrate`
4. Run seed: `npm run seed`
5. Deploy application

### Frontend Deployment (Vercel, Netlify)

1. Build React app: `npm run build`
2. Deploy static files
3. Configure API endpoint URLs

## Contributing

This is an MVP for Phase I pilot studies. Contributions are welcome after initial deployment.

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.

## Acknowledgments

- ED/IES SBIR Program
- Baton Rouge pilot school partners
- Financial literacy curriculum consultants

---

**Built with ❤️ for the next generation of financially literate citizens**
