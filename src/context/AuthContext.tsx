import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AuthUser,
  getStoredAuth,
  loginUser,
  registerUser,
  setAuthToken,
  setStoredAuth,
} from '@/services/api';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: { code: string; message: string } }>;
  register: (params: { email: string; password: string; timezone: string }) => Promise<{ ok: boolean; error?: { code: string; message: string } }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialStored = getStoredAuth();
if (initialStored?.token) {
  setAuthToken(initialStored.token);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    user: initialStored?.user || null,
    token: initialStored?.token || null,
  }));

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser({ email, password });
    if (!result.success || !result.data) {
      return { ok: false, error: result.error };
    }
    const user: AuthUser = {
      userId: result.data.userId,
      email: result.data.email,
      timezone: result.data.timezone,
    };
    setStoredAuth({ token: result.data.token, user });
    setAuthToken(result.data.token);
    setState({ user, token: result.data.token });
    return { ok: true };
  }, []);

  const register = useCallback(async (params: { email: string; password: string; timezone: string }) => {
    const result = await registerUser(params);
    if (!result.success || !result.data) {
      return { ok: false, error: result.error };
    }
    const user: AuthUser = {
      userId: result.data.userId,
      email: result.data.email,
      timezone: result.data.timezone,
    };
    setStoredAuth({ token: result.data.token, user });
    setAuthToken(result.data.token);
    setState({ user, token: result.data.token });
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setStoredAuth(null);
    setAuthToken(null);
    setState({ user: null, token: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.token),
      login,
      register,
      logout,
    }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
