import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  mobileNumber?: string;
}


interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<'USER' | 'ADMIN'>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  sendOtp: (data: { mobileNumber: string; action: 'login' | 'register'; name?: string; referralCode?: string }) => Promise<{ success: boolean; message: string; otpRef?: string }>;
  verifyOtp: (data: { otpRef: string; otp: string; mobileNumber: string; action: 'login' | 'register'; name?: string; referralCode?: string }) => Promise<'USER' | 'ADMIN'>;
  authConfig: { otpRequired: boolean };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(!!token);
  const [authConfig, setAuthConfig] = useState<{ otpRequired: boolean }>({ otpRequired: true });

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

  useEffect(() => {
    api.getAuthConfig().then(setAuthConfig).catch(() => {});
  }, []);

  const login = async (email: string, password: string): Promise<'USER' | 'ADMIN'> => {
    const res = await api.login(email, password);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    const profile = await api.getProfile();
    setUser(profile);
    return profile.role as 'USER' | 'ADMIN';
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await api.signup({ name, email, password });
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
  };

  const sendOtp = async (data: { mobileNumber: string; action: 'login' | 'register'; name?: string; referralCode?: string }) => {
    const res = await api.sendOtp(data);
    if (res.access_token && res.user) {
      localStorage.setItem('token', res.access_token);
      setToken(res.access_token);
      setUser(res.user);
    }
    return res;
  };

  const verifyOtp = async (data: { otpRef: string; otp: string; mobileNumber: string; action: 'login' | 'register'; name?: string; referralCode?: string }): Promise<'USER' | 'ADMIN'> => {
    const res = await api.verifyOtp(data);
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    const profile = await api.getProfile();
    setUser(profile);
    return profile.role as 'USER' | 'ADMIN';
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout, sendOtp, verifyOtp, authConfig }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
