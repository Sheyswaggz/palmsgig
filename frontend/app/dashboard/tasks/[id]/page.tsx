'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskDetails } from '@/hooks/use-task-details';
import { TaskHeader } from '@/components/task-details/task-header';
import { CreatorProfile } from '@/components/task-details/creator-profile';
import { RequirementsChecklist } from '@/components/task-details/requirements-checklist';
import { ProofSubmission } from '@/components/task-details/proof-submission';
import { StatusTracker } from '@/components/task-details/status-tracker';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Map backend task types back to frontend platform-specific types
// This is the reverse of mapTaskTypeToBackend in create-task page
const mapTaskTypeToFrontend = (backendType: string, platform: string): string => {
  // Backend types that are the same as frontend
  const directTypes = ['like', 'comment', 'follow', 'share', 'subscribe'];
  if (directTypes.includes(backendType)) {
    return backendType;
  }

  // Platform-specific mappings for ambiguous types
  const platformMappings: Record<string, Record<string, string>> = {
    instagram: {
      view: 'story_view', // default to story_view for Instagram
      engagement: 'save',
    },
    twitter: {
      engagement: 'bookmark',
    },
    facebook: {
      engagement: 'reaction',
    },
    tiktok: {
      engagement: 'favorite',
    },
    youtube: {
      view: 'watch',
      engagement: 'playlist_add',
    },
  };

  const platformMap = platformMappings[platform];
  if (platformMap && platformMap[backendType]) {
    return platformMap[backendType];
  }

  // Return as-is if no mapping found
  return backendType;
};

interface PageProps {
  params: { id: string };
}

