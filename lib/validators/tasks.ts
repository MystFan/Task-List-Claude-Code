import { z } from "zod";

// Schema for creating a new task
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z
    .string()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return date > new Date();
    }, "Due date must be in the future")
    .nullable()
    .optional(),
});

// Schema for updating an existing task
export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(), // ISO string or null
  completed: z.boolean(),
});

// Schema for editing a task's details (title, description, due date)
export const editTaskDetailsSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().nullable().optional(), // ISO string or null
});

// Schema for toggling task completion
export const toggleTaskCompletionSchema = z.object({
  id: z.string().uuid(),
  completed: z.boolean(),
});

// Schema for deleting a task
export const deleteTaskSchema = z.object({
  id: z.string().uuid(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type EditTaskDetailsInput = z.infer<typeof editTaskDetailsSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleTaskCompletionInput = z.infer<typeof toggleTaskCompletionSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;