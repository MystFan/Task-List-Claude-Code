import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/queries/tasks', () => ({
  getTasksByUserIdPaginated: jest.fn(),
  countTasksByUserId: jest.fn(),
  taskSortColumns: {
    title: 'title',
    description: 'description',
    dueDate: 'dueDate',
    status: 'status',
  },
}));

jest.mock('@/components/navbar', () => ({
  Navbar: () => <nav data-testid='navbar' />,
}));

jest.mock('@/components/create-task-dialog', () => ({
  CreateTaskDialog: () => <button>New Task</button>,
}));

jest.mock('@/components/edit-task-dialog', () => ({
  EditTaskDialog: () => <button aria-label='Edit task'>Edit</button>,
}));

jest.mock('@/components/delete-task-dialog', () => ({
  DeleteTaskDialog: () => <button aria-label='Delete task'>Delete</button>,
}));

jest.mock('@/components/complete-task-dialog', () => ({
  CompleteTaskDialog: () => <button aria-label='Toggle completion'>Complete</button>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid='badge' data-variant={variant}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  TableCell: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={className}>{children}</td>
  ),
  TableHead: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <th className={className}>{children}</th>
  ),
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead>{children}</thead>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
}));

jest.mock('@/components/ui/button', () => ({
  buttonVariants: () => 'btn',
}));

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
    className,
    'aria-disabled': ariaDisabled,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    'aria-disabled'?: boolean | string;
  }) {
    return (
      <a href={href} className={className} aria-disabled={ariaDisabled}>
        {children}
      </a>
    );
  };
});

import { auth } from '@clerk/nextjs/server';
import { getTasksByUserIdPaginated, countTasksByUserId } from '@/lib/queries/tasks';

const mockAuth = auth as unknown as jest.Mock;
const mockGetTasks = getTasksByUserIdPaginated as unknown as jest.Mock;
const mockCountTasks = countTasksByUserId as unknown as jest.Mock;

const USER_ID = 'user_test_123';

const makeTask = (overrides: Record<string, unknown> = {}) => ({
  id: 'task_1',
  userId: USER_ID,
  title: 'Test Task',
  description: 'Test description',
  dueDate: null as Date | null,
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const renderHome = async (searchParams: Record<string, string> = {}) => {
  const ui = await Home({ searchParams: Promise.resolve(searchParams) });
  return render(ui as React.ReactElement);
};

describe('Home page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: USER_ID });
  });

  describe('empty state', () => {
    it('shows empty message when user has no tasks', async () => {
      mockCountTasks.mockResolvedValue(0);
      mockGetTasks.mockResolvedValue([]);

      await renderHome();

      expect(screen.getByText("You don't have any tasks yet.")).toBeInTheDocument();
    });

    it('does not render the task table when there are no tasks', async () => {
      mockCountTasks.mockResolvedValue(0);
      mockGetTasks.mockResolvedValue([]);

      await renderHome();

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('shows empty state when userId is null', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      await renderHome();

      expect(screen.getByText("You don't have any tasks yet.")).toBeInTheDocument();
    });
  });

  describe('task list', () => {
    it('renders a task row with title and description', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask()]);

      await renderHome();

      expect(screen.getByText('Test Task')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders "—" for tasks with no description', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([
        makeTask({
          description: null,
          dueDate: new Date('2024-06-15T12:00:00.000Z'),
        }),
      ]);

      await renderHome();

      // description cell is "—"; dueDate cell shows a formatted date
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('shows Pending badge for incomplete tasks', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask({ completed: false })]);

      await renderHome();

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('shows Completed badge for completed tasks', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask({ completed: true })]);

      await renderHome();

      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
  });

  describe('date formatting', () => {
    it('formats a valid due date in en-US short format', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask({ dueDate: new Date('2024-06-15T12:00:00.000Z') })]);

      await renderHome();

      expect(screen.getByText('Jun 15, 2024')).toBeInTheDocument();
    });

    it('renders "—" for tasks with no due date', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask({ description: null, dueDate: null })]);

      await renderHome();

      // Both description and dueDate are null — two "—" cells
      expect(screen.getAllByText('—')).toHaveLength(2);
    });
  });

  describe('pagination', () => {
    it('shows page info with plural tasks label', async () => {
      mockCountTasks.mockResolvedValue(5);
      mockGetTasks.mockResolvedValue([makeTask()]);

      await renderHome();

      expect(screen.getByText(/Page 1 of 1 · 5 tasks/)).toBeInTheDocument();
    });

    it('uses singular "task" label when count is 1', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask()]);

      await renderHome();

      expect(screen.getByText(/1 task$/)).toBeInTheDocument();
    });

    it('disables Previous link on the first page', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask()]);

      await renderHome({ page: '1' });

      expect(screen.getByText('Previous').closest('a')).toHaveAttribute('aria-disabled');
    });

    it('disables Next link on the last page', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask()]);

      await renderHome({ page: '1' });

      expect(screen.getByText('Next').closest('a')).toHaveAttribute('aria-disabled');
    });
  });

  describe('sort indicators', () => {
    it('shows ascending arrow when sorting a column asc', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask()]);

      await renderHome({ sort: 'title', dir: 'asc' });

      expect(screen.getByText('▲')).toBeInTheDocument();
    });

    it('shows descending arrow when sorting a column desc', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask()]);

      await renderHome({ sort: 'title', dir: 'desc' });

      expect(screen.getByText('▼')).toBeInTheDocument();
    });

    it('shows no sort arrow when no sort column is active', async () => {
      mockCountTasks.mockResolvedValue(1);
      mockGetTasks.mockResolvedValue([makeTask()]);

      await renderHome();

      expect(screen.queryByText('▲')).not.toBeInTheDocument();
      expect(screen.queryByText('▼')).not.toBeInTheDocument();
    });
  });
});
