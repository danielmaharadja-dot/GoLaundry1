import { createContext, useContext, useEffect, useState } from "react";
import { api, setAuthToken } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("golaundry_token");
    const savedUser = localStorage.getItem("golaundry_user");
    if (token && savedUser) {
      setAuthToken(token);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  function login(token, userData) {
    localStorage.setItem("golaundry_token", token);
    localStorage.setItem("golaundry_user", JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("golaundry_token");
    localStorage.removeItem("golaundry_user");
    setAuthToken(null);
    setUser(null);
  }

  function updateUser(userData) {
    localStorage.setItem("golaundry_user", JSON.stringify(userData));
    setUser(userData);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
