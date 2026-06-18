"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createTask, deleteTask, updateTaskDetails, switchTaskStatus } from "@/lib/queries/tasks";
import {
  createTaskSchema,
  deleteTaskSchema,
  editTaskDetailsSchema,
} from "@/lib/validators/tasks";

export type CreateTaskState = { error?: string };

export async function createTaskAction(
  _prevState: CreateTaskState,
  formData: FormData
): Promise<CreateTaskState> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { title, description, dueDate } = parsed.data;

  try {
    await createTask(
      userId,
      title,
      description ?? undefined,
      dueDate ? new Date(dueDate) : undefined
    );
  } catch {
    return { error: "Failed to create task. Please try again." };
  }

  revalidatePath("/");
  return {};
}

export type EditTaskState = { error?: string };

export async function editTaskAction(
  _prevState: EditTaskState,
  formData: FormData
): Promise<EditTaskState> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const parsed = editTaskDetailsSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    dueDate: formData.get("dueDate") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { id, title, description, dueDate } = parsed.data;

  try {
    await updateTaskDetails(
      id,
      userId,
      title,
      description ?? null,
      dueDate ? new Date(dueDate) : null
    );
  } catch {
    return { error: "Failed to update task. Please try again." };
  }

  revalidatePath("/");
  return {};
}

export type ToggleTaskState = { error?: string };

export async function toggleTaskAction(
  _prevState: ToggleTaskState,
  formData: FormData
): Promise<ToggleTaskState> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const parsed = deleteTaskSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await switchTaskStatus(parsed.data.id, userId);
  } catch {
    return { error: "Failed to update task. Please try again." };
  }

  revalidatePath("/");
  return {};
}

export type DeleteTaskState = { error?: string };

export async function deleteTaskAction(
  _prevState: DeleteTaskState,
  formData: FormData
): Promise<DeleteTaskState> {
  const { userId } = await auth();
  if (!userId) return { error: "Not authenticated" };

  const parsed = deleteTaskSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await deleteTask(parsed.data.id, userId);
  } catch {
    return { error: "Failed to delete task. Please try again." };
  }

  revalidatePath("/");
  return {};
}
