import { apiClient } from './client';
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskSubmission,
  SubmitTaskProofRequest,
  ReviewSubmissionRequest,
  ApiResponse,
  PaginatedResponse,
  TaskFilters,
} from '../types/api';

// Transform backend task response (snake_case) to frontend Task type (camelCase)
function transformTask(backendTask: any): Task {
  return {
    id: backendTask.id,
    title: backendTask.title,
    description: backendTask.description,
    platform: backendTask.platform,
    taskType: backendTask.task_type || backendTask.taskType,
    status: backendTask.status,
    budget: Number(backendTask.budget) || 0,
    rewardPerAction: Number(backendTask.budget) || 0, // Backend uses budget as per-action reward
    totalSlots: backendTask.max_performers || backendTask.totalSlots || 0,
    filledSlots: backendTask.current_performers || backendTask.filledSlots || 0,
    requirements: backendTask.requirements || [],
    instructions: backendTask.instructions || '',
    proofRequired: backendTask.proof_required || backendTask.proofRequired || false,
    clientId: backendTask.creator_id || backendTask.clientId,
    client: backendTask.client,
    startDate: backendTask.start_date || backendTask.startDate,
    endDate: backendTask.expires_at || backendTask.end_date || backendTask.endDate,
    createdAt: backendTask.created_at || backendTask.createdAt,
    updatedAt: backendTask.updated_at || backendTask.updatedAt,
  };
}

export async function getTasks(filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
  console.log('Fetching tasks with filters:', filters);

  const queryParams = new URLSearchParams();

  if (filters?.page !== undefined) {
    queryParams.append('page', filters.page.toString());
  }

  if (filters?.limit !== undefined) {
    queryParams.append('limit', filters.limit.toString());
  }

  if (filters?.sortBy) {
    queryParams.append('sortBy', filters.sortBy);
  }

  if (filters?.sortOrder) {
    queryParams.append('sortOrder', filters.sortOrder);
  }

  if (filters?.status) {
    queryParams.append('status', filters.status);
  }

  if (filters?.platform) {
    queryParams.append('platform', filters.platform);
  }

  if (filters?.taskType) {
    queryParams.append('taskType', filters.taskType);
  }

  if (filters?.minBudget !== undefined) {
    queryParams.append('minBudget', filters.minBudget.toString());
  }

  if (filters?.maxBudget !== undefined) {
    queryParams.append('maxBudget', filters.maxBudget.toString());
  }

  if (filters?.clientId) {
    queryParams.append('clientId', filters.clientId);
  }

  const queryString = queryParams.toString();
  const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await apiClient.get<any>(endpoint);
    console.log(`Successfully fetched ${response.total || 0} tasks`);
    
    // Transform backend response to match PaginatedResponse format
    const tasks = (response.tasks || []).map(transformTask);
    
    const transformedResponse: PaginatedResponse<Task> = {
      success: true,
      data: tasks,
      pagination: {
        page: response.page || 1,
        limit: response.page_size || filters?.limit || 20,
        total: response.total || 0,
        totalPages: response.total_pages || 0,
        hasNext: response.page < response.total_pages,
        hasPrev: response.page > 1,
      },
      timestamp: new Date().toISOString(),
    };
    
    return transformedResponse;
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    throw error;
  }
}

