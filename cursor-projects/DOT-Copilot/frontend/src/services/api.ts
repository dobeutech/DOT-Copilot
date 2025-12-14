import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type {
  User,
  Fleet,
  Lesson,
  Module,
  Assignment,
  Notification,
  TrainingProgram,
  CompletionRecord,
  ApiResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    localStorage.removeItem('auth_token');
  }

  async resetPassword(email: string): Promise<ApiResponse<void>> {
    const response = await this.client.post('/auth/reset-password', { email });
    return response.data;
  }

  // User endpoints
  async getUsers(): Promise<ApiResponse<User[]>> {
    const response = await this.client.get('/users');
    return response.data;
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await this.client.get(`/users/${id}`);
    return response.data;
  }

  async createUser(user: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.post('/users', user);
    return response.data;
  }

  async updateUser(id: string, user: Partial<User>): Promise<ApiResponse<User>> {
    const response = await this.client.put(`/users/${id}`, user);
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  // Fleet endpoints
  async getFleets(): Promise<ApiResponse<Fleet[]>> {
    const response = await this.client.get('/fleets');
    return response.data;
  }

  async getFleet(id: string): Promise<ApiResponse<Fleet>> {
    const response = await this.client.get(`/fleets/${id}`);
    return response.data;
  }

  async createFleet(fleet: Partial<Fleet>): Promise<ApiResponse<Fleet>> {
    const response = await this.client.post('/fleets', fleet);
    return response.data;
  }

  async updateFleet(id: string, fleet: Partial<Fleet>): Promise<ApiResponse<Fleet>> {
    const response = await this.client.put(`/fleets/${id}`, fleet);
    return response.data;
  }

  // Training Program endpoints
  async getTrainingPrograms(): Promise<ApiResponse<TrainingProgram[]>> {
    const response = await this.client.get('/training-programs');
    return response.data;
  }

  async getTrainingProgram(id: string): Promise<ApiResponse<TrainingProgram>> {
    const response = await this.client.get(`/training-programs/${id}`);
    return response.data;
  }

  async createTrainingProgram(program: Partial<TrainingProgram>): Promise<ApiResponse<TrainingProgram>> {
    const response = await this.client.post('/training-programs', program);
    return response.data;
  }

  // Module endpoints
  async getModules(fleetId?: string): Promise<ApiResponse<Module[]>> {
    const url = fleetId ? `/modules?fleetId=${fleetId}` : '/modules';
    const response = await this.client.get(url);
    return response.data;
  }

  async createModule(module: Partial<Module>): Promise<ApiResponse<Module>> {
    const response = await this.client.post('/modules', module);
    return response.data;
  }

  async updateModule(id: string, module: Partial<Module>): Promise<ApiResponse<Module>> {
    const response = await this.client.put(`/modules/${id}`, module);
    return response.data;
  }

  // Lesson endpoints
  async getLessons(moduleId?: string): Promise<ApiResponse<Lesson[]>> {
    const url = moduleId ? `/lessons?moduleId=${moduleId}` : '/lessons';
    const response = await this.client.get(url);
    return response.data;
  }

  async createLesson(lesson: Partial<Lesson>): Promise<ApiResponse<Lesson>> {
    const response = await this.client.post('/lessons', lesson);
    return response.data;
  }

  async updateLesson(id: string, lesson: Partial<Lesson>): Promise<ApiResponse<Lesson>> {
    const response = await this.client.put(`/lessons/${id}`, lesson);
    return response.data;
  }

  // Assignment endpoints
  async getAssignments(userId?: string): Promise<ApiResponse<Assignment[]>> {
    const url = userId ? `/assignments?userId=${userId}` : '/assignments';
    const response = await this.client.get(url);
    return response.data;
  }

  async createAssignment(assignment: Partial<Assignment>): Promise<ApiResponse<Assignment>> {
    const response = await this.client.post('/assignments', assignment);
    return response.data;
  }

  async updateAssignment(id: string, assignment: Partial<Assignment>): Promise<ApiResponse<Assignment>> {
    const response = await this.client.put(`/assignments/${id}`, assignment);
    return response.data;
  }

  // Completion Record endpoints
  async getCompletionRecords(userId?: string): Promise<ApiResponse<CompletionRecord[]>> {
    const url = userId ? `/completion-records?userId=${userId}` : '/completion-records';
    const response = await this.client.get(url);
    return response.data;
  }

  async createCompletionRecord(record: Partial<CompletionRecord>): Promise<ApiResponse<CompletionRecord>> {
    const response = await this.client.post('/completion-records', record);
    return response.data;
  }

  // Notification endpoints
  async getNotifications(userId?: string): Promise<ApiResponse<Notification[]>> {
    const url = userId ? `/notifications?userId=${userId}` : '/notifications';
    const response = await this.client.get(url);
    return response.data;
  }

  async markNotificationRead(id: string): Promise<ApiResponse<Notification>> {
    const response = await this.client.put(`/notifications/${id}/read`);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;

