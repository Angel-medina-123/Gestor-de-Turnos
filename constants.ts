import { Priority, Role, Task, TaskStatus, User, Organization } from './types';

export const MOCK_ORGS: Organization[] = [
  {
    id: 'org1',
    name: 'Logística Internacional S.A.',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: 'org2',
    name: 'Servicios Navideños Ltd.',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

export const MOCK_USERS: User[] = [
  // SUPER ADMIN
  {
    id: 'su1',
    organizationId: 'system',
    username: 'creator_oficial',
    fullName: 'Super Usuario Sistema',
    role: Role.SUPER_ADMIN,
    password: 'Creator2025*'
  },
  // ORG 1 USERS
  {
    id: 'u1',
    organizationId: 'org1',
    username: 'admin_oficial',
    fullName: 'Gerente Logística',
    role: Role.ADMIN,
    password: 'Admin2025*'
  },
  {
    id: 'u2',
    organizationId: 'org1',
    username: 'analista_logistica',
    fullName: 'Juan Pérez',
    role: Role.ANALYST,
    password: 'user'
  },
  // ORG 2 USERS
  {
    id: 'u3',
    organizationId: 'org2',
    username: 'admin_navidad',
    fullName: 'Santa Admin',
    role: Role.ADMIN,
    password: '123456'
  },
  {
    id: 'u4',
    organizationId: 'org2',
    username: 'elfo_jefe',
    fullName: 'Elfo Operativo',
    role: Role.ANALYST,
    password: 'user'
  }
];

export const MOCK_TASKS: Task[] = [
  // ORG 1 TASKS
  {
    id: '0001',
    organizationId: 'org1',
    title: 'Revisar aduanas',
    description: 'Verificar documentación de contenedores entrantes.',
    category: 'Aduanas',
    priority: Priority.HIGH,
    assignedTo: 'u2',
    deadline: new Date().toISOString().split('T')[0] + 'T10:00',
    status: TaskStatus.PENDING,
    createdAt: new Date().toISOString()
  },
  // ORG 2 TASKS
  {
    id: '0002',
    organizationId: 'org2',
    title: 'Inventario de Juguetes',
    description: 'Contar stock en almacén norte.',
    category: 'Inventario',
    priority: Priority.CRITICAL,
    assignedTo: 'u4',
    deadline: new Date().toISOString().split('T')[0] + 'T12:00',
    status: TaskStatus.PENDING,
    createdAt: new Date().toISOString()
  }
];

export const STORAGE_KEYS = {
  ORGS: 'app_orgs',
  USERS: 'app_users',
  TASKS: 'app_tasks',
  TEMPLATES: 'app_templates',
  THEME_MODE: 'app_theme_mode',
  CHRISTMAS_ENABLED: 'app_christmas_enabled',
  DARK_MODE: 'app_dark_mode',
  API_KEY: 'app_gemini_key'
};
