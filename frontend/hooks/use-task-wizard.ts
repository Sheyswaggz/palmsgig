'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  Platform,
  TaskType,
  PlatformSelectionData,
  TaskTypeConfigData,
  InstructionData,
  BudgetData,
  TargetingData,
  TaskCreationFormData,
} from '@/lib/validations/task';
import {
  validatePlatformSelection,
  validateTaskTypeConfig,
  validateInstructionData,
  validateBudgetData,
  validateTargetingData,
} from '@/lib/validations/task';

const DRAFT_STORAGE_KEY = 'task-wizard-draft';
const EDIT_TASK_STORAGE_KEY = 'task-wizard-edit';

export interface WizardStep {
  id: string;
  label: string;
  description?: string;
}

export interface EditTaskData {
  taskId: string;
  platform: Platform;
  taskType: TaskType;
  targetUrl?: string;
  title: string;
  description: string;
  instructions?: string;
  budget: number;
  totalSlots: number;
  targeting?: TargetingData;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'platform', label: 'Platform', description: 'Select platform' },
  { id: 'taskType', label: 'Task Type', description: 'Configure task' },
  { id: 'instructions', label: 'Instructions', description: 'Provide details' },
  { id: 'budget', label: 'Budget', description: 'Set pricing' },
  { id: 'targeting', label: 'Targeting', description: 'Define audience' },
];

