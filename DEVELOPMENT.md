# Development Notes

This file contains notes on the development process.

## Architecture

- Frontend: React with TypeScript, Vite
- Routing: React Router
- Styling: Tailwind CSS, mobile-first
- Backend: Cloudflare Workers, D1 database, Auth

## Database Schema

- Students: id, name, email, belt, discipline, join_date, etc.
- Payments: id, student_id, amount, date, type
- Classes: id, date, time, location, instructor, discipline
- Attendance: student_id, class_id, attended

## TODO

- Set up project
- Implement auth
- Create database schema
- Build UI components