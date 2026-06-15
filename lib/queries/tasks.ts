import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq, desc, asc, and, lt, count } from "drizzle-orm";

// Columns the task table can be sorted by, keyed by the value used in the URL.
export const taskSortColumns = {
  title: tasks.title,
  description: tasks.description,
  dueDate: tasks.dueDate,
  status: tasks.completed,
} as const;

export type TaskSortColumn = keyof typeof taskSortColumns;
export type SortDirection = "asc" | "desc";

export const getTasksByUserId = async (userId: string) => {
  return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
};

export const getTasksByUserIdPaginated = async (
  userId: string,
  page: number,
  pageSize: number,
  sort?: TaskSortColumn,
  direction: SortDirection = "asc"
) => {
  const column = sort ? taskSortColumns[sort] : tasks.createdAt;
  const orderBy = sort
    ? direction === "desc"
      ? desc(column)
      : asc(column)
    : desc(tasks.createdAt);

  return await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
};

export const countTasksByUserId = async (userId: string) => {
  const result = await db.select({ value: count() }).from(tasks).where(eq(tasks.userId, userId));
  return result[0]?.value ?? 0;
};

export const getTaskById = async (id: string, userId: string) => {
  return await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
};

export const getCompletedTasksByUserId = async (userId: string) => {
  return await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.completed, true))).orderBy(desc(tasks.createdAt));
};

export const getPendingTasksByUserId = async (userId: string) => {
  return await db.select().from(tasks).where(and(eq(tasks.userId, userId), eq(tasks.completed, false))).orderBy(desc(tasks.createdAt));
};

export const getOverdueTasksByUserId = async (userId: string) => {
  const now = new Date();
  return await db.select().from(tasks).where(
    and(
      eq(tasks.userId, userId),
      eq(tasks.completed, false),
      lt(tasks.dueDate, now)
    )
  ).orderBy(desc(tasks.createdAt));
};

export const createTask = async (userId: string, title: string, description?: string, dueDate?: Date) => {
  const newTask = await db.insert(tasks).values({
    userId,
    title,
    description,
    dueDate,
  }).returning();

  return newTask[0];
};

export const updateTask = async (id: string, userId: string, title: string, description?: string, dueDate?: Date, completed?: boolean) => {
  const updatedTask = await db.update(tasks).set({
    title,
    description,
    dueDate,
    completed,
    updatedAt: new Date(),
  }).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();

  return updatedTask[0];
};

// Updates only a task's editable details. Description and due date are set
// explicitly (including to null) so the caller can clear them.
export const updateTaskDetails = async (
  id: string,
  userId: string,
  title: string,
  description: string | null,
  dueDate: Date | null
) => {
  const updatedTask = await db
    .update(tasks)
    .set({
      title,
      description,
      dueDate,
      updatedAt: new Date(),
    })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning();

  return updatedTask[0];
};

export const deleteTask = async (id: string, userId: string) => {
  const deletedTask = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();

  return deletedTask[0];
};

export const toggleTaskCompletion = async (id: string, userId: string, completed: boolean) => {
  const updatedTask = await db.update(tasks).set({
    completed,
    updatedAt: new Date(),
  }).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning();

  return updatedTask[0];
};

export const switchTaskStatus = async (id: string, userId: string) => {
  const [task] = await db
    .select({ completed: tasks.completed })
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .limit(1);
  if (!task) return undefined;
  const result = await db
    .update(tasks)
    .set({ completed: !task.completed, updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning();
  return result[0];
};