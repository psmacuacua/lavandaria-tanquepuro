"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, Trash2, Pencil, Check, X, Phone, MapPin, MessageSquare } from "lucide-react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/apiClient";
import { C, monoFont, displayFont, Card, Input, Label, Btn, thStyle, tdStyle } from "@/components/ui";

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nome: "", telefone: "", endereco: "" });
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: "", telefone: "", endereco: "" });
  const [smsStatus, setSmsStatus] = useState({});

  function load() {
    api.get("/clients").then(d => setClients(d.clients)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function addClient() {
    if (!form.nome.trim()) return;
    const d = await api.post("/clients", form);
    setClients([d.client, ...clients]);
    setForm({ nome: "", telefone: "", endereco: "" });
  }
  async function removeClient(id) {
    await api.del(`/clients/${id}`);
    setClients(clients.filter(c => c.id !== id));
  }
  function startEdit(c) { setEditingId(c.id); setEditForm({ nome: c.nome, telefone: c.telefone || "", endereco: c.endereco || "" }); }
  async function saveEdit(id) {
    const d = await api.patch(`/clients/${id}`, editForm);
    setClients(clients.map(c => c.id === id ? d.client : c));
    setEditingId(null);
  }
  async function notify(client) {
    setSmsStatus(s => ({ ...s, [client.id]: "A enviar..." }));
    try {
      const d = await api.post("/notify/sms", { clienteId: client.id, template: "personalizada", texto: `Ola ${client.nome}, contacte a Lavandaria Tanque Puro para mais informacoes sobre o seu pedido.` });
      setSmsStatus(s => ({ ...s, [client.id]: d.simulated ? "Simulado (ver consola do servidor)" : "Enviado!" }));
    } catch (e) {
      setSmsStatus(s => ({ ...s, [client.id]: e.message }));
    }
  }

  const filtered = clients.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <h1 style={{ fontFamily: displayFont, fontSize: 26, color: C.ink, marginBottom: 4 }}>Clientes</h1>
      <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 18 }}>{clients.length} clientes registados · morada e telefone ficam vinculados a cada pedido</div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.5fr auto", gap: 10, alignItems: "end" }}>
          <div><Label>Nome</Label><Input value={form.nome === "Cliente Balcao" ? "Cliente Balcão" : form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="84 000 0000" /></div>
          <div><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} placeholder="Bairro, rua, referência" /></div>
          <Btn onClick={addClient} icon={Plus}>Adicionar</Btn>
        </div>
      </Card>

      <Card>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: C.inkSoft }} />
          <Input placeholder="Procurar cliente..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        {loading ? <div style={{ color: C.inkSoft }}>A carregar...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead><tr style={{ textAlign: "left", color: C.inkSoft, fontSize: 12 }}>
              <th style={thStyle}>Nome</th><th style={thStyle}>Telefone</th><th style={thStyle}>Endereço</th><th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  {editingId === c.id ? (
                    <>
                      <td style={tdStyle}><input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} style={{ width: "100%", padding: 5, borderRadius: 6, border: `1px solid ${C.border}` }} /></td>
                      <td style={tdStyle}><input value={editForm.telefone} onChange={e => setEditForm({ ...editForm, telefone: e.target.value })} style={{ width: "100%", padding: 5, borderRadius: 6, border: `1px solid ${C.border}` }} /></td>
                      <td style={tdStyle}><input value={editForm.endereco} onChange={e => setEditForm({ ...editForm, endereco: e.target.value })} style={{ width: "100%", padding: 5, borderRadius: 6, border: `1px solid ${C.border}` }} /></td>
                      <td style={{ ...tdStyle, display: "flex", gap: 6 }}>
                        <button onClick={() => saveEdit(c.id)} style={{ border: "none", background: "none", cursor: "pointer" }}><Check size={15} color={C.mint} /></button>
                        <button onClick={() => setEditingId(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={15} color={C.red} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={tdStyle}>{c.nome}</td>
                      <td style={{ ...tdStyle, fontFamily: monoFont }}><Phone size={12} style={{ marginRight: 5, marginBottom: -1, color: C.inkSoft }} />{c.telefone || "—"}</td>
                      <td style={{ ...tdStyle, color: C.inkSoft, fontSize: 12.5 }}><MapPin size={12} style={{ marginRight: 5, marginBottom: -1 }} />{c.endereco || "—"}</td>
                      <td style={{ ...tdStyle, display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => startEdit(c)} style={{ border: "none", background: "none", cursor: "pointer" }}><Pencil size={14} color={C.inkSoft} /></button>
                        {c.id !== 1 && <button onClick={() => removeClient(c.id)} style={{ border: "none", background: "none", cursor: "pointer" }}><Trash2 size={14} color={C.red} /></button>}
                        {c.telefone && <button onClick={() => notify(c)} title="Enviar SMS" style={{ border: "none", background: "none", cursor: "pointer" }}><MessageSquare size={14} color={C.cobalt} /></button>}
                        {smsStatus[c.id] && <span style={{ fontSize: 10.5, color: C.inkSoft }}>{smsStatus[c.id]}</span>}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
