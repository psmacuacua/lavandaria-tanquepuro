"use client";
import React, { useEffect, useRef, useState } from "react";
import { Building2, Upload, Check, Trash2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import { C, displayFont, bodyFont, Card, Input, Label, Btn } from "@/components/ui";

function CheckRow({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5, color: C.ink, fontFamily: bodyFont, cursor: "pointer", padding: "6px 0" }}>
      <input type="checkbox" checked={!!checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get("/settings").then(d => setForm(d.config));
  }, []);

  function set(key, value) { setForm(f => ({ ...f, [key]: value })); }

  function onPickLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function save() {
    setSaving(true); setMsg("");
    try {
      if (logoFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (k !== "logoUrl") fd.append(k, v); });
        fd.append("logo", logoFile);
        const d = await api.patch("/settings", fd);
        setForm(d.config);
        setLogoFile(null);
        setLogoPreview(null);
      } else {
        const d = await api.patch("/settings", form);
        setForm(d.config);
      }
      setMsg("Configurações guardadas com sucesso.");
    } catch (e) {
      setMsg("Erro: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function removerLogo() {
    setSaving(true);
    try {
      const d = await api.patch("/settings", { removerLogo: true });
      setForm(d.config);
      setLogoPreview(null);
      setLogoFile(null);
    } finally {
      setSaving(false);
    }
  }

  if (user && user.role !== "Admin") {
    return <AppShell><div style={{ color: C.inkSoft }}>Apenas administradores podem aceder a esta página.</div></AppShell>;
  }
  if (!form) return <AppShell><div style={{ color: C.inkSoft }}>A carregar...</div></AppShell>;

  return (
    <AppShell>
      <h1 style={{ fontFamily: displayFont, fontSize: 26, color: C.ink, marginBottom: 4 }}>Configurações da Lavandaria</h1>
      <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 18 }}>Dados que aparecem na fatura/recibo e taxa de IVA aplicada</div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Building2 size={18} color={C.cobalt} />
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15.5, color: C.ink }}>Dados da empresa</div>
          </div>

          <Label>Nome da lavandaria</Label>
          <Input value={form.nome} onChange={e => set("nome", e.target.value)} style={{ marginBottom: 12 }} />

          <Label>Logótipo</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: C.bg, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {(logoPreview || form.logoUrl) ? <img src={logoPreview || form.logoUrl} alt="Logótipo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <Building2 size={22} color={C.inkSoft} />}
            </div>
            <Btn variant="ghost" icon={Upload} size="sm" onClick={() => fileInputRef.current?.click()}>Carregar imagem</Btn>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickLogo} style={{ display: "none" }} />
            {form.logoUrl && <button onClick={removerLogo} style={{ border: "none", background: "none", cursor: "pointer" }} title="Remover logótipo"><Trash2 size={16} color={C.red} /></button>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><Label>NUIT</Label><Input value={form.nuit} onChange={e => set("nuit", e.target.value)} /></div>
            <div><Label>Contacto (telefone)</Label><Input value={form.contacto} onChange={e => set("contacto", e.target.value)} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><Label>Website</Label><Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="www.exemplo.co.mz" /></div>
          </div>
          <Label>Endereço</Label>
          <Input value={form.endereco} onChange={e => set("endereco", e.target.value)} style={{ marginBottom: 12 }} />
          <Label>Conta bancária</Label>
          <Input value={form.contaBancaria} onChange={e => set("contaBancaria", e.target.value)} placeholder="NIB / IBAN / nº de conta" style={{ marginBottom: 4 }} />
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15.5, color: C.ink, marginBottom: 10 }}>IVA</div>
            <CheckRow checked={form.ivaAtivo} onChange={e => set("ivaAtivo", e.target.checked)} label="Aplicar IVA nas faturas" />
            <Label>Taxa de IVA (%)</Label>
            <Input type="number" step="0.01" min="0" max="100" value={form.ivaPercentagem} onChange={e => set("ivaPercentagem", e.target.value)} disabled={!form.ivaAtivo} />
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 6 }}>Muda aqui sempre que a taxa oficial for atualizada — aplica-se a partir da próxima fatura emitida.</div>
          </Card>

          <Card>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15.5, color: C.ink, marginBottom: 10 }}>Mostrar na fatura</div>
            <CheckRow checked={form.mostrarEndereco} onChange={e => set("mostrarEndereco", e.target.checked)} label="Endereço" />
            <CheckRow checked={form.mostrarNuit} onChange={e => set("mostrarNuit", e.target.checked)} label="NUIT" />
            <CheckRow checked={form.mostrarContacto} onChange={e => set("mostrarContacto", e.target.checked)} label="Contacto (telefone)" />
            <CheckRow checked={form.mostrarEmail} onChange={e => set("mostrarEmail", e.target.checked)} label="Email" />
            <CheckRow checked={form.mostrarWebsite} onChange={e => set("mostrarWebsite", e.target.checked)} label="Website" />
            <CheckRow checked={form.mostrarContaBancaria} onChange={e => set("mostrarContaBancaria", e.target.checked)} label="Conta bancária" />
          </Card>

          <Btn onClick={save} disabled={saving} icon={Check}>{saving ? "A guardar..." : "Guardar configurações"}</Btn>
          {msg && <div style={{ fontSize: 12.5, color: msg.startsWith("Erro") ? C.red : C.mint }}>{msg}</div>}
        </div>
      </div>
    </AppShell>
  );
}
