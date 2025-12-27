# Project Tasks & Roadmap

## 1. System Audit & Architecture
- [x] Audit existing database schema (`schema.sql`).
- [x] Audit authentication flow (`functions/api/auth/register.ts`).
- [x] Audit frontend registration (`src/pages/Register.tsx`).
- [x] Identify missing relationships for Student-Teacher bonding.

## 2. Database Enhancements
- [x] **Migration**: Add `instructor_id` column to `students` table.
- [x] **Migration**: Ensure `users` table `student_id` is properly utilized.
- [x] **Migration**: Add `profile_image` support if not fully covered by `avatar_url`.

## 3. Backend Development (Cloudflare Pages Functions)
- [x] **API Endpoint**: Create `GET /api/instructors` to list available teachers for registration.
- [x] **Auth Update**: Modify `POST /api/auth/register` to:
    - Accept `instructorId`.
    - Create a `students` record immediately upon user registration.
    - Link `users` record to `students` record.
    - Assign the selected `instructorId` to the student.
- [x] **Student API**: Ensure `GET /api/students` respects the `instructor_id` relationship (Instructors see their bonded students).
- [x] **Student Portal API**: Create endpoints for students to fetch their own data:
    - `GET /api/student/profile` (or use `/api/auth/me` with expanded data).
    - `GET /api/student/classes` (classes they are enrolled in).
    - `GET /api/student/payments` (their payment history).

## 4. Frontend Development
### Registration Flow
- [x] **Component**: Create `InstructorSelect` component.
- [x] **Page Update**: Update `Register.tsx` to:
    - Fetch list of instructors.
    - Show instructor selection when "Student" role is selected.
    - Pass `instructorId` to the register function.

### Student Portal (Dashboard)
- [x] **Layout**: Create a specific layout or view for Students (vs Admin/Instructor).
- [x] **Dashboard**: Create `StudentDashboard.tsx` showing:
    - Next class.
    - Recent activity.
    - Quick stats (attendance).
- [x] **Profile**: Create/Update Profile page for students to edit name, avatar, etc.
- [x] **Classes**: View available classes and enrolled classes.
- [x] **Payments**: View payment history and status.

### Admin/Instructor View
- [x] **Student List**: Update `StudentManager.tsx` to filter/show students bonded to the logged-in instructor.
- [x] **Enrollment**: Allow instructors to add their students to classes.

## 5. Improvements & Optimizations
- [x] **Validation**: Enhance Zod schemas for new registration fields.
- [x] **Security**: Ensure students can only access their own data (RLS-like logic in API).
- [x] **UX**: Add success feedback after registration and redirection to the correct dashboard.
- [x] **Performance**: Optimize `useStudents` and `useClasses` hooks to avoid over-fetching.

## 6. Testing & Deployment
- [x] **Test**: Manual testing of the full registration flow.
- [x] **Test**: Verify student-teacher data visibility.
- [x] **Deploy**: Run build and prepare for deployment.

## Worklog
- **2025-12-27**: Initial audit and roadmap creation.
- **2025-12-27**: Implemented database changes, backend APIs for registration and student portal, and frontend registration flow and dashboard.
- **2025-12-27**: Implemented Student Profile page with avatar upload, updated navigation, and verified class enrollment permissions.
- **2025-12-27**: Fixed linting and typecheck errors, removed `any` types, and prepared for deployment.
- **2025-12-27**: Committed changes, pushed to repository, and successfully deployed to Cloudflare Pages.
