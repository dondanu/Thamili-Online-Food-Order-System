import React, { createContext, useContext, useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        // Support both shapes: { success: true, data: { user } } OR { user }
        const success = (data && data.success === true) || !!data.user;
        if (success) {
          const currentUser = data?.data?.user || data.user;
          setUser(currentUser);
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setIsLoading(false));
      return;
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      // Accept either shape:
      // 1) { success: true, data: { user, token } }
      // 2) { token, user }
      const success = (data && data.success === true) || (!!data.token && !!data.user);
      if (success) {
        const authUser = data?.data?.user || data.user;
        const token = data?.data?.token || data.token;
        setUser(authUser);
        if (token) {
          localStorage.setItem('token', token);
        }
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json().catch(() => ({}));

      // Accept either shape:
      // 1) { success: true, data: { user, token } }
      // 2) { token, user }
      const success = (data && data.success === true) || (!!data.token && !!data.user);
      if (success) {
        const authUser = data?.data?.user || data.user;
        const token = data?.data?.token || data.token;
        setUser(authUser);
        if (token) {
          localStorage.setItem('token', token);
        }
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};