export async function getTaskById(taskId: string): Promise<ApiResponse<Task>> {
  console.log(`Fetching task by ID: ${taskId}`);

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const response = await apiClient.get<any>(`/tasks/${taskId}`);
    // Backend returns task directly, transform it
    const taskData = (response as any).data || response;
    const transformedTask = transformTask(taskData);
    
    return {
      success: true,
      data: transformedTask,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to fetch task ${taskId}:`, error);
    throw error;
  }
}

export async function createTask(data: any): Promise<ApiResponse<Task>> {
  console.log('Creating new task:', data.title);

  // Validate snake_case fields that match backend schema
  if (!data.title || !data.platform || !data.task_type) {
    throw new Error('Title, platform, and task type are required');
  }

  if (!data.budget || data.budget <= 0) {
    throw new Error('Budget must be a positive number');
  }

  if (!data.max_performers || data.max_performers <= 0) {
    throw new Error('Number of performers must be a positive number');
  }

  try {
    // Backend returns task directly, not wrapped in ApiResponse
    const rawResponse = await apiClient.post<Task>('/tasks', data);
    // The response might be the task directly (cast as ApiResponse) or wrapped
    // Handle both cases: if response.data exists, use it; otherwise response IS the data
    const taskData = (rawResponse as any).data || rawResponse;
    const transformedTask = transformTask(taskData);
    console.log(`Successfully created task: ${transformedTask.id}`);
    
    // Return wrapped in ApiResponse format for consistency
    return {
      success: true,
      data: transformedTask,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
}

export async function updateTask(
  taskId: string,
  data: UpdateTaskRequest
): Promise<ApiResponse<Task>> {
  console.log(`Updating task: ${taskId}`);

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  if (data.budget !== undefined && data.budget <= 0) {
    throw new Error('Budget must be a positive number');
  }

  if (data.rewardPerAction !== undefined && data.rewardPerAction <= 0) {
    throw new Error('Reward per action must be a positive number');
  }

  if (data.totalSlots !== undefined && data.totalSlots <= 0) {
    throw new Error('Total slots must be a positive number');
  }

  try {
    const response = await apiClient.put<any>(`/tasks/${taskId}`, data);
    const taskData = (response as any).data || response;
    const transformedTask = transformTask(taskData);
    console.log(`Successfully updated task: ${taskId}`);
    
    return {
      success: true,
      data: transformedTask,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to update task ${taskId}:`, error);
    throw error;
  }
}

// Publish a task (change status from draft to active)
export async function publishTask(taskId: string): Promise<ApiResponse<Task>> {
  console.log(`Publishing task: ${taskId}`);

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const response = await apiClient.put<any>(`/tasks/${taskId}`, { status: 'active' });
    const taskData = (response as any).data || response;
    const transformedTask = transformTask(taskData);
    console.log(`Successfully published task: ${taskId}`);
    
    return {
      success: true,
      data: transformedTask,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to publish task ${taskId}:`, error);
    throw error;
  }
}

// Pause a task
export async function pauseTask(taskId: string): Promise<ApiResponse<Task>> {
  console.log(`Pausing task: ${taskId}`);

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const response = await apiClient.put<any>(`/tasks/${taskId}`, { status: 'paused' });
    const taskData = (response as any).data || response;
    const transformedTask = transformTask(taskData);
    console.log(`Successfully paused task: ${taskId}`);
    
    return {
      success: true,
      data: transformedTask,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to pause task ${taskId}:`, error);
    throw error;
  }
}

// Resume a paused task
export async function resumeTask(taskId: string): Promise<ApiResponse<Task>> {
  console.log(`Resuming task: ${taskId}`);

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const response = await apiClient.put<any>(`/tasks/${taskId}`, { status: 'active' });
    const taskData = (response as any).data || response;
    const transformedTask = transformTask(taskData);
    console.log(`Successfully resumed task: ${taskId}`);
    
    return {
      success: true,
      data: transformedTask,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to resume task ${taskId}:`, error);
    throw error;
  }
}

// Cancel a task
export async function cancelTask(taskId: string): Promise<ApiResponse<Task>> {
  console.log(`Cancelling task: ${taskId}`);

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const response = await apiClient.put<any>(`/tasks/${taskId}`, { status: 'cancelled' });
    const taskData = (response as any).data || response;
    const transformedTask = transformTask(taskData);
    console.log(`Successfully cancelled task: ${taskId}`);
    
    return {
      success: true,
      data: transformedTask,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to cancel task ${taskId}:`, error);
    throw error;
  }
}

export async function deleteTask(taskId: string): Promise<ApiResponse<{ success: boolean }>> {
  console.log(`Deleting task: ${taskId}`);

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const response = await apiClient.delete<{ success: boolean }>(`/tasks/${taskId}`);
    console.log(`Successfully deleted task: ${taskId}`);
    return response;
  } catch (error) {
    console.error(`Failed to delete task ${taskId}:`, error);
    throw error;
  }
}

export async function getTaskSubmissions(
  taskId: string
): Promise<ApiResponse<TaskSubmission[]>> {
  console.log(`Fetching submissions for task: ${taskId}`);

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  try {
    const response = await apiClient.get<TaskSubmission[]>(`/tasks/${taskId}/submissions`);
    console.log(`Successfully fetched ${response.data.length} submissions for task: ${taskId}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch submissions for task ${taskId}:`, error);
    throw error;
  }
}

