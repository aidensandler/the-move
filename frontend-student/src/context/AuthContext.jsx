import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("tiger_token");
    if (token) {
      api.me()
        .then(setUser)
        .catch(() => localStorage.removeItem("tiger_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await api.login(email, password);
    localStorage.setItem("tiger_token", data.session.access_token);
    setUser(data.profile);
    return data;
  }

  async function register(fields) {
    return api.register(fields);
  }

  function logout() {
    localStorage.removeItem("tiger_token");
    setUser(null);
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  return useContext(AuthCtx);
}
