# 9 Dimes Project Wealth Builder - MVP

A financial literacy SaaS platform for high school students, aligned with ED/IES SBIR Phase I requirements.

## Project Overview

The **9 Dimes Project Wealth Builder** is an educational platform that teaches high school students critical financial literacy skills through interactive lessons, quizzes, and practical tools.

## Features

### For Students
- Dashboard with grades, classes, and progress
- Course lessons with structured navigation
- Interactive quizzes with instant grading
- Budget Calculator (50/30/20 rule)
- Wealth Tracker (assets, liabilities, net worth)

### For Teachers
- Class management with enrollment codes
- Student progress monitoring
- Grade analytics
- Course content access

## Tech Stack
- Backend: Node.js, Express, PostgreSQL, Prisma
- Frontend: React, Vite, React Router

## Quick Start

### Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev
node prisma/seed-simple.js
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Demo Accounts
- Student: student1@wealthbuilder.com / student123
- Teacher: teacher@wealthbuilder.com / teacher123

## GitHub
https://github.com/sithvalentine/wealth-builder-mvp
