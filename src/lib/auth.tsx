import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<'USER' | 'ADMIN'>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(!!token);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchProfile();
    else setIsLoading(false);
  }, [token, fetchProfile]);

  const login = async (email: string, password: string): Promise<'USER' | 'ADMIN'> => {
    const res = await api.login(email, password);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    // Fetch profile to get full user data including role
    const profile = await api.getProfile();
    setUser(profile);
    return profile.role as 'USER' | 'ADMIN';
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await api.signup({ name, email, password });
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
