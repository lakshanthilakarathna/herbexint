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

// Mock users for localhost - Admin + 2 Sales Representatives
const MOCK_USERS = [
  {
    email: 'admin@herb.com',
    username: 'admin',
    password: 'password123',
    role_id: 'admin-role-id',
    permissions: [
      'orders:read', 'orders:write', 'orders:delete',
      'customers:read', 'customers:write', 'customers:delete',
      'products:read', 'products:write', 'products:delete',
      'inventory:read', 'inventory:write', 'inventory:delete',
      'visits:read', 'visits:write', 'visits:delete',
      'reports:read', 'reports:write',
      'users:read', 'users:write', 'users:delete',
      'settings:read', 'settings:write',
      'audit:read'
    ]
  },
  {
    email: 'sales1@herb.com',
    username: 'sales1',
    password: 'password123',
    role_id: 'sales-rep-role-id',
    permissions: [
      'orders:read', 'orders:write',
      'customers:read', 'customers:write',
      'products:read',
      'visits:read', 'visits:write',
      'reports:read'
    ]
  },
  {
    email: 'sales2@herb.com',
    username: 'sales2',
    password: 'password123',
    role_id: 'sales-rep-role-id',
    permissions: [
      'orders:read', 'orders:write',
      'customers:read', 'customers:write',
      'products:read',
      'visits:read', 'visits:write',
      'reports:read'
    ]
  }
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    try {
      // First check mock users (default users) - support both email and username
      let mockUser = MOCK_USERS.find(u => 
        (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password
      );
      let userData: User;
      
      if (mockUser) {
        // Handle default users (admin, sales1, sales2)
        const isAdmin = mockUser.role_id === 'admin-role-id';
        userData = {
          id: isAdmin ? 'admin-user-id' : (mockUser.username === 'sales1' ? 'sales-rep-1' : 'sales-rep-2'),
          name: isAdmin ? 'Admin User' : (mockUser.username === 'sales1' ? 'Sales Rep 1' : 'Sales Rep 2'),
          email: mockUser.email,
          role_id: mockUser.role_id,
          role_name: isAdmin ? 'System Administrator' : 'Sales Representative',
          permissions: mockUser.permissions,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } else {
        // Check localStorage for dynamically created users - support both email and username
        try {
          const allUsers = await apiClient.getUsers();
          const dbUser = allUsers.find((u: any) => 
            u.email === emailOrUsername || u.username === emailOrUsername
          );
          
          if (!dbUser) {
            throw new Error('Invalid username/email or password');
          }
          
          // Verify password (stored in localStorage)
          if (dbUser.password !== password) {
            throw new Error('Invalid username/email or password');
          }
          
          // Use the user data from localStorage
          userData = {
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
        } catch (dbError) {
          throw new Error('Invalid username/email or password');
        }
      }

      const mockToken = 'mock-token-' + Date.now();
      
      setUser(userData);
      setToken(mockToken);
      localStorage.setItem('accessToken', mockToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Save user to localStorage API (for default users)
      if (mockUser) {
        await apiClient.upsertUser(userData);
      }
      
      console.log('Login successful:', userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
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
        isLoading,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
