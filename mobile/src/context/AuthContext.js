import React, { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app start: check saved token
  useEffect(() => {
    (async () => {
      try {
        const token = await api.getToken();
        if (token) {
          const me = await api.getCurrentUser();
          setUser(me);
        }
      } catch {
        await api.clearToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { access_token } = await api.login({ email, password });
    await api.saveToken(access_token);
    const me = await api.getCurrentUser();
    setUser(me);
  };

  const register = async (name, email, password) => {
    await api.register({ name, email, password });
  };

  const logout = async () => {
    await api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);