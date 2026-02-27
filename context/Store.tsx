
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project, Notification, User } from '../types';
import { authService } from '../services/authService';

interface StoreContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  projects: Project[];
  addProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  notifications: Notification[];
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  dismissNotification: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Session Check
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = await authService.verifySession();
      if (storedUser) {
        setUser(storedUser);
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'USB-C LiPo Charger', description: 'Dual cell balancing circuit with status LEDs', createdAt: '2024-05-10' },
    { id: '2', name: 'MacroPad Controller', description: '6-key mechanical pad with RP2040', createdAt: '2024-05-08' },
    { id: '3', name: 'Smart Plant Monitor', description: 'Moisture sensor + WiFi ESP8266', createdAt: '2024-04-22' },
  ]);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const login = async (email: string, password: string) => {
    try {
      const { user } = await authService.login(email, password);
      setUser(user);
      showNotification('success', `Welcome back, ${user.name}`);
    } catch (error: any) {
      showNotification('error', error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { user } = await authService.register(name, email, password);
      setUser(user);
      showNotification('success', 'Account created successfully');
    } catch (error: any) {
      showNotification('error', error.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    showNotification('info', 'You have been logged out');
  };

  const addProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
    showNotification('success', 'Project created successfully');
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    showNotification('info', 'Project deleted');
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => dismissNotification(id), 3000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <StoreContext.Provider value={{ 
      user, isLoading, login, register, logout, 
      projects, addProject, deleteProject,
      notifications, showNotification, dismissNotification 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
