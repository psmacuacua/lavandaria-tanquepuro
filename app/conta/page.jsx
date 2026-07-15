"use client";
import React, { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import { C, displayFont, bodyFont, Card, Input, Label, Btn } from "@/components/ui";

export default function ContaPage() {
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setOk(false);
    if (newPassword.length < 6) return setError("A nova password deve ter pelo menos 6 caracteres.");
    if (newPassword !== confirm) return setError("A confirmação não coincide com a nova password.");
    setLoading(true);
    try {
      await api.post("/account/password", { currentPassword, newPassword });
      setOk(true);
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
      if (refreshUser) await refreshUser();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 style={{ fontFamily: displayFont, fontSize: 26, color: C.ink, marginBottom: 4 }}>A minha conta</h1>
      <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 18 }}>{user?.nome} · {user?.username}</div>

      {user?.mustChangePassword && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: C.amberSoft, color: C.amber, padding: "12px 14px", borderRadius: 12, marginBottom: 18, fontSize: 13 }}>
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>Por segurança, tens de definir uma password nova antes de continuar a usar o sistema.</div>
        </div>
      )}

      <Card style={{ maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <KeyRound size={18} color={C.cobalt} />
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15.5, color: C.ink }}>Alterar password</div>
        </div>
        <form onSubmit={submit}>
          <Label>Password actual</Label>
          <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ marginBottom: 12 }} />
          <Label>Nova password</Label>
          <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ marginBottom: 12 }} />
          <Label>Confirmar nova password</Label>
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={{ marginBottom: 14 }} />
          {error && <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {ok && <div style={{ color: C.mint, fontSize: 13, marginBottom: 12 }}>Password alterada com sucesso!</div>}
          <Btn type="submit" disabled={loading}>{loading ? "A guardar..." : "Guardar nova password"}</Btn>
        </form>
      </Card>
    </AppShell>
  );
}
