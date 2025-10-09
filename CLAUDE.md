# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A martial arts school management application built with React + TypeScript + Vite, deployed on Cloudflare Pages with Cloudflare D1 database backend. The app manages students, classes, payments, attendance, and provides a dashboard view.

## Development Commands

- **Start dev server**: `pnpm dev` (Vite dev server with HMR)
- **Build**: `pnpm build` (TypeScript compile + Vite build)
- **Lint**: `pnpm lint` (ESLint)
- **Preview production build**: `pnpm preview`

## Architecture

### Frontend Architecture

The application uses a **single-page app (SPA)** with React Router for navigation:

- **Entry point**: `src/main.tsx` wraps the app in `AppProvider` for global state
- **Routing**: `src/App.tsx` defines routes with `react-router-dom`:
  - `/` - Dashboard
  - `/students` - StudentManager
  - `/classes` - ClassManager
  - `/payments` - PaymentManager
  - `/calendar` - CalendarView
  - `/attendance/:classId` - AttendanceManager

### State Management

**Context-based global state** in `src/context/AppContext.tsx`:
- Manages three main data collections: `students`, `classes`, `payments`
- Hook: `useApp()` provides access to state and setters
- All components use this shared context rather than local API calls

### Data Layer

**Cloudflare Pages Functions** serve as the API backend:
- Located in `functions/api/` directory
- Export `onRequestGet`, `onRequestPost`, etc. for HTTP methods
- Access Cloudflare D1 database via `env.DB` binding
- Note: `attendance.ts` uses **query parameters** (not path params) - GET requests require `?classId=xxx`

**Database**: Cloudflare D1 (SQLite-compatible)
- Schema defined in `schema.sql`
- Tables: `students`, `classes`, `payments`, `attendance`
- Column naming: snake_case in DB (e.g., `join_date`), camelCase in TypeScript types (e.g., `joinDate`)

### Type System

**Central type definitions** in `src/types.ts`:
- `Student`, `Class`, `Payment`, `Attendance` interfaces
- `Discipline` type for martial arts types
- All components import types from here

### Styling

**Tailwind CSS v4** with PostCSS:
- Config: `tailwind.config.js`, `postcss.config.js`
- Mobile-first design with responsive breakpoints
- Fixed bottom navigation on mobile (`md:hidden`)

## Deployment

**Cloudflare Pages + D1**:
- Config: `wrangler.toml`
- Build output: `dist/` directory
- Database binding: `DB` → `martial-arts-db`
- Deploy: Cloudflare Pages automatically builds from git

## Key Architectural Patterns

1. **API Route Pattern**: Functions in `functions/api/[name].ts` become `/api/[name]` endpoints
2. **Query Parameter Convention**: Dynamic data (like `classId`) passed via query params, not URL paths
3. **Context Provider Pattern**: Single source of truth for app state, initialized empty and populated by components
4. **Type Safety**: TypeScript interfaces ensure consistency between frontend types and database schema (with case conversion)
