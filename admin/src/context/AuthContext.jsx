import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    setUnauthorizedHandler(() => setAdmin(null));

    if (getToken()) {
      api
        .getSummary()
        .then(() => setAdmin({ authenticated: true }))
        .catch(() => setAdmin(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(username, password) {
    const { token, admin: adminData } = await api.login(username, password);
    setToken(token);
    setAdmin(adminData);
  }

  function logout() {
    setToken(null);
    setAdmin(null);
  }

  return <AuthContext.Provider value={{ admin, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
