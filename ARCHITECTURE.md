# Task Management Application Architecture

## Overview

This is a multi-user task management system built with Next.js 16, TypeScript, PostgreSQL via Drizzle ORM, and Clerk authentication. The application follows a layered architecture pattern for clean separation of concerns.

## Folder Structure

```
app/
├── page.tsx                      # Main dashboard page (Tasks list)
├── layout.tsx                    # Root layout (ClerkProvider)
├── globals.css                   # Global styles (Tailwind v4)
├── favicon.ico
└── landing/
    └── page.tsx                  # Public landing page
actions/
└── tasks.ts                      # All task server actions (create/update/delete/toggle)
components/
├── navbar.tsx                    # Top navigation bar
├── create-task-dialog.tsx        # Dialog for creating a task
├── edit-task-dialog.tsx          # Dialog for editing a task
├── delete-task-dialog.tsx        # Dialog for deleting a task
├── complete-task-dialog.tsx      # Dialog for marking a task complete
└── ui/                           # shadcn-generated UI primitives
    ├── badge.tsx
    ├── button.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── label.tsx
    ├── table.tsx
    └── textarea.tsx
lib/
├── queries/
│   └── tasks.ts                  # Database query functions (scoped by userId)
├── validators/
│   └── tasks.ts                  # Zod schemas for task input
└── utils.ts                      # Shared utility functions
db/
├── index.ts                      # Drizzle + Neon client
└── schema.ts                     # tasks table schema
tests/
└── home.test.tsx                 # Tests for app/page.tsx
```

## Data Flow Diagram

```
┌─────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│   Client Side   │    │  Server Actions     │    │   Database       │
│                 │    │                     │    │                  │
│  UI Components  │───▶│  Zod Validation     │───▶│  Drizzle ORM     │
│                 │    │  Authorization      │    │  PostgreSQL      │
│                 │    │  Error Handling     │    │                  │
└─────────────────┘    └─────────────────────┘    └──────────────────┘
        │                       │                        │
        │                       │                        │
        ▼                       ▼                        ▼
┌─────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│  Task Dashboard │    │  Server Components  │    │   Tasks Table    │
│                 │    │                     │    │                  │
│  - List Tasks   │    │  - Create Task      │    │  - id            │
│  - Stats        │    │  - Update Task      │    │  - userId        │
│  - Add Task     │    │  - Delete Task      │    │  - title         │
│                 │    │  - Toggle Completion│    │  - description   │
│                 │    │                     │    │  - dueDate       │
│                 │    │                     │    │  - completed     │
│                 │    │                     │    │  - createdAt     │
│                 │    │                     │    │  - updatedAt     │
└─────────────────┘    └─────────────────────┘    └──────────────────┘
```

## Core Components

### 1. Authentication Layer

- Uses Clerk for authentication
- Middleware protection ensures only authenticated users can access routes
- User ID is extracted from Clerk context and used as task owner

### 2. Validation Layer

- Zod schemas for all server actions
- Input validation at server side to prevent malicious data
- Strong typing throughout the application

### 3. Data Access Layer

- Drizzle ORM for database operations
- Database queries include ownership checks (WHERE userId = currentUser.id)
- Schema defined with proper types and constraints

### 4. Server Actions

- CRUD operations implemented as server actions
- All operations verify user ownership
- Proper error handling and caching invalidation

### 5. UI Layer

- Shadcn/UI components for consistent design
- Responsive layout following mobile-first approach
- Accessible components with proper ARIA attributes
- Error states and loading indicators

## Security Model

- Every database query includes `WHERE userId = currentUser.id`
- No client-side authorization checks
- Server actions validate ownership before processing
- All data access is strictly controlled by user context

## Data Model

### Tasks Table

```
id: UUID (Primary Key)
userId: String (Foreign Key to Clerk users)
title: String (Required)
description: String (Optional)
dueDate: Date (Optional)
completed: Boolean (Default: false)
createdAt: Date (Default: now)
updatedAt: Date (Auto-update)
```

## Testing

**Stack:** Jest 30 + React Testing Library + jsdom

**Config files:**

- `jest.config.ts` — testEnvironment, transform, `@/*` alias, test glob
- `jest.setup.ts` — imports `@testing-library/jest-dom` for DOM matchers
- `babel.config.js` — Babel presets for TypeScript + React (JSX automatic runtime)

**Conventions:**

- Test files live in `tests/` and are named after the page/component function in lowercase (e.g. `Home` → `home.test.tsx`).
- Async Next.js server components are tested by calling them as async functions, awaiting the JSX result, then rendering with `render()`.
- All external dependencies (Clerk `auth`, query functions, child components, `next/link`) are mocked at the module level with `jest.mock`.
- `makeTask()` factory helpers avoid repetition in arrange steps.
