'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { PlatformSelection } from '@/components/task-creation/platform-selection';
import { TaskTypeConfig } from '@/components/task-creation/task-type-config';
import { InstructionEditor } from '@/components/task-creation/instruction-editor';
import { BudgetCalculator } from '@/components/task-creation/budget-calculator';
import { TargetingOptions } from '@/components/task-creation/targeting-options';
import { useTaskWizard } from '@/hooks/use-task-wizard';
import { createTask, updateTask } from '@/lib/api/tasks';
import type { CreateTaskRequest, TaskRequirement } from '@/lib/types/api';

// Map platform-specific task types to generic backend types
const mapTaskTypeToBackend = (platformSpecificType: string): string => {
  const typeMapping: Record<string, string> = {
    // Instagram
    like: 'like',
    comment: 'comment',
    follow: 'follow',
    story_view: 'view',
    reel_view: 'view',
    save: 'engagement',
    share: 'share',
    // Twitter
    retweet: 'share',
    quote_tweet: 'comment',
    bookmark: 'engagement',
    // Facebook
    reaction: 'engagement',
    page_like: 'like',
    // TikTok
    favorite: 'like',
    duet: 'engagement',
    stitch: 'engagement',
    // YouTube
    subscribe: 'subscribe',
    watch: 'view',
    playlist_add: 'engagement',
  };

  return typeMapping[platformSpecificType] || platformSpecificType;
};

export default function CreateTaskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wizard = useTaskWizard();

  const handleSubmit = async () => {
    if (!wizard.isComplete()) {
      console.error('Form validation failed');
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const formData = wizard.getFormData();
      console.log(wizard.isEditMode ? 'Updating task:' : 'Creating task:', formData);

      // Map form data to API request format (backend expects snake_case)
      const taskRequest: any = {
        title: formData.instruction.title,
        description: formData.instruction.description,
        instructions: formData.instruction.instructions,
        platform: formData.platform.platform!,
        task_type: mapTaskTypeToBackend(formData.taskTypeConfig.taskType!), // Map to generic backend type
        budget: formData.budget.taskBudget, // Per-task payment
        max_performers: formData.budget.numberOfTasks, // Total number of performers
        target_criteria: formData.targeting,
      };

      if (wizard.isEditMode && wizard.editTaskId) {
        // Update existing task
        const response = await updateTask(wizard.editTaskId, taskRequest);
        console.log('Task updated successfully:', response.data);
        
        // Clear draft after successful update
        wizard.clearDraft();
        
        // Redirect to the task details page
        router.push(`/dashboard/tasks/${wizard.editTaskId}`);
      } else {
        // Create new task
        const response = await createTask(taskRequest as CreateTaskRequest);
        console.log('Task created successfully:', response.data);

        // Clear draft after successful submission
        wizard.clearDraft();

        // Redirect to tasks page
        router.push('/dashboard/tasks');
      }
    } catch (error: any) {
      console.error(wizard.isEditMode ? 'Failed to update task:' : 'Failed to create task:', error);
      setError(error?.message || `Failed to ${wizard.isEditMode ? 'update' : 'create'} task. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const message = wizard.isEditMode 
      ? 'Are you sure you want to cancel editing? Changes will not be saved.'
      : 'Are you sure you want to cancel? Your progress will be saved as a draft.';
    
    if (confirm(message)) {
      if (wizard.isEditMode) {
        wizard.clearDraft();
      }
      router.push('/dashboard');
    }
  };

  const currentStepId = wizard.steps[wizard.currentStep].id;
  const currentStepErrors = wizard.errors[currentStepId] || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {wizard.isEditMode ? 'Edit Task' : 'Create New Task'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {wizard.isEditMode 
              ? 'Update the details of your social media task'
              : 'Follow the steps below to create and publish your social media task'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <Progress
            steps={wizard.steps}
            currentStep={wizard.currentStep}
            completedSteps={wizard.completedSteps}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-medium">Error</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8">
          {/* Step 0: Platform Selection */}
          {wizard.currentStep === 0 && (
            <PlatformSelection
              selectedPlatform={wizard.platformData.platform}
              onSelect={wizard.updatePlatform}
              error={currentStepErrors.platform}
            />
          )}

          {/* Step 1: Task Type Configuration */}
          {wizard.currentStep === 1 && (
            <TaskTypeConfig
              platform={wizard.platformData.platform}
              selectedTaskType={wizard.taskTypeConfig.taskType}
              targetUrl={wizard.taskTypeConfig.targetUrl}
              requirements={wizard.taskTypeConfig.requirements}
              onTaskTypeChange={wizard.updateTaskType}
              onTargetUrlChange={wizard.updateTargetUrl}
              onRequirementsChange={wizard.updateRequirements}
              errors={currentStepErrors}
            />
          )}

          {/* Step 2: Instruction Editor */}
          {wizard.currentStep === 2 && (
            <InstructionEditor
              title={wizard.instructionData.title}
              description={wizard.instructionData.description}
              instructions={wizard.instructionData.instructions}
              onTitleChange={wizard.updateTitle}
              onDescriptionChange={wizard.updateDescription}
              onInstructionsChange={wizard.updateInstructions}
              errors={currentStepErrors}
            />
          )}

          {/* Step 3: Budget Calculator */}
          {wizard.currentStep === 3 && (
            <BudgetCalculator
              taskBudget={wizard.budgetData.taskBudget}
              numberOfTasks={wizard.budgetData.numberOfTasks}
              serviceFee={wizard.budgetData.serviceFee}
              totalCost={wizard.budgetData.totalCost}
              onTaskBudgetChange={wizard.updateTaskBudget}
              onNumberOfTasksChange={wizard.updateNumberOfTasks}
              onServiceFeeChange={wizard.updateServiceFee}
              onTotalCostChange={wizard.updateTotalCost}
              errors={currentStepErrors}
            />
          )}

          {/* Step 4: Targeting Options */}
          {wizard.currentStep === 4 && (
            <TargetingOptions
              targeting={wizard.targetingData}
              onTargetingChange={wizard.updateTargeting}
              errors={currentStepErrors}
            />
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              {wizard.canGoPrevious && (
                <button
                  type="button"
                  onClick={wizard.previousStep}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!wizard.isLastStep && (
                <button
                  type="button"
                  onClick={wizard.nextStep}
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary-500 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              )}
              {wizard.isLastStep && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-lg bg-green-500 px-6 py-2 font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting 
                    ? (wizard.isEditMode ? 'Updating Task...' : 'Creating Task...') 
                    : (wizard.isEditMode ? 'Update Task' : 'Create Task')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Draft Info */}
        {!wizard.isEditMode && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your progress is automatically saved as a draft
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
