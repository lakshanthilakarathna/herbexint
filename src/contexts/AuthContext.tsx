import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role_id: string;
  role_name?: string;
  permissions?: string[];
  territory_id?: string;
  manager_id?: string;
  status: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  validateUserSession: () => Promise<boolean>;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// No mock users - all authentication through backend API

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const validateUserSession = async () => {
    if (!user || !token) return;
    
    try {
      const allUsers = await apiClient.getUsers();
      const dbUser = allUsers.find((u: any) => u.id === user.id);
      
      if (!dbUser || dbUser.status === 'deleted' || dbUser.status === 'inactive') {
        console.log('User session invalidated - user deleted or deactivated');
        logout();
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error validating user session:', error);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Verify user still exists and is active in database
          const allUsers = await apiClient.getUsers();
          const dbUser = allUsers.find((u: any) => u.id === userData.id);
          
          if (!dbUser || dbUser.status === 'deleted' || dbUser.status === 'inactive') {
            // User has been deleted or deactivated, clear session
            console.log('User no longer exists or is inactive, clearing session');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          } else {
            // User is still active, restore session
            setUser(userData);
            setToken(storedToken);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    // Set up periodic session validation (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      if (user && token) {
        await validateUserSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(sessionCheckInterval);
    };
  }, [user, token]);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      // Get all users from backend
      const allUsers = await apiClient.getUsers();
      const dbUser = allUsers.find((u: any) => 
        u.email === emailOrUsername || u.username === emailOrUsername
      );
      
      if (!dbUser) {
        throw new Error('User not found or has been deleted');
      }
      
      // Check if user is active (not deleted)
      if (dbUser.status === 'deleted' || dbUser.status === 'inactive') {
        throw new Error('User account has been deactivated');
      }
      
      // Verify password
      if (dbUser.password !== password) {
        throw new Error('Invalid password');
      }
      
      // Create user data object
      const userData: User = {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        phone: dbUser.phone,
        role_id: dbUser.role_id,
        role_name: dbUser.role_name,
        permissions: dbUser.permissions,
        status: dbUser.status,
        created_at: dbUser.created_at,
        updated_at: dbUser.updated_at
      };

      const token = 'token-' + Date.now();
      
      setUser(userData);
      setToken(token);
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('Login successful:', userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    // Mock: just return current token
    return Promise.resolve();
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) {
      return false;
    }
    return user.permissions.includes(permission);
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) {
      return false;
    }
    return roles.includes(user.role_id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshToken,
        validateUserSession,
        isLoading,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
