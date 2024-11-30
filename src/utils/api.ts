import { LoginResponse, User, UserExtraInfo, UserRole, RegisterUserData, TaskTemplate, Task, CreateTaskParams } from '@/types/api';
import { getAuthToken } from './cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
  }
  
  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Helper function for GET requests
async function Request<T>(url: string, type='GET', requiresAuth: boolean = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: type,
    headers,
    credentials: 'include',
  });

  return handleResponse<T>(response);
}



const api = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  registerUser: async (userData: RegisterUserData) => {
    // Get client IP from a public IP service
    // const ipResponse = await fetch('https://api.ipify.org?format=json');
    // const ipData = await ipResponse.json();
    
    const response = await fetch(`${API_BASE_URL}/api/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Registration failed');
    }

    return response.json();
  },

  get: (url: string) => fetch(url).then(res => res.json()),

  getProfile: async (token?: { value: string }): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token?.value || getAuthToken()}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    return response.json();
  },

  // Template management methods
  getTemplates: async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/templates`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    console.log(response);
    return response.json();
  },

  getPublicTemplates: async () => Request<TaskTemplate[]>('/api/task/templates', 'GET', true),

  // Create a new template
  createTemplate: async (templateData: any) => {
    const processedData = {
      ...templateData,
      dataSchema: typeof templateData.dataSchema === 'string' 
        ? templateData.dataSchema 
        : JSON.stringify(templateData.dataSchema),
      resultSchema: typeof templateData.resultSchema === 'string' 
        ? templateData.resultSchema 
        : JSON.stringify(templateData.resultSchema)
    };

    const response = await fetch(`${API_BASE_URL}/api/admin/template/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify(processedData),
    });

    if (!response.ok) {
      throw new Error('Failed to create template');
    }

    return response.json();
  },

  updateTemplate: async (templateData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/template/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify(templateData),
    });

    if (!response.ok) {
      throw new Error('Failed to update template');
    }

    return response.json();
  },

  deleteTemplate: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/template/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete template');
    }

    // Handle empty response
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  updateLastName: async (lastName: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/user/update-name`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify({ lastName }),
    });

    return handleResponse<User>(response);
  },

  updateProfile: async (extraInfo: UserExtraInfo): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/user/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify({ extraInfo }),
    });

    return handleResponse<User>(response);
  },

  updateUserRole: async (userId: number, role: UserRole): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/user/role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify({ userId, role }),
    });

    return handleResponse<User>(response);
  },

  getUserById: async (userId: number): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
    });

    return handleResponse<User>(response);
  },

  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/file/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
      body: formData,
    });

    return handleResponse<{ url: string }>(response);
  },

  // Task related methods
  createTask: async (taskData: CreateTaskParams): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/api/task/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
      credentials: 'include',
      body: JSON.stringify(taskData),
    });

    return handleResponse<Task>(response);
  },

  getAllTasks: async (): Promise<Task[]> => {
    return Request<Task[]>('/api/task/get_tasks');
  },

  getTaskById: async (taskId: number): Promise<Task> => {
    return Request<Task>(`/api/task/${taskId}`);
  },

  refreshPendingTask: async (taskId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/task/refresh/${taskId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to refresh task');
    }

    return response.json();
  }
};

export default api; 