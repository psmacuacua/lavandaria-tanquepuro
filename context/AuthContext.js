"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/apiClient";

const AuthContext = createContext(null);

// Fecha a sessão automaticamente ao fim deste tempo sem nenhuma atividade real
// do utilizador (rato, teclado, toque, scroll) — independente de haver ou não
// pedidos ao servidor entretanto.
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = a carregar, null = sem sessão
  const router = useRouter();
  const timeoutRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;

  function refreshUser() {
    return api.get("/auth/session").then(d => setUser(d.user)).catch(() => setUser(null));
  }

  useEffect(() => { refreshUser(); }, []);

  async function login(username, password) {
    const data = await api.post("/auth/login", { username, password });
    setUser(data.user);
    router.push(data.user.mustChangePassword ? "/conta" : "/dashboard");
  }

  async function logout(motivo) {
    await api.del("/auth/session").catch(() => {});
    setUser(null);
    router.push(motivo === "inatividade" ? "/login?motivo=inatividade" : "/login");
  }

  // Temporizador de inatividade: só corre enquanto houver sessão iniciada.
  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    function reiniciarTemporizador() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (userRef.current) logout("inatividade");
      }, INACTIVITY_TIMEOUT_MS);
    }

    reiniciarTemporizador();
    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, reiniciarTemporizador, { passive: true }));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, reiniciarTemporizador));
    };
  }, [user]);

  return <AuthContext.Provider value={{ user, login, logout, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
