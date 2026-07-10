"use client";
import React from "react";
import {
  Droplets, Flame, Zap, Sparkles, Armchair, LayoutGrid, Shirt,
  PackageSearch, Loader2, ThumbsUp, CheckCircle2, RotateCcw,
} from "lucide-react";

export const C = {
  bg: "#F6F8FB",
  panel: "#FFFFFF",
  border: "#E2E8F2",
  ink: "#1B2440",
  inkSoft: "#5B6785",
  cobalt: "#24427A",
  cobaltDark: "#182E56",
  cobaltSoft: "#E9EEF8",
  mint: "#2F9E8F",
  mintSoft: "#E4F4F1",
  amber: "#C98A2E",
  amberSoft: "#FBF0DE",
  red: "#C24545",
  redSoft: "#FAEAEA",
  navy: "#0B1830",
  navySoft: "#13284B",
  gold: "#F2B33D",
  goldDark: "#C98A1F",
  goldSoft: "#FDF1DC",
};

export const displayFont = "'Space Grotesk', 'Segoe UI', sans-serif";
export const bodyFont = "'Inter', 'Segoe UI', sans-serif";
export const monoFont = "'IBM Plex Mono', 'Courier New', monospace";

export const PAYMENT_METHODS = ["Dinheiro", "M-Pesa", "e-Mola", "mKesh", "Cartão", "Transferência Bancária"];
export const CATEGORIES = ["Lavagem Normal", "Engomagem", "Lavagem Urgente", "Lavagem a Seco", "Limpeza de Sofá", "Capa e Tapete"];

export const CATEGORY_META = {
  "Lavagem Normal": { color: "#2F6FED", soft: "#E8F0FF", icon: Droplets },
  "Engomagem": { color: "#B4519A", soft: "#FBEAF6", icon: Flame },
  "Lavagem Urgente": { color: "#E2492F", soft: "#FDECE8", icon: Zap },
  "Lavagem a Seco": { color: "#1F8A82", soft: "#E4F5F3", icon: Sparkles },
  "Limpeza de Sofá": { color: "#8A5A2B", soft: "#F6ECE0", icon: Armchair },
  "Capa e Tapete": { color: "#3C8F4C", soft: "#E7F5EA", icon: LayoutGrid },
};
export function catMeta(cat) { return CATEGORY_META[cat] || { color: C.cobalt, soft: C.cobaltSoft, icon: Shirt }; }

export const ORDER_STATUSES = ["Pendente", "Em Processo", "Pronto para Entrega", "Entregue", "Devolvido"];
export const STATUS_META = {
  "Pendente": { color: "#8992A8", soft: "#EEF0F5", icon: PackageSearch },
  "Em Processo": { color: "#E2922F", soft: "#FDF1DE", icon: Loader2 },
  "Pronto para Entrega": { color: "#2F9E6B", soft: "#E4F5EC", icon: ThumbsUp },
  "Entregue": { color: "#2F6FED", soft: "#E8F0FF", icon: CheckCircle2 },
  "Devolvido": { color: "#C24545", soft: "#FAEAEA", icon: RotateCcw },
};

export function formatMT(v) {
  const n = Number(v || 0);
  return n.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MT";
}
export function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-PT") + " " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export function Btn({ children, onClick, variant = "primary", icon: Icon, type = "button", disabled, size = "md" }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center",
    borderRadius: 10, fontFamily: bodyFont, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
    border: "1px solid transparent", transition: "all .15s ease",
    padding: size === "sm" ? "6px 12px" : "10px 18px", fontSize: size === "sm" ? 13 : 14.5,
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: C.cobalt, color: "#fff" },
    ghost: { background: "transparent", color: C.cobalt, border: `1px solid ${C.border}` },
    danger: { background: C.redSoft, color: C.red },
    success: { background: C.mintSoft, color: C.mint },
    subtle: { background: C.cobaltSoft, color: C.cobalt },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant] }}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

export function Input(props) {
  return <input {...props} style={{
    width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`,
    fontFamily: bodyFont, fontSize: 14, color: C.ink, outline: "none", background: "#fff", ...props.style
  }} />;
}
export function Select(props) {
  return <select {...props} style={{
    width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`,
    fontFamily: bodyFont, fontSize: 14, color: C.ink, outline: "none", background: "#fff", ...props.style
  }}>{props.children}</select>;
}
export function Label({ children }) {
  return <div style={{ fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 5, fontFamily: bodyFont }}>{children}</div>;
}
export function Card({ children, style }) {
  return <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, ...style }}>{children}</div>;
}
export function Badge({ children, tone = "cobalt" }) {
  const map = {
    cobalt: [C.cobaltSoft, C.cobalt], mint: [C.mintSoft, C.mint], amber: [C.amberSoft, C.amber], red: [C.redSoft, C.red],
  };
  const [bg, fg] = map[tone];
  return <span style={{ background: bg, color: fg, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 999, fontFamily: bodyFont }}>{children}</span>;
}
export const thStyle = { padding: "8px 10px", fontWeight: 600 };
export const tdStyle = { padding: "10px 10px", color: C.ink };
export function tabStyle(active) {
  return {
    padding: "9px 16px", borderRadius: 10, border: `1px solid ${active ? C.cobalt : C.border}`,
    background: active ? C.cobalt : "#fff", color: active ? "#fff" : C.inkSoft, fontWeight: 600,
    fontSize: 13.5, cursor: "pointer", fontFamily: bodyFont
  };
}
export function chipStyle(active) {
  return {
    padding: "6px 13px", borderRadius: 999, border: `1px solid ${active ? C.cobalt : C.border}`,
    background: active ? C.cobaltSoft : "#fff", color: active ? C.cobalt : C.inkSoft, fontWeight: 600,
    fontSize: 12.5, cursor: "pointer", fontFamily: bodyFont
  };
}