export function useTaskWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [platformData, setPlatformData] = useState<PlatformSelectionData>({
    platform: null,
  });

  const [taskTypeConfig, setTaskTypeConfig] = useState<TaskTypeConfigData>({
    taskType: null,
    targetUrl: '',
    requirements: [],
  });

  const [instructionData, setInstructionData] = useState<InstructionData>({
    title: '',
    description: '',
    instructions: '',
  });

  const [budgetData, setBudgetData] = useState<BudgetData>({
    taskBudget: 0,
    numberOfTasks: 0,
    serviceFee: 0,
    totalCost: 0,
  });

  const [targetingData, setTargetingData] = useState<TargetingData>({});

  // Validation errors
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      // First check if we're in edit mode
      const editData = localStorage.getItem(EDIT_TASK_STORAGE_KEY);
      if (editData) {
        const edit = JSON.parse(editData);
        if (edit.taskId) {
          setEditTaskId(edit.taskId);
          setIsEditMode(true);
          if (edit.platformData) setPlatformData(edit.platformData);
          if (edit.taskTypeConfig) setTaskTypeConfig(edit.taskTypeConfig);
          if (edit.instructionData) setInstructionData(edit.instructionData);
          if (edit.budgetData) setBudgetData(edit.budgetData);
          if (edit.targetingData) setTargetingData(edit.targetingData);
          // Mark all steps as completed for edit mode
          setCompletedSteps([0, 1, 2, 3, 4]);
          console.log('Loaded task for editing:', edit.taskId);
          return;
        }
      }

      // Otherwise load regular draft
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.platformData) setPlatformData(draft.platformData);
        if (draft.taskTypeConfig) setTaskTypeConfig(draft.taskTypeConfig);
        if (draft.instructionData) setInstructionData(draft.instructionData);
        if (draft.budgetData) setBudgetData(draft.budgetData);
        if (draft.targetingData) setTargetingData(draft.targetingData);
        if (draft.currentStep !== undefined) setCurrentStep(draft.currentStep);
        if (draft.completedSteps) setCompletedSteps(draft.completedSteps);
        console.log('Loaded task wizard draft from localStorage');
      }
    } catch (error) {
      console.error('Failed to load task wizard draft:', error);
    }
  }, []);

  // Save draft to localStorage whenever form data changes
  const saveDraft = useCallback(() => {
    // Don't auto-save when in edit mode - edit data is already stored
    if (isEditMode) {
      return;
    }
    
    try {
      const draft = {
        platformData,
        taskTypeConfig,
        instructionData,
        budgetData,
        targetingData,
        currentStep,
        completedSteps,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      console.log('Saved task wizard draft to localStorage');
    } catch (error) {
      console.error('Failed to save task wizard draft:', error);
    }
  }, [platformData, taskTypeConfig, instructionData, budgetData, targetingData, currentStep, completedSteps, isEditMode]);

  // Auto-save draft when form data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft();
    }, 1000); // Debounce by 1 second

    return () => clearTimeout(timeoutId);
  }, [saveDraft]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      localStorage.removeItem(EDIT_TASK_STORAGE_KEY);
      setEditTaskId(null);
      setIsEditMode(false);
      console.log('Cleared task wizard draft');
    } catch (error) {
      console.error('Failed to clear task wizard draft:', error);
    }
  }, []);

  // Load task for editing (called from outside, stores in localStorage and reloads)
  const loadTaskForEdit = useCallback((taskData: EditTaskData) => {
    try {
      const editData = {
        taskId: taskData.taskId,
        platformData: { platform: taskData.platform },
        taskTypeConfig: {
          taskType: taskData.taskType,
          targetUrl: taskData.targetUrl || '',
          requirements: [],
        },
        instructionData: {
          title: taskData.title,
          description: taskData.description,
          instructions: taskData.instructions || '',
        },
        budgetData: {
          taskBudget: taskData.budget,
          numberOfTasks: taskData.totalSlots,
          serviceFee: 0,
          totalCost: taskData.budget * taskData.totalSlots,
        },
        targetingData: taskData.targeting || {},
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(EDIT_TASK_STORAGE_KEY, JSON.stringify(editData));
      console.log('Stored task for editing:', taskData.taskId);
    } catch (error) {
      console.error('Failed to store task for editing:', error);
    }
  }, []);

  // Validate current step
  const validateStep = useCallback(
    (stepIndex: number): boolean => {
      const stepId = WIZARD_STEPS[stepIndex].id;
      let stepErrors: Record<string, string> = {};

      switch (stepId) {
        case 'platform':
          stepErrors = validatePlatformSelection(platformData);
          break;
        case 'taskType':
          stepErrors = validateTaskTypeConfig(taskTypeConfig, platformData.platform);
          break;
        case 'instructions':
          stepErrors = validateInstructionData(instructionData);
          break;
        case 'budget':
          stepErrors = validateBudgetData(budgetData);
          break;
        case 'targeting':
          stepErrors = validateTargetingData(targetingData);
          break;
      }

      if (Object.keys(stepErrors).length > 0) {
        setErrors((prev) => ({ ...prev, [stepId]: stepErrors }));
        return false;
      }

      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[stepId];
        return newErrors;
      });
      return true;
    },
    [platformData, taskTypeConfig, instructionData, budgetData, targetingData]
  );

  // Navigate to next step
  const nextStep = useCallback(() => {
    if (!validateStep(currentStep)) {
      return false;
    }

    if (currentStep < WIZARD_STEPS.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps((prev) => [...prev, currentStep]);
      }
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return true;
    }
    return false;
  }, [currentStep, validateStep, completedSteps]);

  // Navigate to previous step
  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Go to specific step
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < WIZARD_STEPS.length) {
      setCurrentStep(stepIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Check if all steps are completed
  const isComplete = useCallback((): boolean => {
    for (let i = 0; i < WIZARD_STEPS.length; i++) {
      if (!validateStep(i)) {
        return false;
      }
    }
    return true;
  }, [validateStep]);

  // Get form data
  const getFormData = useCallback((): TaskCreationFormData => {
    return {
      platform: platformData,
      taskTypeConfig,
      instruction: instructionData,
      budget: budgetData,
      targeting: targetingData,
    };
  }, [platformData, taskTypeConfig, instructionData, budgetData, targetingData]);

  // Reset wizard
  const reset = useCallback(() => {
    setPlatformData({ platform: null });
    setTaskTypeConfig({ taskType: null, targetUrl: '', requirements: [] });
    setInstructionData({ title: '', description: '', instructions: '' });
    setBudgetData({ taskBudget: 0, numberOfTasks: 0, serviceFee: 0, totalCost: 0 });
    setTargetingData({});
    setCurrentStep(0);
    setCompletedSteps([]);
    setErrors({});
    clearDraft();
  }, [clearDraft]);

  // Update platform data
  const updatePlatform = useCallback((platform: Platform) => {
    setPlatformData({ platform });
  }, []);

  // Update task type config
  const updateTaskType = useCallback((taskType: TaskType) => {
    setTaskTypeConfig((prev) => ({ ...prev, taskType }));
  }, []);

  const updateTargetUrl = useCallback((url: string) => {
    setTaskTypeConfig((prev) => ({ ...prev, targetUrl: url }));
  }, []);

  const updateRequirements = useCallback((requirements: string[]) => {
    setTaskTypeConfig((prev) => ({ ...prev, requirements }));
  }, []);

  // Update instruction data
  const updateTitle = useCallback((title: string) => {
    setInstructionData((prev) => ({ ...prev, title }));
  }, []);

  const updateDescription = useCallback((description: string) => {
    setInstructionData((prev) => ({ ...prev, description }));
  }, []);

  const updateInstructions = useCallback((instructions: string) => {
    setInstructionData((prev) => ({ ...prev, instructions }));
  }, []);

  // Update budget data
  const updateTaskBudget = useCallback((taskBudget: number) => {
    setBudgetData((prev) => ({ ...prev, taskBudget }));
  }, []);

  const updateNumberOfTasks = useCallback((numberOfTasks: number) => {
    setBudgetData((prev) => ({ ...prev, numberOfTasks }));
  }, []);

  const updateServiceFee = useCallback((serviceFee: number) => {
    setBudgetData((prev) => ({ ...prev, serviceFee }));
  }, []);

  const updateTotalCost = useCallback((totalCost: number) => {
    setBudgetData((prev) => ({ ...prev, totalCost }));
  }, []);

  // Update targeting data
  const updateTargeting = useCallback((targeting: TargetingData) => {
    setTargetingData(targeting);
  }, []);

  return {
    // State
    steps: WIZARD_STEPS,
    currentStep,
    completedSteps,
    platformData,
    taskTypeConfig,
    instructionData,
    budgetData,
    targetingData,
    errors,
    editTaskId,
    isEditMode,

    // Actions
    nextStep,
    previousStep,
    goToStep,
    validateStep,
    isComplete,
    getFormData,
    reset,
    saveDraft,
    clearDraft,
    loadTaskForEdit,

    // Update functions
    updatePlatform,
    updateTaskType,
    updateTargetUrl,
    updateRequirements,
    updateTitle,
    updateDescription,
    updateInstructions,
    updateTaskBudget,
    updateNumberOfTasks,
    updateServiceFee,
    updateTotalCost,
    updateTargeting,

    // Computed properties
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === WIZARD_STEPS.length - 1,
    canGoNext: currentStep < WIZARD_STEPS.length - 1,
    canGoPrevious: currentStep > 0,
  };
}
