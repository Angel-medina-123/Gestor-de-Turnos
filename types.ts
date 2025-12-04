export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ANALYST = 'ANALYST'
}

export enum Priority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED'
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
}

export interface User {
  id: string;
  organizationId: string; // Link to Tenant
  username: string;
  fullName: string;
  role: Role;
  password?: string; 
}

export interface Task {
  id: string;
  organizationId: string; // Link to Tenant
  title: string;
  description: string;
  category: string;
  priority: Priority;
  assignedTo: string; // User ID
  deadline: string; // ISO Date string
  status: TaskStatus;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TaskTemplate {
  id: string;
  organizationId: string; // Link to Tenant
  name: string;
  items: Array<{
    title: string;
    description: string;
    category: string;
    priority: Priority;
    timeOffset: string; 
  }>;
}

export type ThemeMode = 'normal' | 'christmas';

export interface AppState {
  organizations: Organization[];
  users: User[];
  tasks: Task[];
  templates: TaskTemplate[];
  currentUser: User | null;
  themeMode: ThemeMode;
  isChristmasEnabled: boolean;
  isDarkMode: boolean;
  apiKey: string;
}

export interface SystemTestResult {
    step: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    details?: any;
}