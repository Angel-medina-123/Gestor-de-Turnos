import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '../types';
import { DataContext } from './DataContext';
import { MOCK_USERS, STORAGE_KEYS } from '../constants';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // We need to set the user in DataContext to trigger the filtering
  const { currentUser, setCurrentUser } = useContext(DataContext);

  const login = async (username: string, pass: string): Promise<boolean> => {
    // We need to check against ALL users in storage, not just filtered ones (which are initially empty or null)
    const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const allUsers: User[] = storedUsers ? JSON.parse(storedUsers) : MOCK_USERS;

    const user = allUsers.find(u => u.username === username && u.password === pass);
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('app_current_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_current_user');
  };

  // On mount, check if there's a logged in user in LS (handled by DataContext init, but let's sync)
  React.useEffect(() => {
      const stored = localStorage.getItem('app_current_user');
      if (stored && !currentUser) {
          setCurrentUser(JSON.parse(stored));
      }
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};