export async function submitTaskProof(
  data: SubmitTaskProofRequest
): Promise<ApiResponse<TaskSubmission>> {
  console.log(`Submitting proof for task: ${data.taskId}`);

  if (!data.taskId) {
    throw new Error('Task ID is required');
  }

  if (!data.proofUrl && !data.proofDescription) {
    throw new Error('Either proof URL or proof description is required');
  }

  try {
    const response = await apiClient.post<TaskSubmission>('/tasks/submissions', data);
    console.log(`Successfully submitted proof for task: ${data.taskId}`);
    return response;
  } catch (error) {
    console.error(`Failed to submit proof for task ${data.taskId}:`, error);
    throw error;
  }
}

export async function reviewSubmission(
  data: ReviewSubmissionRequest
): Promise<ApiResponse<TaskSubmission>> {
  console.log(`Reviewing submission: ${data.submissionId} with status: ${data.status}`);

  if (!data.submissionId) {
    throw new Error('Submission ID is required');
  }

  if (!data.status || !['approved', 'rejected'].includes(data.status)) {
    throw new Error('Valid status (approved or rejected) is required');
  }

  if (data.status === 'rejected' && !data.rejectionReason) {
    throw new Error('Rejection reason is required when rejecting a submission');
  }

  try {
    const response = await apiClient.post<TaskSubmission>(
      `/tasks/submissions/${data.submissionId}/review`,
      {
        status: data.status,
        rejectionReason: data.rejectionReason,
      }
    );
    console.log(`Successfully reviewed submission: ${data.submissionId}`);
    return response;
  } catch (error) {
    console.error(`Failed to review submission ${data.submissionId}:`, error);
    throw error;
  }
}

export async function searchTasks(query: string, filters?: TaskFilters): Promise<PaginatedResponse<Task>> {
  console.log(`Searching tasks with query: "${query}"`);

  if (!query || query.trim().length === 0) {
    return getTasks(filters);
  }

  const queryParams = new URLSearchParams();
  queryParams.append('q', query.trim());

  if (filters?.page !== undefined) {
    queryParams.append('page', filters.page.toString());
  }

  if (filters?.limit !== undefined) {
    queryParams.append('limit', filters.limit.toString());
  }

  if (filters?.sortBy) {
    queryParams.append('sortBy', filters.sortBy);
  }

  if (filters?.sortOrder) {
    queryParams.append('sortOrder', filters.sortOrder);
  }

  if (filters?.status) {
    queryParams.append('status', filters.status);
  }

  if (filters?.platform) {
    queryParams.append('platform', filters.platform);
  }

  if (filters?.taskType) {
    queryParams.append('taskType', filters.taskType);
  }

  if (filters?.minBudget !== undefined) {
    queryParams.append('minBudget', filters.minBudget.toString());
  }

  if (filters?.maxBudget !== undefined) {
    queryParams.append('maxBudget', filters.maxBudget.toString());
  }

  const queryString = queryParams.toString();
  const endpoint = `/tasks/search?${queryString}`;

  try {
    const response = await apiClient.get<any>(endpoint);
    console.log(`Search returned ${response.total || 0} tasks`);
    
    // Transform backend response to match PaginatedResponse format
    const transformedResponse: PaginatedResponse<Task> = {
      success: true,
      data: response.tasks || [],
      pagination: {
        page: response.page || 1,
        limit: response.page_size || filters?.limit || 20,
        total: response.total || 0,
        totalPages: response.total_pages || 0,
        hasNext: response.page < response.total_pages,
        hasPrev: response.page > 1,
      },
      timestamp: new Date().toISOString(),
    };
    
    return transformedResponse;
  } catch (error) {
    console.error('Failed to search tasks:', error);
    throw error;
  }
}

// Claim/assign a task to a performer (self-assignment)
export async function claimTask(taskId: string, performerId: string): Promise<ApiResponse<any>> {
  console.log(`Claiming task ${taskId} for performer ${performerId}`);

  if (!taskId) {
    throw new Error('Task ID is required');
  }

  if (!performerId) {
    throw new Error('Performer ID is required');
  }

  try {
    // POST /assignments with task_id in body and performer_id as query param
    const response = await apiClient.post<any>(
      `/assignments?performer_id=${encodeURIComponent(performerId)}`,
      { task_id: taskId }
    );
    console.log(`Successfully claimed task: ${taskId}`);
    
    return {
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Failed to claim task ${taskId}:`, error);
    throw error;
  }
}
