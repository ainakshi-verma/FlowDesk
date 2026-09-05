const BASE_URL = '/api';

export class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('flowdesk_token');
  }

  setToken(token: string) {
    localStorage.setItem('flowdesk_token', token);
  }

  clearToken() {
    localStorage.removeItem('flowdesk_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {})
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await res.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  // Workspaces
  async getWorkspaces() {
    return this.request<any[]>('/workspaces');
  }

  async getWorkspaceSummary(workspaceId: string) {
    return this.request<any>(`/workspaces/${workspaceId}/summary`);
  }

  // Dashboard Overview
  async getDashboardOverview() {
    return this.request<any>('/dashboard/overview');
  }

  // Tasks
  async getTasks(workspaceId: string) {
    return this.request<any[]>(`/workspaces/${workspaceId}/tasks`);
  }

  async createTask(workspaceId: string, data: any) {
    return this.request<any>(`/workspaces/${workspaceId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTask(taskId: string, data: any) {
    return this.request<any>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteTask(taskId: string) {
    return this.request<any>(`/tasks/${taskId}`, {
      method: 'DELETE'
    });
  }

  // Jobs
  async getJobs(workspaceId: string) {
    return this.request<any[]>(`/workspaces/${workspaceId}/jobs`);
  }

  async createJob(workspaceId: string, data: any) {
    return this.request<any>(`/workspaces/${workspaceId}/jobs`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async matchJob(jobId: string) {
    return this.request<any>(`/jobs/${jobId}/match`, {
      method: 'POST'
    });
  }

  async generateJobTasks(jobId: string) {
    return this.request<any>(`/jobs/${jobId}/generate-tasks`, {
      method: 'POST'
    });
  }

  // Mock Interviews
  async getInterviews(workspaceId: string) {
    return this.request<any[]>(`/workspaces/${workspaceId}/interviews`);
  }

  async startInterview(workspaceId: string, data: { roleType: string; persona?: string; title?: string; jobId?: string }) {
    return this.request<any>(`/workspaces/${workspaceId}/interviews/start`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async submitInterviewTurn(interviewId: string, answer: string) {
    return this.request<any>(`/interviews/${interviewId}/turn`, {
      method: 'POST',
      body: JSON.stringify({ answer })
    });
  }

  async completeInterview(interviewId: string) {
    return this.request<any>(`/interviews/${interviewId}/complete`, {
      method: 'POST'
    });
  }

  async practiceWeakAreas(interviewId: string) {
    return this.request<any>(`/interviews/${interviewId}/practice-weak-areas`, {
      method: 'POST'
    });
  }

  // Calendar
  async replanCalendar(workspaceId: string, dailyStudyMinutes: number = 120) {
    return this.request<any>(`/workspaces/${workspaceId}/calendar/replan`, {
      method: 'POST',
      body: JSON.stringify({ dailyStudyMinutes })
    });
  }

  async getCalendarEvents(workspaceId: string) {
    return this.request<any[]>(`/workspaces/${workspaceId}/calendar/events`);
  }

  // Documents & RAG
  async getDocuments(workspaceId: string) {
    return this.request<any[]>(`/workspaces/${workspaceId}/documents`);
  }

  async createDocument(workspaceId: string, data: any) {
    return this.request<any>(`/workspaces/${workspaceId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async searchDocumentsRAG(workspaceId: string, query: string) {
    return this.request<any>(`/workspaces/${workspaceId}/documents/search`, {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }
}

export const api = new ApiService();
