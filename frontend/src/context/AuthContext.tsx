import React, { createContext, useContext, useState } from 'react';
import { setAuthToken } from '../api/client';
import { authApi } from '../api/services';
import { Usuario } from '../api/types';

interface AuthContextValue {
  usuario: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setAuthToken(result.token);
    setUsuario(result.usuario);
  };

  const logout = () => {
    setAuthToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
