'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTaskById, submitTaskProof, claimTask as claimTaskApi, publishTask as publishTaskApi, pauseTask as pauseTaskApi, resumeTask as resumeTaskApi, cancelTask as cancelTaskApi } from '@/lib/api/tasks';
import type { Task as ApiTask } from '@/lib/types/api';

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'draft' | 'active' | 'paused';
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok';
  taskType: string;
  rewardPerAction: number;
  budget: number;
  deadline: string;
  availableSlots: number;
  totalSlots: number;
  requirements: Array<{
    id: string;
    description: string;
    required: boolean;
  }>;
  creator: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    totalReviews: number;
    tasksCompleted: number;
    successRate: number;
    verified: boolean;
    joinedDate: string;
  };
}

export interface ProofSubmission {
  images: Array<{ id: string; file: File; preview: string }>;
  description: string;
  link?: string;
}

export interface TaskDetailsState {
  task: Task | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
}

export interface UseTaskDetailsReturn extends TaskDetailsState {
  submitProof: (data: ProofSubmission) => Promise<void>;
  claimTask: () => Promise<void>;
  publishTask: () => Promise<void>;
  pauseTask: () => Promise<void>;
  resumeTask: () => Promise<void>;
  cancelTask: () => Promise<void>;
  refetch: () => Promise<void>;
  isOwner: boolean;
}

// Transform API task to local Task interface
function transformApiTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    title: apiTask.title,
    description: apiTask.description,
    instructions: apiTask.instructions || '',
    status: apiTask.status as Task['status'],
    platform: apiTask.platform,
    taskType: apiTask.taskType,
    rewardPerAction: apiTask.rewardPerAction || 0,
    budget: apiTask.budget || 0,
    deadline: apiTask.endDate || '',
    availableSlots: apiTask.totalSlots - apiTask.filledSlots,
    totalSlots: apiTask.totalSlots,
    requirements: (apiTask.requirements || []).map((req, index) => ({
      id: `req-${index}`,
      description: typeof req === 'string' ? req : String(req.value || ''),
      required: true,
    })),
    creator: {
      id: apiTask.clientId || '',
      name: apiTask.client?.username || 'Unknown',
      avatar: apiTask.client?.profile_picture,
      rating: 4.5, // Default values since API doesn't provide these
      totalReviews: 0,
      tasksCompleted: 0,
      successRate: 100,
      verified: apiTask.client?.email_verified || false,
      joinedDate: apiTask.client?.created_at || '',
    },
  };
}

// Helper to get current user ID from localStorage
function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('palmsgig_user');
    if (stored) {
      const user = JSON.parse(stored);
      return user?.id || null;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function useTaskDetails(taskId: string): UseTaskDetailsReturn {
  const [state, setState] = useState<TaskDetailsState>({
    task: null,
    isLoading: true,
    error: null,
    isSubmitting: false,
  });
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID on mount
  useEffect(() => {
    setCurrentUserId(getCurrentUserId());
  }, []);

  const isOwner = !!(currentUserId && state.task && state.task.creator.id === currentUserId);

  const fetchTaskDetails = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log(`Fetching task details for task ID: ${taskId}`);

      const response = await getTaskById(taskId);
      const task = transformApiTask(response.data);
      
      setState({
        task,
        isLoading: false,
        error: null,
        isSubmitting: false,
      });
    } catch (error) {
      console.error('Failed to fetch task details:', error);
      setState({
        task: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load task details',
        isSubmitting: false,
      });
    }
  }, [taskId]);

  const submitProof = useCallback(
    async (data: ProofSubmission) => {
      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        console.log(`Submitting proof for task ID: ${taskId}`);

        await submitTaskProof({
          taskId,
          proofUrl: data.link,
          proofDescription: data.description,
        });

        await fetchTaskDetails();

        setState((prev) => ({ ...prev, isSubmitting: false, error: null }));
      } catch (error) {
        console.error('Failed to submit proof:', error);
        setState((prev) => ({ ...prev, isSubmitting: false }));
        throw error;
      }
    },
    [taskId, fetchTaskDetails]
  );

  const claimTask = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('You must be logged in to claim a task');
    }

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      console.log(`Claiming task ID: ${taskId} for user: ${userId}`);

      await claimTaskApi(taskId, userId);

      await fetchTaskDetails();

      setState((prev) => ({ ...prev, isSubmitting: false, error: null }));
    } catch (error) {
      console.error('Failed to claim task:', error);
      setState((prev) => ({ ...prev, isSubmitting: false }));
      throw error;
    }
  }, [taskId, fetchTaskDetails]);

  const publishTask = useCallback(async () => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      console.log(`Publishing task ID: ${taskId}`);

      await publishTaskApi(taskId);

      await fetchTaskDetails();

      setState((prev) => ({ ...prev, isSubmitting: false, error: null }));
    } catch (error) {
      console.error('Failed to publish task:', error);
      setState((prev) => ({ ...prev, isSubmitting: false }));
      throw error;
    }
  }, [taskId, fetchTaskDetails]);

  const pauseTask = useCallback(async () => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      console.log(`Pausing task ID: ${taskId}`);

      await pauseTaskApi(taskId);

      await fetchTaskDetails();

      setState((prev) => ({ ...prev, isSubmitting: false, error: null }));
    } catch (error) {
      console.error('Failed to pause task:', error);
      setState((prev) => ({ ...prev, isSubmitting: false }));
      throw error;
    }
  }, [taskId, fetchTaskDetails]);

  const resumeTask = useCallback(async () => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      console.log(`Resuming task ID: ${taskId}`);

      await resumeTaskApi(taskId);

      await fetchTaskDetails();

      setState((prev) => ({ ...prev, isSubmitting: false, error: null }));
    } catch (error) {
      console.error('Failed to resume task:', error);
      setState((prev) => ({ ...prev, isSubmitting: false }));
      throw error;
    }
  }, [taskId, fetchTaskDetails]);

  const cancelTask = useCallback(async () => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      console.log(`Cancelling task ID: ${taskId}`);

      await cancelTaskApi(taskId);

      await fetchTaskDetails();

      setState((prev) => ({ ...prev, isSubmitting: false, error: null }));
    } catch (error) {
      console.error('Failed to cancel task:', error);
      setState((prev) => ({ ...prev, isSubmitting: false }));
      throw error;
    }
  }, [taskId, fetchTaskDetails]);

  const refetch = useCallback(async () => {
    await fetchTaskDetails();
  }, [fetchTaskDetails]);

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId, fetchTaskDetails]);

  return {
    ...state,
    submitProof,
    claimTask,
    publishTask,
    pauseTask,
    resumeTask,
    cancelTask,
    refetch,
    isOwner,
  };
}