export default function TaskDetailsPage({ params }: PageProps) {
  const { id } = params;
  const router = useRouter();
  const { task, isLoading, error, submitProof, claimTask, publishTask, pauseTask, resumeTask, cancelTask, isSubmitting, refetch, isOwner } =
    useTaskDetails(id);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-sky-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent>
            <div className="py-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Error Loading Task
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{error}</p>
              <Button onClick={refetch} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent>
            <div className="py-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Task Not Found
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                The task you're looking for doesn't exist or has been removed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canClaim = !isOwner && (task.status === 'active' || task.status === 'open') && task.availableSlots > 0;
  const canSubmitProof = task.status === 'in_progress';
  const canManageTask = isOwner && (task.status === 'draft' || task.status === 'active' || task.status === 'paused');

  // Helper to extract error message from API errors
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred';
  };

  const handleClaimTask = async () => {
    setActionError(null);
    try {
      await claimTask();
    } catch (error) {
      console.error('Failed to claim task:', error);
      setActionError(getErrorMessage(error));
    }
  };

  const handlePublishTask = async () => {
    setActionError(null);
    try {
      await publishTask();
    } catch (error) {
      console.error('Failed to publish task:', error);
      setActionError(getErrorMessage(error));
    }
  };

  const handlePauseTask = async () => {
    setActionError(null);
    try {
      await pauseTask();
    } catch (error) {
      console.error('Failed to pause task:', error);
      setActionError(getErrorMessage(error));
    }
  };

  const handleResumeTask = async () => {
    setActionError(null);
    try {
      await resumeTask();
    } catch (error) {
      console.error('Failed to resume task:', error);
      setActionError(getErrorMessage(error));
    }
  };

  const handleCancelTask = async () => {
    setActionError(null);
    try {
      await cancelTask();
    } catch (error) {
      console.error('Failed to cancel task:', error);
      setActionError(getErrorMessage(error));
    }
  };

  const handleEditTask = () => {
    if (!task) return;
    
    // Map backend task type back to frontend-specific type
    const frontendTaskType = mapTaskTypeToFrontend(task.taskType, task.platform);
    
    // Calculate per-task budget (prefer rewardPerAction, fall back to budget / totalSlots)
    const perTaskBudget = task.rewardPerAction > 0 
      ? task.rewardPerAction 
      : (task.budget > 0 && task.totalSlots > 0 ? task.budget / task.totalSlots : 0);
    
    // Store task data for editing in localStorage
    const editData = {
      taskId: task.id,
      platformData: { platform: task.platform },
      taskTypeConfig: {
        taskType: frontendTaskType,
        targetUrl: '',
        requirements: task.requirements.map(r => r.description),
      },
      instructionData: {
        title: task.title,
        description: task.description,
        instructions: task.instructions || '',
      },
      budgetData: {
        taskBudget: perTaskBudget,
        numberOfTasks: task.totalSlots,
        serviceFee: 0,
        totalCost: task.budget || perTaskBudget * task.totalSlots,
      },
      targetingData: {},
      savedAt: new Date().toISOString(),
    };
    
    localStorage.setItem('task-wizard-edit', JSON.stringify(editData));
    router.push('/dashboard/create-task');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tasks
          </button>
        </div>

        <div className="space-y-6">
          <TaskHeader
            title={task.title}
            status={task.status}
            platform={task.platform}
            rewardPerAction={task.rewardPerAction}
            deadline={task.deadline}
            availableSlots={task.availableSlots}
            totalSlots={task.totalSlots}
            taskType={task.taskType}
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardContent>
                  <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Description
                  </h3>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-gray-700 dark:text-gray-300">{task.description}</p>
                  </div>
                </CardContent>
              </Card>

              <RequirementsChecklist
                requirements={task.requirements.map((req) => ({
                  id: req.id,
                  description: req.description,
                  required: req.required,
                  completed: false,
                }))}
                readOnly={!canSubmitProof}
              />

              {canSubmitProof && (
                <ProofSubmission onSubmit={submitProof} isSubmitting={isSubmitting} />
              )}

              {canClaim && (
                <Card>
                  <CardContent>
                    {actionError && (
                      <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                        <div className="flex">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{actionError}</p>
                          </div>
                          <button 
                            onClick={() => setActionError(null)}
                            className="ml-auto text-red-400 hover:text-red-600"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Ready to Start?
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          Claim this task to begin working on it
                        </p>
                      </div>
                      <Button
                        onClick={handleClaimTask}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                      >
                        Claim Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isOwner && (
                <Card>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Task Management
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          You are the owner of this task
                        </p>
                      </div>
                      {actionError && (
                        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                          <div className="flex">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-red-800 dark:text-red-200">{actionError}</p>
                            </div>
                            <button 
                              onClick={() => setActionError(null)}
                              className="ml-auto text-red-400 hover:text-red-600"
                            >
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-3">
                        {task.status === 'draft' && (
                          <Button variant="primary" onClick={handlePublishTask} disabled={isSubmitting}>
                            Publish Task
                          </Button>
                        )}
                        {task.status === 'active' && (
                          <Button variant="secondary" onClick={handlePauseTask} disabled={isSubmitting}>
                            Pause Task
                          </Button>
                        )}
                        {task.status === 'paused' && (
                          <Button variant="secondary" onClick={handleResumeTask} disabled={isSubmitting}>
                            Resume Task
                          </Button>
                        )}
                        {canManageTask && (
                          <>
                            <Button variant="outline" onClick={handleEditTask}>
                              Edit Task
                            </Button>
                            <Button variant="danger" onClick={handleCancelTask} disabled={isSubmitting}>
                              Cancel Task
                            </Button>
                          </>
                        )}
                      </div>
                      <div className="border-t pt-4 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Performers:</strong> {task.totalSlots - task.availableSlots} / {task.totalSlots} claimed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {!isOwner && (
                <CreatorProfile
                  name={task.creator.name}
                  avatar={task.creator.avatar}
                  rating={task.creator.rating}
                  totalReviews={task.creator.totalReviews}
                  tasksCompleted={task.creator.tasksCompleted}
                  successRate={task.creator.successRate}
                  verified={task.creator.verified}
                  joinedDate={task.creator.joinedDate}
                />
              )}

              {isOwner && (
                <Card>
                  <CardContent>
                    <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Task Statistics
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status</span>
                        <span className="font-medium capitalize">{task.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Slots</span>
                        <span className="font-medium">{task.totalSlots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Filled</span>
                        <span className="font-medium">{task.totalSlots - task.availableSlots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Available</span>
                        <span className="font-medium">{task.availableSlots}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Reward per Action</span>
                        <span className="font-medium text-green-600">${task.rewardPerAction.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <StatusTracker
                currentStatus={
                  task.status === 'open'
                    ? 'open'
                    : task.status === 'in_progress'
                      ? 'claimed'
                      : task.status === 'completed'
                        ? 'completed'
                        : 'open'
                }
                events={[
                  {
                    id: '1',
                    status: 'open',
                    description: 'Task created and opened for claims',
                    timestamp: task.deadline ? new Date(task.deadline).toISOString() : new Date().toISOString(),
                  },
                ]}
              />

              <Card>
                <CardContent>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Important Notes
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-sky-500"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Complete all requirements before submitting proof
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-sky-500"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Upload clear screenshots as proof
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-sky-500"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Reward paid after approval
                    </li>
                    <li className="flex items-start gap-2">
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-sky-500"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit before the deadline
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
