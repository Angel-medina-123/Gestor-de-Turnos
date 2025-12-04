
import React, { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { AppState, Task, User, ThemeMode, Priority, TaskStatus, TaskTemplate, Organization, Role, SystemTestResult } from '../types';
import { MOCK_TASKS, MOCK_USERS, MOCK_ORGS, STORAGE_KEYS } from '../constants';
import { apiService } from '../services/api';

interface DataContextType {
  // Visible Data (Filtered by Tenant)
  users: User[];
  tasks: Task[];
  templates: TaskTemplate[];
  organizations: Organization[];
  
  // State
  currentUser: User | null;
  themeMode: ThemeMode;
  isChristmasEnabled: boolean;
  isDarkMode: boolean;
  apiKey: string;
  isLoading: boolean;
  connectionError: string | null;
  
  // Actions
  setApiKey: (key: string) => void;
  setCurrentUser: (user: User | null) => void;
  refreshData: () => Promise<void>;
  
  // Super Admin Actions
  addOrganization: (name: string, adminUsername: string, adminPass: string, adminName: string) => void;

  // Admin/Analyst Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'organizationId'>) => void;
  createTaskRange: (taskBase: Omit<Task, 'id' | 'createdAt' | 'status' | 'deadline' | 'organizationId'>, deadlineTime: string, startDate: string, endDate: string) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (taskId: string, notes?: string) => void;
  updateTaskNotes: (taskId: string, notes: string) => void;
  
  addUser: (fullName: string, username: string, password: string, role: Role) => void;
  resetUserPassword: (userId: string, newPass: string) => void;
  
  toggleThemeMode: () => void;
  toggleDarkMode: () => void;
  setChristmasThemeEnabled: (enabled: boolean) => void;
  
  // Template & Export
  saveTemplate: (template: Omit<TaskTemplate, 'organizationId'>) => void;
  deleteTemplate: (id: string) => void;
  assignTemplateToUser: (templateId: string, userId: string, startDate: string, endDate: string) => void;
  exportToCSV: () => void;
  
  // System Tools
  runBackendTest: () => Promise<SystemTestResult[]>;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Local snapshot keys for offline/cache persistence (only used when backend is unavailable)
  const CACHE_KEYS = {
    USERS: 'cache_users',
    TASKS: 'cache_tasks',
    TEMPLATES: 'cache_templates',
    ORGS: 'cache_orgs'
  };

  const saveCache = (key: string, data: any) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {}
  };
  const loadCache = <T,>(key: string): T | null => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : null;
    } catch (_) {
      return null;
    }
  };

  // --- RAW DATA (Global Store) ---
  const [rawUsers, setRawUsers] = useState<User[]>([]);
  const [rawTasks, setRawTasks] = useState<Task[]>([]);
  const [rawTemplates, setRawTemplates] = useState<TaskTemplate[]>([]);
  const [rawOrgs, setRawOrgs] = useState<Organization[]>([]);

  // --- SETTINGS ---
  const [isChristmasEnabled, setChristmasThemeEnabledState] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.CHRISTMAS_ENABLED) === 'true';
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode) || 'normal';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
  });

  const [apiKey, setApiKeyState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || process.env.API_KEY || '';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- DATA LOADING ---
  const loadData = useCallback(async () => {
    // Prevent multiple calls or race conditions
    setIsLoading(true);
    setConnectionError(null);
    
    // Safety Valve: Force stop loading if it takes too long
    const safetyValve = setTimeout(() => {
        setIsLoading((current) => {
            if (current) {
                console.warn("Safety valve triggered: Force stopping loading state.");
                setConnectionError("Tiempo de espera agotado. El backend puede estar inactivo.");
                return false;
            }
            return current;
        });
    }, 8000); // 8 seconds matches API timeout

    try {
      // 1. Health Check - Fast Fail (Wait up to 5s)
      const isOnline = await apiService.healthCheck();
      
      if (!isOnline) {
          throw new Error("Backend unreachable (Health check failed)");
      }

      console.log("Backend Online. Fetching data...");

      // 2. Load Data from API
      const [users, tasks, templates, orgs] = await Promise.all([
        apiService.fetch('users'),
        apiService.fetch('tasks'),
        apiService.fetch('templates'),
        apiService.fetch('orgs')
      ]);

      // 3. SEEDING STRATEGY
      // If backend is empty (first deployment or fresh DB), we MUST upload the Initial Mock Data
      // otherwise the app will be empty and useless.
      let finalUsers = users || [];
      let finalTasks = tasks || [];
      let finalOrgs = orgs || [];

      if ((!users || users.length === 0) && (!orgs || orgs.length === 0)) {
         console.log("⚠️ DB seems empty. Seeding Initial Data to Backend...");
         
         finalUsers = MOCK_USERS;
         finalTasks = MOCK_TASKS;
         finalOrgs = MOCK_ORGS;
         
         // Try to save init data back to server
         try {
             await Promise.all([
               apiService.save('users', MOCK_USERS),
               apiService.save('tasks', MOCK_TASKS),
               apiService.save('orgs', MOCK_ORGS)
             ]);
             console.log("✅ Seed data saved to Backend successfully.");
         } catch (e) {
             console.warn("Could not seed initial data to backend:", e);
         }
      }

      setRawUsers(finalUsers);
      setRawTasks(finalTasks);
      setRawTemplates(templates || []);
      setRawOrgs(finalOrgs);
      // Persist snapshot for offline use (only as cache)
      saveCache(CACHE_KEYS.USERS, finalUsers);
      saveCache(CACHE_KEYS.TASKS, finalTasks);
      saveCache(CACHE_KEYS.TEMPLATES, templates || []);
      saveCache(CACHE_KEYS.ORGS, finalOrgs);

    } catch (err: any) {
      console.error("Backend Sync Failed:", err);
      setConnectionError("No se pudo conectar con el backend (Modo Offline).");
      
      // Try to use last cached data when offline; fallback to mocks if no cache
      const cachedUsers = loadCache<User[]>(CACHE_KEYS.USERS);
      const cachedTasks = loadCache<Task[]>(CACHE_KEYS.TASKS);
      const cachedTemplates = loadCache<TaskTemplate[]>(CACHE_KEYS.TEMPLATES);
      const cachedOrgs = loadCache<Organization[]>(CACHE_KEYS.ORGS);

      setRawUsers(cachedUsers || MOCK_USERS);
      setRawTasks(cachedTasks || MOCK_TASKS);
      setRawOrgs(cachedOrgs || MOCK_ORGS);
      setRawTemplates(cachedTemplates || []);
      
    } finally {
      clearTimeout(safetyValve); // Clear safety timer
      setIsLoading(false); // Ensure UI unlocks
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- PERSISTENCE HELPERS ---
  const syncUsers = (users: User[]) => { 
      setRawUsers(users); 
      apiService.save('users', users)
        .then(() => saveCache(CACHE_KEYS.USERS, users))
        .catch(e => {
          console.error('FAILED TO SAVE USERS:', e);
          // Cache locally to survive reload when offline
          saveCache(CACHE_KEYS.USERS, users);
        }); 
  };
  const syncTasks = (tasks: Task[]) => { 
      setRawTasks(tasks); 
      apiService.save('tasks', tasks)
        .then(() => saveCache(CACHE_KEYS.TASKS, tasks))
        .catch(e => {
          console.warn('Sync failed', e);
          saveCache(CACHE_KEYS.TASKS, tasks);
        }); 
  };
  const syncTemplates = (tpls: TaskTemplate[]) => { 
      setRawTemplates(tpls); 
      apiService.save('templates', tpls)
        .then(() => saveCache(CACHE_KEYS.TEMPLATES, tpls))
        .catch(e => {
          console.warn('Sync failed', e);
          saveCache(CACHE_KEYS.TEMPLATES, tpls);
        }); 
  };
  const syncOrgs = (orgs: Organization[]) => { 
      setRawOrgs(orgs); 
      apiService.save('orgs', orgs)
        .then(() => saveCache(CACHE_KEYS.ORGS, orgs))
        .catch(e => {
          console.warn('Sync failed', e);
          saveCache(CACHE_KEYS.ORGS, orgs);
        }); 
  };

  // --- SETTINGS PERSISTENCE ---
  useEffect(() => localStorage.setItem(STORAGE_KEYS.THEME_MODE, themeMode), [themeMode]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.CHRISTMAS_ENABLED, String(isChristmasEnabled)), [isChristmasEnabled]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(isDarkMode)), [isDarkMode]);
  useEffect(() => { if (apiKey) localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey); }, [apiKey]);

  // Apply Dark Mode
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Revert Theme Safety
  useEffect(() => {
    if (!isChristmasEnabled && themeMode === 'christmas') {
      setThemeMode('normal');
    }
  }, [isChristmasEnabled, themeMode]);


  // --- MULTITENANCY FILTERING ---
  
  const filteredUsers = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.role === Role.SUPER_ADMIN) return rawUsers; 
      return rawUsers.filter(u => u.organizationId === currentUser.organizationId);
  }, [rawUsers, currentUser]);

  const filteredTasks = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.role === Role.SUPER_ADMIN) return []; 
      return rawTasks.filter(t => t.organizationId === currentUser.organizationId);
  }, [rawTasks, currentUser]);

  const filteredTemplates = useMemo(() => {
      if (!currentUser) return [];
      if (currentUser.role === Role.SUPER_ADMIN) return [];
      return rawTemplates.filter(t => t.organizationId === currentUser.organizationId);
  }, [rawTemplates, currentUser]);

  const filteredOrgs = useMemo(() => {
      return currentUser?.role === Role.SUPER_ADMIN ? rawOrgs : [];
  }, [rawOrgs, currentUser]);


  // --- HELPERS ---
  const getNextId = (items: any[], offset: number = 0): string => {
    const ids = items.map(t => parseInt(t.id, 10)).filter(n => !isNaN(n));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const nextId = maxId + 1 + offset;
    return String(nextId).padStart(4, '0');
  };

  // --- ACTIONS ---

  const setApiKey = (key: string) => setApiKeyState(key);

  // SUPER ADMIN ACTIONS
  const addOrganization = (name: string, adminUsername: string, adminPass: string, adminName: string) => {
      if (currentUser?.role !== Role.SUPER_ADMIN) return;
      
      const newOrgId = `org_${Date.now()}`;
      const newOrg: Organization = {
          id: newOrgId,
          name,
          createdAt: new Date().toISOString(),
          isActive: true
      };

      const newAdmin: User = {
          id: `u_${Date.now()}`,
          organizationId: newOrgId,
          username: adminUsername,
          password: adminPass,
          fullName: adminName,
          role: Role.ADMIN
      };

      syncOrgs([...rawOrgs, newOrg]);
      syncUsers([...rawUsers, newAdmin]);
  };

  // ADMIN / ANALYST ACTIONS

  const addTask = (newTask: Omit<Task, 'id' | 'createdAt' | 'status' | 'organizationId'>) => {
    if (!currentUser) return;
    const task: Task = {
      ...newTask,
      id: getNextId(rawTasks),
      organizationId: currentUser.organizationId,
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString()
    };
    syncTasks([task, ...rawTasks]);
  };

  const createTaskRange = (
    taskBase: Omit<Task, 'id' | 'createdAt' | 'status' | 'deadline' | 'organizationId'>, 
    deadlineTime: string, 
    startDate: string, 
    endDate: string
  ) => {
    if (!currentUser) return;
    const newTasks: Task[] = [];
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    current.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const deadline = `${dateStr}T${deadlineTime}`;
      
      newTasks.push({
        ...taskBase,
        organizationId: currentUser.organizationId,
        deadline,
        id: '', // Set later
        status: TaskStatus.PENDING,
        createdAt: new Date().toISOString()
      });
      current.setDate(current.getDate() + 1);
    }
    
    const updatedTasks = [
        ...newTasks.map((t, idx) => ({ ...t, id: getNextId(rawTasks, idx) })), 
        ...rawTasks
    ];
    syncTasks(updatedTasks);
  };

  const updateTask = (updatedTask: Task) => {
    syncTasks(rawTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const deleteTask = (id: string) => {
    syncTasks(rawTasks.filter(t => t.id !== id));
  };

  const toggleTaskStatus = (taskId: string) => {
    syncTasks(rawTasks.map(t => {
      if (t.id === taskId) {
        const isCompleted = t.status === TaskStatus.COMPLETED;
        return {
          ...t,
          status: isCompleted ? TaskStatus.PENDING : TaskStatus.COMPLETED,
          completedAt: isCompleted ? undefined : new Date().toISOString()
        };
      }
      return t;
    }));
  };

  const updateTaskNotes = (taskId: string, notes: string) => {
    syncTasks(rawTasks.map(t => t.id === taskId ? { ...t, notes } : t));
  };

  const addUser = (fullName: string, username: string, password: string, role: Role) => {
      if (!currentUser) return;
      const newUser: User = {
          id: `u_${Date.now()}`,
          organizationId: currentUser.organizationId,
          fullName,
          username,
          password,
          role
      };
      const newUsers = [...rawUsers, newUser];
      syncUsers(newUsers);
  };

const resetUserPassword = (userId: string, newPass: string) => {
    syncUsers(rawUsers.map(u => u.id === userId ? { ...u, password: newPass } : u));
  };

  const toggleThemeMode = () => {
    if (!isChristmasEnabled && themeMode === 'normal') return;
    setThemeMode(prev => prev === 'normal' ? 'christmas' : 'normal');
  };
  
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const setChristmasThemeEnabled = (enabled: boolean) => setChristmasThemeEnabledState(enabled);

  // --- TEMPLATES ---

  const saveTemplate = (template: Omit<TaskTemplate, 'organizationId'>) => {
    if (!currentUser) return;
    const fullTemplate: TaskTemplate = { ...template, organizationId: currentUser.organizationId };
    
    const exists = rawTemplates.find(t => t.id === template.id);
    let newTemplates;
    if (exists) {
        newTemplates = rawTemplates.map(t => t.id === template.id ? fullTemplate : t);
    } else {
        newTemplates = [...rawTemplates, fullTemplate];
    }
    syncTemplates(newTemplates);
  };

  const deleteTemplate = (id: string) => {
    syncTemplates(rawTemplates.filter(t => t.id !== id));
  };

  const assignTemplateToUser = (templateId: string, userId: string, startDate: string, endDate: string) => {
    if (!currentUser) return;
    const template = rawTemplates.find(t => t.id === templateId);
    if (!template) return;

    let current = new Date(startDate);
    const end = new Date(endDate);
    current.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    const newTasks: Task[] = [];

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      template.items.forEach(item => {
         const deadline = `${dateStr}T${item.timeOffset}`;
         newTasks.push({
            id: '',
            organizationId: currentUser.organizationId,
            title: item.title,
            description: item.description,
            category: item.category,
            priority: item.priority,
            assignedTo: userId,
            deadline: deadline,
            status: TaskStatus.PENDING,
            createdAt: new Date().toISOString()
         });
      });
      current.setDate(current.getDate() + 1);
    }

    const updatedTasks = [
        ...newTasks.map((t, idx) => ({ ...t, id: getNextId(rawTasks, idx) })),
        ...rawTasks
    ];
    syncTasks(updatedTasks);
  };

  const exportToCSV = () => {
      const headers = ['ID', 'Título', 'Categoría', 'Prioridad', 'Estado', 'Asignado A', 'Fecha Límite', 'Completado En', 'Notas'];
      const rows = filteredTasks.map(t => {
          const user = filteredUsers.find(u => u.id === t.assignedTo);
          return [
              t.id,
              `"${t.title.replace(/"/g, '""')}"`,
              `"${t.category.replace(/"/g, '""')}"`,
              t.priority,
              t.status,
              `"${(user ? user.fullName : 'Desconocido').replace(/"/g, '""')}"`,
              t.deadline,
              t.completedAt || '',
              `"${(t.notes || '').replace(/"/g, '""')}"`
          ];
      });

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `reporte_tareas_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // --- SYSTEM DIAGNOSTICS ---
  const runBackendTest = async (): Promise<SystemTestResult[]> => {
      const results: SystemTestResult[] = [];
      const testId = `test_user_${Date.now()}`;
      
      const log = (step: string, status: 'success' | 'error' | 'pending', message: string, details?: any) => {
          results.push({ step, status, message, details });
          console.log(`[TEST ${status.toUpperCase()}]: ${message}`, details || '');
      };

      try {
          // 1. Fetch current users to have a baseline
          log('1. PRE-CHECK', 'pending', 'Fetching current users from backend...');
          let initialUsers = [];
          try {
            initialUsers = await apiService.fetch('users');
            log('1. PRE-CHECK', 'success', `Fetched ${initialUsers.length} users.`);
          } catch (e) {
             log('1. PRE-CHECK', 'error', 'Failed to fetch users. Backend likely offline.');
             throw new Error("Backend offline");
          }

          // 2. Create Test User Object
          const testUser: User = {
              id: testId,
              organizationId: 'test_org',
              username: testId,
              fullName: 'Test Persistence User',
              role: Role.ANALYST,
              password: 'test'
          };

          // 3. POST to Backend
          log('2. WRITE', 'pending', `Posting new user ${testId} to backend...`);
          const newUsersList = [...initialUsers, testUser];
          const saveRes = await apiService.save('users', newUsersList);
          
          if(saveRes.success || saveRes.count) {
              log('2. WRITE', 'success', 'Backend responded with success.');
          } else {
              throw new Error('Backend returned failure on save');
          }

          // 4. Verification GET
          log('3. VERIFY', 'pending', 'Fetching users again to verify persistence...');
          const verifiedUsers = await apiService.fetch('users');
          
          const found = verifiedUsers.find((u: User) => u.id === testId);
          
          if (found) {
              log('3. VERIFY', 'success', 'User found in backend response!', found);
          } else {
              log('3. VERIFY', 'error', 'User NOT found in backend response.', verifiedUsers);
              throw new Error('Persistence failed: Data was not saved.');
          }
          
          // 5. Cleanup (Optional, but good for tests)
          log('4. CLEANUP', 'pending', 'Removing test user...');
          const cleanupList = verifiedUsers.filter((u: User) => u.id !== testId);
          await apiService.save('users', cleanupList);
          log('4. CLEANUP', 'success', 'Test user removed.');
          
          // Sync local state
          setRawUsers(cleanupList);

      } catch (e: any) {
          log('FATAL', 'error', 'Test suite failed or Backend Offline', e.message);
      }

      return results;
  };

  return (
    <DataContext.Provider value={{
      users: filteredUsers,
      tasks: filteredTasks,
      templates: filteredTemplates,
      organizations: filteredOrgs,
      currentUser, 
      themeMode,
      isChristmasEnabled,
      isDarkMode,
      apiKey,
      isLoading,
      connectionError,
      setApiKey,
      setCurrentUser,
      refreshData: loadData,
      addOrganization,
      addTask,
      createTaskRange,
      updateTask,
      deleteTask,
      toggleTaskStatus,
      updateTaskNotes,
      addUser,
      resetUserPassword,
      toggleThemeMode,
      toggleDarkMode,
      setChristmasThemeEnabled,
      saveTemplate,
      deleteTemplate,
      assignTemplateToUser,
      exportToCSV,
      runBackendTest
    }}>
      {children}
    </DataContext.Provider>
  );
};
