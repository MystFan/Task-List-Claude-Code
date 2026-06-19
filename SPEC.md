# Task Management Application - Technical Documentation

## 1. Introduction

### Purpose

The Task Management Application is a multi-user task tracking system that enables authenticated users to create, manage, update, and complete personal tasks. The application is built using modern web technologies and follows a layered architecture pattern to ensure maintainability, scalability, security, and testability.

### Objectives

- Provide secure user-specific task management.
- Enforce strict data ownership and authorization.
- Maintain strong type safety across the application.
- Deliver a responsive and accessible user experience.
- Enable future extensibility with minimal architectural changes.

---

# 2. Technology Stack

## Frontend

| Technology      | Purpose                    |
| --------------- | -------------------------- |
| Next.js 16      | Full-stack React framework |
| React 19        | User interface rendering   |
| TypeScript      | Static type checking       |
| Tailwind CSS v4 | Styling system             |
| shadcn/ui       | Reusable UI components     |

## Backend

| Technology             | Purpose                            |
| ---------------------- | ---------------------------------- |
| Next.js Server Actions | Backend operations                 |
| Clerk                  | Authentication and user management |
| Zod                    | Input validation                   |
| Drizzle ORM            | Database abstraction               |

## Database

| Technology | Purpose                       |
| ---------- | ----------------------------- |
| PostgreSQL | Relational database           |
| Neon       | Serverless PostgreSQL hosting |

## Testing

| Technology            | Purpose                        |
| --------------------- | ------------------------------ |
| Jest 30               | Test runner                    |
| React Testing Library | Component testing              |
| jsdom                 | Browser environment simulation |

---

# 3. System Architecture

The application follows a layered architecture model.

```text
Presentation Layer
        │
        ▼
Server Actions Layer
        │
        ▼
Validation Layer
        │
        ▼
Data Access Layer
        │
        ▼
Database Layer
```

Each layer has a single responsibility and communicates only with adjacent layers.

---

# 4. Project Structure

```text
app/
├── page.tsx
├── layout.tsx
├── globals.css
├── favicon.ico
└── landing/
    └── page.tsx

actions/
└── tasks.ts

components/
├── navbar.tsx
├── create-task-dialog.tsx
├── edit-task-dialog.tsx
├── delete-task-dialog.tsx
├── complete-task-dialog.tsx
└── ui/

lib/
├── queries/
│   └── tasks.ts
├── validators/
│   └── tasks.ts
└── utils.ts

db/
├── index.ts
└── schema.ts

tests/
└── home.test.tsx
```

---

# 5. Layer Responsibilities

## 5.1 Presentation Layer

### Location

```text
app/
components/
```

### Responsibilities

- Render user interface.
- Display task information.
- Collect user input.
- Trigger server actions.
- Show loading and error states.

### Components

#### Dashboard

Displays:

- Task list
- Task statistics
- Create task functionality

#### Dialog Components

| Component          | Purpose                 |
| ------------------ | ----------------------- |
| CreateTaskDialog   | Create a task           |
| EditTaskDialog     | Update task information |
| DeleteTaskDialog   | Confirm deletion        |
| CompleteTaskDialog | Mark task complete      |

---

## 5.2 Server Actions Layer

### Location

```text
actions/tasks.ts
```

### Responsibilities

- Receive requests from UI.
- Validate user authentication.
- Validate input data.
- Execute database operations.
- Handle errors.
- Revalidate cache.

### Available Actions

```typescript
createTask();
updateTask();
deleteTask();
toggleTaskCompletion();
```

### Workflow

```text
UI Request
    ↓
Server Action
    ↓
Authentication
    ↓
Validation
    ↓
Database Query
    ↓
Response
```

---

## 5.3 Validation Layer

### Location

```text
lib/validators/tasks.ts
```

### Technology

Zod

### Responsibilities

- Validate incoming data.
- Enforce schema constraints.
- Provide typed inputs.

### Example Schema

```typescript
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  dueDate: z.date().optional(),
});
```

### Benefits

- Runtime validation.
- Type inference.
- Consistent validation rules.

---

## 5.4 Data Access Layer

### Location

```text
lib/queries/tasks.ts
```

### Responsibilities

- Encapsulate database logic.
- Apply ownership filters.
- Return typed results.

### Example Query

```typescript
db.select().from(tasks).where(eq(tasks.userId, userId));
```

### Benefits

- Centralized database access.
- Improved maintainability.
- Easier testing.

---

## 5.5 Database Layer

### Location

```text
db/
```

