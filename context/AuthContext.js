"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = a carregar, null = sem sessão
  const router = useRouter();

  useEffect(() => {
    api.get("/auth/session").then(d => setUser(d.user)).catch(() => setUser(null));
  }, []);

  async function login(username, password) {
    const data = await api.post("/auth/login", { username, password });
    setUser(data.user);
    router.push("/dashboard");
  }

  async function logout() {
    await api.del("/auth/session");
    setUser(null);
    router.push("/login");
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
