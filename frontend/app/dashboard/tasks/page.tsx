'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { getTasks } from '@/lib/api/tasks';
import { SearchInput } from '@/components/ui/search-input';
import { TaskCard } from '@/components/task-discovery/task-card';
import { ViewToggle, ViewMode } from '@/components/task-discovery/view-toggle';
import { SortOptions, SortOption } from '@/components/task-discovery/sort-options';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/react-query/client';

export default function MyTasksPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>({
    field: 'createdAt',
    order: 'desc',
    label: 'Newest First',
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch user's tasks
  const {
    data: tasksResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [...queryKeys.tasks.lists(), 'my-tasks', user?.id, sortOption, statusFilter],
    queryFn: async () => {
      const filters: Record<string, unknown> = {
        clientId: user?.id,
        sortBy: sortOption.field,
        sortOrder: sortOption.order,
        limit: 50,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      return getTasks(filters as Parameters<typeof getTasks>[0]);
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 2 * 60 * 1000,
  });

  const tasks = tasksResponse?.data || [];

  // Filter tasks by search query locally
  const filteredTasks = tasks.filter((task) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query)
    );
  });

  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortOption(newSort);
  }, []);

  // Handle task card click
  const handleTaskClick = useCallback(
    (taskId: string) => {
      router.push(`/dashboard/tasks/${taskId}`);
    },
    [router]
  );

  // Handle create task
  const handleCreateTask = useCallback(() => {
    router.push('/dashboard/create-task');
  }, [router]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-gray-600">Please log in to view your tasks.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
            <p className="mt-2 text-gray-600">
              Manage and track tasks you&apos;ve created
            </p>
          </div>
          <button
            onClick={handleCreateTask}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 font-medium text-white transition-colors hover:bg-sky-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Task
          </button>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search your tasks..."
                isLoading={isLoading}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
              <div className="text-sm text-gray-600">
                {filteredTasks.length > 0 ? `${filteredTasks.length} tasks` : 'No tasks'}
              </div>
            </div>

            <SortOptions currentSort={sortOption} onSortChange={handleSortChange} />
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="font-medium">Error loading tasks</p>
            <p className="mt-1 text-sm">{(error as Error)?.message || 'An unexpected error occurred'}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
                <Skeleton height="200px" />
              </div>
            ))}
          </div>
        )}

        {/* Task Grid/List */}
        {!isError && !isLoading && filteredTasks.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={handleTaskClick}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {searchQuery ? 'No matching tasks' : 'No tasks yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Get started by creating your first task.'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateTask}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 font-medium text-white transition-colors hover:bg-sky-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
