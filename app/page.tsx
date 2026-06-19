import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { Navbar } from '@/components/navbar';
import {
  getTasksByUserIdPaginated,
  countTasksByUserId,
  taskSortColumns,
  type TaskSortColumn,
  type SortDirection,
} from '@/lib/queries/tasks';
import { Badge } from '@/components/ui/badge';
import { CreateTaskDialog } from '@/components/create-task-dialog';
import { EditTaskDialog } from '@/components/edit-task-dialog';
import { DeleteTaskDialog } from '@/components/delete-task-dialog';
import { CompleteTaskDialog } from '@/components/complete-task-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PAGE_SIZE = 15;

const SORTABLE_COLUMNS: { key: TaskSortColumn; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'status', label: 'Status' },
];

function formatDate(date: Date | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; dir?: string }>;
}) {
  const { userId } = await auth();

  const { page: pageParam, sort: sortParam, dir: dirParam } = await searchParams;
  const requestedPage = Number(pageParam);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const sort: TaskSortColumn | undefined =
    sortParam && sortParam in taskSortColumns ? (sortParam as TaskSortColumn) : undefined;
  const direction: SortDirection = dirParam === 'desc' ? 'desc' : 'asc';

  // Every route except /landing is protected by proxy.ts, so userId is
  // expected here; guard defensively just in case.
  const totalTasks = userId ? await countTasksByUserId(userId) : 0;
  const totalPages = Math.max(1, Math.ceil(totalTasks / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const tasks = userId
    ? await getTasksByUserIdPaginated(userId, currentPage, PAGE_SIZE, sort, direction)
    : [];

  const buildSortHref = (column: TaskSortColumn) => {
    // Toggle direction if already sorting by this column, else default to asc.
    const nextDir = sort === column && direction === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams({
      page: String(currentPage),
      sort: column,
      dir: nextDir,
    });
    return `/?${params.toString()}`;
  };

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams({ page: String(targetPage) });
    if (sort) {
      params.set('sort', sort);
      params.set('dir', direction);
    }
    return `/?${params.toString()}`;
  };

  return (
    <>
      <Navbar />
      <div className='flex flex-col min-h-screen'>
        <main className='flex flex-1 w-full'>
          <div className='flex flex-col gap-4 w-full p-8'>
            <div className='flex items-center justify-between'>
              <CreateTaskDialog />
            </div>

            {totalTasks === 0 ? (
              <p className='text-muted-foreground'>You don&apos;t have any tasks yet.</p>
            ) : (
              <>
                <div className='rounded-md border border-border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {SORTABLE_COLUMNS.map(({ key, label }) => (
                          <TableHead key={key}>
                            <Link
                              href={buildSortHref(key)}
                              className='inline-flex items-center gap-1 hover:text-foreground'
                            >
                              {label}
                              <span className='text-xs text-muted-foreground'>
                                {sort === key ? (direction === 'asc' ? '▲' : '▼') : ''}
                              </span>
                            </Link>
                          </TableHead>
                        ))}
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className='font-medium'>{task.title}</TableCell>
                          <TableCell className='text-muted-foreground'>
                            {task.description ?? '—'}
                          </TableCell>
                          <TableCell>{formatDate(task.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant={task.completed ? 'default' : 'secondary'}>
                              {task.completed ? 'Completed' : 'Pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <div className='flex items-center justify-end gap-2'>
                              <CompleteTaskDialog
                                task={{
                                  id: task.id,
                                  title: task.title,
                                  completed: !!task.completed,
                                }}
                              />
                              <EditTaskDialog task={task} />
                              <DeleteTaskDialog task={task} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className='flex items-center justify-between'>
                  <p className='text-sm text-muted-foreground'>
                    Page {currentPage} of {totalPages} · {totalTasks} task
                    {totalTasks === 1 ? '' : 's'}
                  </p>
                  <div className='flex items-center gap-2'>
                    <Link
                      href={buildPageHref(currentPage - 1)}
                      aria-disabled={currentPage <= 1}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        currentPage <= 1 && 'pointer-events-none opacity-50',
                      )}
                    >
                      Previous
                    </Link>
                    <Link
                      href={buildPageHref(currentPage + 1)}
                      aria-disabled={currentPage >= totalPages}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'sm' }),
                        currentPage >= totalPages && 'pointer-events-none opacity-50',
                      )}
                    >
                      Next
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