### Components

#### index.ts

Responsible for:

- Database connection
- Drizzle configuration
- Neon client initialization

#### schema.ts

Contains table definitions and constraints.

---

# 6. Authentication and Authorization

## Authentication

Authentication is handled by Clerk.

### Flow

```text
User Login
    ↓
Clerk Session
    ↓
Server Action
    ↓
auth()
    ↓
Current User ID
```

## Authorization

Authorization is enforced at the server level.

Every task operation requires ownership verification.

Example:

```typescript
where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
```

### Security Principles

- No client-side authorization.
- Ownership enforced on every query.
- User isolation guaranteed by database filtering.

---

# 7. Database Design

## Tasks Table

| Column      | Type      | Description           |
| ----------- | --------- | --------------------- |
| id          | UUID      | Primary key           |
| userId      | String    | Clerk user identifier |
| title       | String    | Task title            |
| description | Text      | Optional description  |
| dueDate     | Timestamp | Optional due date     |
| completed   | Boolean   | Completion status     |
| createdAt   | Timestamp | Creation timestamp    |
| updatedAt   | Timestamp | Last update timestamp |

### Entity Relationship

```text
User (Clerk)
    │
    │ 1:N
    ▼
Tasks
```

A user may own multiple tasks.

Each task belongs to exactly one user.

---

# 8. Security Architecture

## Data Ownership

Every database operation includes:

```sql
WHERE user_id = current_user_id
```

## Validation

All incoming data is validated before processing.

## Attack Mitigation

### Unauthorized Access

Mitigated through:

- Clerk authentication
- Ownership checks

### Invalid Input

Mitigated through:

- Zod validation

### Data Leakage

Mitigated through:

- User-scoped queries

### Direct Object Reference Attacks

Mitigated through:

- Ownership verification on every mutation

---

# 9. User Workflow

## Create Task

```text
User Input
    ↓
Create Dialog
    ↓
Server Action
    ↓
Validation
    ↓
Database Insert
    ↓
Cache Revalidation
    ↓
Updated Dashboard
```

## Update Task

```text
Select Task
    ↓
Edit Dialog
    ↓
Server Action
    ↓
Validation
    ↓
Database Update
    ↓
Refresh UI
```

## Complete Task

```text
Select Task
    ↓
Completion Dialog
    ↓
Toggle Status
    ↓
Update Database
```

## Delete Task

```text
Select Task
    ↓
Confirmation Dialog
    ↓
Delete Action
    ↓
Database Delete
```

---

# 10. Testing Strategy

## Test Environment

- Jest 30
- React Testing Library
- jsdom

## Configuration Files

### jest.config.ts

Responsible for:

- Environment setup
- Module aliases
- Test discovery

### jest.setup.ts

Responsible for:

```typescript
import '@testing-library/jest-dom';
```

### babel.config.js

Responsible for:

- TypeScript transformation
- JSX transformation

---

## Testing Conventions

### Naming

```text
Home Component
↓
home.test.tsx
```

### Server Component Testing

```typescript
const Page = await Home();
render(Page);
```

### Mocking Strategy

External dependencies are mocked:

```typescript
jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/queries/tasks');
```

### Benefits

- Isolated unit tests.
- Fast execution.
- Predictable behavior.

---

# 11. Performance Considerations

## Database

Recommended indexes:

```sql
CREATE INDEX idx_tasks_user_id
ON tasks(user_id);

CREATE INDEX idx_tasks_completed
ON tasks(completed);

CREATE INDEX idx_tasks_due_date
ON tasks(due_date);
```

## Application

- Server Components reduce client bundle size.
- Server Actions eliminate API boilerplate.
- Database queries are user-scoped.
- Cache revalidation ensures fresh data.

---

# 12. Future Enhancements

Potential future features include:

### Task Labels

```text
Tasks
 └── Labels
```

### Task Priorities

```text
Low
Medium
High
Critical
```

### Teams and Collaboration

```text
Organization
    └── Team
          └── Tasks
```

### Task Attachments

- File uploads
- Document storage

### Notifications

- Due date reminders
- Email notifications

### Audit Logging

Track:

- Creation events
- Updates
- Deletions
- Completion history

---

# 13. Conclusion

The Task Management Application uses a secure, scalable, and maintainable architecture built on Next.js, TypeScript, Clerk, Drizzle ORM, and PostgreSQL. The layered architecture separates concerns across presentation, validation, business logic, and persistence layers, ensuring strong security guarantees, excellent developer experience, and a solid foundation for future growth.
