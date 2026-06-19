'use client';

import { useState, useTransition } from 'react';
import { editTaskAction } from '@/actions/tasks';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type EditTaskDialogProps = {
  task: {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | string | null;
  };
};

// Convert a Date (or ISO string) into the yyyy-mm-dd format an <input type="date"> expects.
function toDateInputValue(value: Date | string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function EditTaskDialog({ task }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await editTaskAction({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          Update
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update task</DialogTitle>
            <DialogDescription>
              Edit the title, description, and due date for this task.
            </DialogDescription>
          </DialogHeader>

          <input type='hidden' name='id' value={task.id} />

          <div className='flex flex-col gap-4 py-4'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor={`title-${task.id}`}>Title</Label>
              <Input id={`title-${task.id}`} name='title' defaultValue={task.title} required />
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor={`description-${task.id}`}>Description</Label>
              <Textarea
                id={`description-${task.id}`}
                name='description'
                defaultValue={task.description ?? ''}
                rows={3}
              />
            </div>

            <div className='flex flex-col gap-2'>
              <Label htmlFor={`dueDate-${task.id}`}>Due date</Label>
              <Input
                id={`dueDate-${task.id}`}
                name='dueDate'
                type='date'
                defaultValue={toDateInputValue(task.dueDate)}
              />
            </div>

            {error ? <p className='text-sm text-destructive'>{error}</p> : null}
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type='submit' disabled={pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
