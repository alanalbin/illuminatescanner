import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('illuminate_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('illuminate_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.login(username, password);
      localStorage.setItem('illuminate_token', res.token);
      const userData = { username: res.username, name: res.name, role: res.role };
      localStorage.setItem('illuminate_user', JSON.stringify(userData));
      setToken(res.token);
      setUser(userData);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('illuminate_token');
    localStorage.removeItem('illuminate_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
