"use client";
import React, { useState } from "react";
import { Shirt } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { C, displayFont, bodyFont, Input, Label, Btn } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || "Utilizador ou palavra-passe incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: `linear-gradient(160deg, ${C.cobaltDark}, ${C.cobalt} 55%, #3B62A8)`,
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: bodyFont, padding: 20
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.12)", display: "flex",
            alignItems: "center", justifyContent: "center", margin: "0 auto 14px", border: "1px solid rgba(255,255,255,0.25)"
          }}>
            <Shirt color="#fff" size={28} />
          </div>
          <div style={{ fontFamily: displayFont, fontSize: 26, fontWeight: 700, color: "#fff", letterSpacing: 0.3 }}>Lavandaria Tanque Puro</div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13.5, marginTop: 4 }}>Gestão de serviços, faturas e caixa</div>
        </div>
        <form onSubmit={submit} style={{ background: "#fff", borderRadius: 18, padding: 26, boxShadow: "0 20px 50px rgba(10,20,50,0.35)" }}>
          <Label>Utilizador</Label>
          <Input autoFocus value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" style={{ marginBottom: 14 }} />
          <Label>Palavra-passe</Label>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ marginBottom: error ? 10 : 18 }} />
          {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <Btn type="submit" disabled={loading}>{loading ? "A entrar..." : "Entrar"}</Btn>
          <div style={{ marginTop: 16, fontSize: 12, color: C.inkSoft, background: C.bg, padding: 10, borderRadius: 10 }}>
            Acesso inicial (após <code>npm run db:setup</code>): <b>admin</b> / <b>admin123</b>
          </div>
        </form>
      </div>
    </div>
  );
}
