"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, FileText, Users, Shirt, UserCog, LogOut, Menu, X, Shirt as LogoIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { C, displayFont, bodyFont } from "@/components/ui";

function useIsMobile(breakpoint = 880) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (user === null) router.replace("/login");
  }, [user]);

  // Fecha o menu automaticamente ao mudar de página (mobile)
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (!user) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.inkSoft, fontFamily: bodyFont }}>A carregar...</div>;
  }

  const items = [
    { href: "/dashboard", label: "Painel Financeiro", icon: Home },
    { href: "/faturacao", label: "Faturação & Pagamentos", icon: FileText },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/artigos", label: "Serviços & Artigos", icon: Shirt },
  ];
  if (user.role === "Admin") items.push({ href: "/utilizadores", label: "Utilizadores", icon: UserCog });

  // --- Estilos responsivos calculados em JS (sem depender de CSS + transform sempre ativo) ---
  const sidebarStyle = isMobile
    ? {
        position: "fixed", top: 0, left: 0, height: "100vh", width: 250, zIndex: 60,
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform .22s ease",
      }
    : { position: "sticky", top: 0, height: "100vh", width: 250, flexShrink: 0 };

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100%", background: C.bg, fontFamily: bodyFont }}>
      {/* Fundo escurecido no mobile quando o menu está aberto */}
      {isMobile && mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(10,16,30,0.5)", zIndex: 55,
        }} />
      )}

      <div style={{ ...sidebarStyle, background: C.cobaltDark, padding: "22px 14px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LogoIcon color="#fff" size={18} />
            </div>
            <div style={{ fontFamily: displayFont, color: "#fff", fontWeight: 700, fontSize: 15.5, lineHeight: 1.15 }}>Lavandaria<br />Tanque Puro</div>
          </div>
          {isMobile && (
            <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <X size={20} color="rgba(255,255,255,0.7)" />
            </button>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, overflowY: "auto" }}>
          {items.map(it => {
            const active = pathname === it.href;
            return (
              <button key={it.href} onClick={() => router.push(it.href)} style={{
                display: "flex", alignItems: "center", gap: 11, padding: "11px 12px", borderRadius: 10, border: "none",
                background: active ? "rgba(255,255,255,0.14)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.65)",
                fontFamily: bodyFont, fontWeight: 600, fontSize: 14, cursor: "pointer", textAlign: "left"
              }}>
                <it.icon size={17} /> {it.label}
              </button>
            );
          })}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 14 }}>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13.5, fontWeight: 600, padding: "0 12px" }}>{user.nome}</div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, padding: "2px 12px 12px" }}>{user.role}</div>
          <button onClick={logout} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: "none",
            background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)", fontFamily: bodyFont, fontWeight: 600,
            fontSize: 13.5, cursor: "pointer", width: "100%"
          }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>

      <div style={{ flex: 1, width: "100%", padding: "26px 30px", minWidth: 0 }}>
        {isMobile && (
          <button onClick={() => setMobileOpen(true)} style={{
            display: "inline-flex", border: `1px solid ${C.border}`, background: "#fff", borderRadius: 9,
            padding: 8, marginBottom: 14, cursor: "pointer"
          }}>
            <Menu size={18} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
