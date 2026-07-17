"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, Trash2, Pencil, Check, X, Phone, MapPin, Link2, Megaphone } from "lucide-react";
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
  const [rowMsg, setRowMsg] = useState({});
  const [promoAllMsg, setPromoAllMsg] = useState("");
  const [sendingPromoAll, setSendingPromoAll] = useState(false);

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

  async function enviarLink(client) {
    setRowMsg(s => ({ ...s, [client.id]: "A enviar..." }));
    try {
      const d = await api.post("/notify/portal", { clienteId: client.id });
      setRowMsg(s => ({ ...s, [client.id]: d.simulated ? "Link enviado (simulado — ver consola do servidor)" : "Link enviado!" }));
    } catch (e) {
      setRowMsg(s => ({ ...s, [client.id]: e.message }));
    }
  }
  async function enviarPromo(client) {
    setRowMsg(s => ({ ...s, [client.id]: "A enviar..." }));
    try {
      const d = await api.post("/notify/promo", { clienteId: client.id });
      setRowMsg(s => ({ ...s, [client.id]: d.simulated ? "Promoção enviada (simulado)" : "Promoção enviada!" }));
    } catch (e) {
      setRowMsg(s => ({ ...s, [client.id]: e.message }));
    }
  }
  async function enviarPromoTodos() {
    if (!window.confirm("Enviar a mensagem promocional a todos os clientes com telefone registado?")) return;
    setSendingPromoAll(true); setPromoAllMsg("");
    try {
      const d = await api.post("/notify/promo", { todos: true });
      setPromoAllMsg(`Enviado a ${d.enviados} de ${d.total} clientes.`);
    } catch (e) {
      setPromoAllMsg("Erro: " + e.message);
    } finally {
      setSendingPromoAll(false);
    }
  }

  const filtered = clients.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontFamily: displayFont, fontSize: 26, color: C.ink }}>Clientes</h1>
        <div style={{ textAlign: "right" }}>
          <Btn variant="ghost" size="sm" icon={Megaphone} onClick={enviarPromoTodos} disabled={sendingPromoAll}>
            {sendingPromoAll ? "A enviar..." : "Enviar promoção a todos"}
          </Btn>
          {promoAllMsg && <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 4 }}>{promoAllMsg}</div>}
        </div>
      </div>
      <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 18 }}>{clients.length} clientes registados · morada e telefone ficam vinculados a cada pedido</div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.5fr auto", gap: 10, alignItems: "end" }}>
          <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
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
                <React.Fragment key={c.id}>
                  <tr style={{ borderTop: `1px solid ${C.border}` }}>
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
                        <td style={{ ...tdStyle, display: "flex", gap: 10, alignItems: "center" }}>
                          <button onClick={() => startEdit(c)} title="Editar" style={{ border: "none", background: "none", cursor: "pointer" }}><Pencil size={14} color={C.inkSoft} /></button>
                          {c.id !== 1 && <button onClick={() => removeClient(c.id)} title="Remover" style={{ border: "none", background: "none", cursor: "pointer" }}><Trash2 size={14} color={C.red} /></button>}
                          {c.telefone && (
                            <>
                              <button onClick={() => enviarLink(c)} title="Enviar link do portal (dívidas e estado)" style={{ border: "none", background: "none", cursor: "pointer" }}><Link2 size={14} color={C.cobalt} /></button>
                              <button onClick={() => enviarPromo(c)} title="Enviar mensagem promocional" style={{ border: "none", background: "none", cursor: "pointer" }}><Megaphone size={14} color={C.mint} /></button>
                            </>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                  {rowMsg[c.id] && (
                    <tr><td colSpan={4} style={{ padding: "0 10px 8px", fontSize: 11, color: C.inkSoft }}>{rowMsg[c.id]}</td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
