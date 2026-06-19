# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Whenever working with any third-party library or something similar, you MUST look up the official documentation to ensure that you are working with up-to-date information.
Use the DocsExplorer subagent for efficient documnetation lookup.

## Project Overview

TaskFlow is a task management app built on **Next.js 16** (App Router) with **React 19**. It uses Clerk for authentication, Drizzle ORM against a Neon serverless Postgres database, and shadcn UI components styled with Tailwind CSS v4.

## Development Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint (flat config in `eslint.config.mjs`)

Drizzle (no npm script wrappers — invoke `drizzle-kit` directly):

- `npx drizzle-kit generate` — generate SQL migrations from `db/schema.ts` into `./drizzle`
- `npx drizzle-kit push` — push the schema straight to the database
- `npx drizzle-kit studio` — open Drizzle Studio

shadcn UI:

- `npx shadcn@latest add [component]` — add components into `components/ui/`

Tests use **Jest** with **React Testing Library**:

- `npm test` — run all tests
- `npm run test:watch` — run in watch mode

Config files: `jest.config.ts`, `jest.setup.ts`, `babel.config.js`. Tests live in `tests/` and follow the naming convention `<page-function-lowercase>.test.tsx` (e.g. `tests/home.test.tsx` for the `Home` page). Async server components are tested by calling them as async functions, awaiting the returned JSX, then passing it to `render`.

## Environment

`DATABASE_URL` (Neon Postgres connection string) must be set — `db/index.ts` and `drizzle.config.ts` both read it. Clerk requires its publishable/secret keys in the environment. `drizzle.config.ts` loads `.env` via `dotenv/config`.

## Architecture

**Authentication (Clerk).** Auth is wired in two places:

- `app/layout.tsx` wraps the app in `<ClerkProvider>`.
- `proxy.ts` (Next.js 16's renamed middleware file — not `middleware.ts`) runs `clerkMiddleware`. **Every route is protected by default**; only routes matched by `isPublicRoute` (currently `/landing(.*)`) are public. New public pages must be added to that matcher in `proxy.ts`.

**Data layer (Drizzle + Neon).** The flow is `db/schema.ts` → `lib/queries/*` → callers.

- `db/schema.ts` defines tables (the `tasks` table: uuid PK, `userId`, title, description, dueDate, completed, timestamps).
- `db/index.ts` exports a single `db` client via `drizzle-orm/neon-http`.
- `lib/queries/tasks.ts` holds all task data access as plain async functions. **Every query is scoped by `userId`** (the Clerk user id) — preserve this pattern so users only ever touch their own rows.
- `lib/validators/tasks.ts` defines Zod schemas (`createTaskSchema`, `updateTaskSchema`, etc.) and exports inferred input types. Validate untrusted input against these before calling query functions.

**UI (shadcn + Tailwind v4).** Configured in `components.json`: `radix-nova` style, `neutral` base color, Tabler icon library, CSS variables in `app/globals.css`. Components live in `components/ui/` (generated) and `components/` (app-specific, e.g. `navbar.tsx`). Tailwind v4 uses `@import "tailwindcss";` — there is no `tailwind.config`.

**Path aliases** (`tsconfig.json` + `components.json`): `@/*` maps to the repo root, so `@/db`, `@/lib/utils`, `@/components/ui`, etc.

## MCP

`.mcp.json` configures the **Neon** MCP server (`https://mcp.neon.tech/mcp`) for managing the database directly.

## Notes

- Next.js 16 + React 19 — expect breaking changes from older Next conventions (notably the `proxy.ts` middleware filename).
- Follow the existing query/validator separation when adding new data operations rather than calling `db` directly from components.
