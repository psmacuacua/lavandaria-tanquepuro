"use client";
import React, { useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck, Pencil, Check, X, KeyRound } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import { C, monoFont, displayFont, Card, Input, Label, Select, Btn, Badge, thStyle, tdStyle } from "@/components/ui";

export default function UtilizadoresPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: "", password: "", nome: "", role: "Funcionario" });
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nome: "", username: "", role: "Funcionario" });
  const [resettingId, setResettingId] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [rowMsg, setRowMsg] = useState({});

  useEffect(() => {
    if (user && user.role !== "Admin") return;
    api.get("/users").then(d => setUsers(d.users)).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [user]);

  async function addUser() {
    setError("");
    if (!form.username.trim() || !form.password.trim() || !form.nome.trim()) return;
    try {
      const d = await api.post("/users", form);
      setUsers([...users, d.user]);
      setForm({ username: "", password: "", nome: "", role: "Funcionario" });
    } catch (e) { setError(e.message); }
  }
  async function removeUser(id) {
    setError("");
    try {
      await api.del(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (e) { setError(e.message); }
  }
  function startEdit(u) { setEditingId(u.id); setEditForm({ nome: u.nome, username: u.username, role: u.role }); setResettingId(null); }
  async function saveEdit(id) {
    try {
      const d = await api.patch(`/users/${id}`, editForm);
      setUsers(users.map(u => u.id === id ? d.user : u));
      setEditingId(null);
      setRowMsg(m => ({ ...m, [id]: "Dados atualizados." }));
    } catch (e) { setRowMsg(m => ({ ...m, [id]: e.message })); }
  }
  function startReset(id) { setResettingId(id); setResetPassword(""); setEditingId(null); }
  async function saveReset(id) {
    if (resetPassword.length < 6) { setRowMsg(m => ({ ...m, [id]: "Mínimo 6 caracteres." })); return; }
    try {
      await api.patch(`/users/${id}`, { novaPassword: resetPassword });
      setResettingId(null);
      setResetPassword("");
      setRowMsg(m => ({ ...m, [id]: "Password reposta — o utilizador terá de a alterar no próximo login." }));
    } catch (e) { setRowMsg(m => ({ ...m, [id]: e.message })); }
  }

  if (user && user.role !== "Admin") {
    return <AppShell><div style={{ color: C.inkSoft }}>Apenas administradores podem aceder a esta página.</div></AppShell>;
  }

  return (
    <AppShell>
      <h1 style={{ fontFamily: displayFont, fontSize: 26, color: C.ink, marginBottom: 4 }}>Utilizadores</h1>
      <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 18 }}>Gere quem tem acesso ao sistema</div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Username</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
          <div><Label>Palavra-passe inicial</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <div><Label>Função</Label>
            <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="Funcionario">Funcionário</option>
              <option value="Admin">Admin</option>
            </Select>
          </div>
          <Btn onClick={addUser} icon={Plus}>Adicionar</Btn>
        </div>
        <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 8 }}>O novo utilizador terá de definir uma password própria no primeiro login.</div>
        {error && <div style={{ color: C.red, fontSize: 12.5, marginTop: 10 }}>{error}</div>}
      </Card>

      <Card>
        {loading ? <div style={{ color: C.inkSoft }}>A carregar...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead><tr style={{ textAlign: "left", color: C.inkSoft, fontSize: 12 }}>
              <th style={thStyle}>Nome</th><th style={thStyle}>Username</th><th style={thStyle}>Função</th><th style={thStyle}></th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <React.Fragment key={u.id}>
                  <tr style={{ borderTop: `1px solid ${C.border}` }}>
                    {editingId === u.id ? (
                      <>
                        <td style={tdStyle}><input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} style={{ width: "100%", padding: 5, borderRadius: 6, border: `1px solid ${C.border}` }} /></td>
                        <td style={tdStyle}><input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} style={{ width: "100%", padding: 5, borderRadius: 6, border: `1px solid ${C.border}` }} /></td>
                        <td style={tdStyle}>
                          <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} style={{ padding: 5, borderRadius: 6, border: `1px solid ${C.border}` }}>
                            <option value="Funcionario">Funcionário</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ ...tdStyle, display: "flex", gap: 6 }}>
                          <button onClick={() => saveEdit(u.id)} style={{ border: "none", background: "none", cursor: "pointer" }}><Check size={15} color={C.mint} /></button>
                          <button onClick={() => setEditingId(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={15} color={C.red} /></button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={tdStyle}>{u.nome}</td>
                        <td style={{ ...tdStyle, fontFamily: monoFont }}>{u.username}</td>
                        <td style={tdStyle}><Badge tone={u.role === "Admin" ? "cobalt" : "mint"}>{u.role === "Admin" && <ShieldCheck size={11} style={{ marginRight: 3, marginBottom: -1 }} />}{u.role}</Badge></td>
                        <td style={{ ...tdStyle, display: "flex", gap: 10 }}>
                          <button onClick={() => startEdit(u)} title="Editar" style={{ border: "none", background: "none", cursor: "pointer" }}><Pencil size={14} color={C.inkSoft} /></button>
                          <button onClick={() => startReset(u.id)} title="Repor password" style={{ border: "none", background: "none", cursor: "pointer" }}><KeyRound size={14} color={C.cobalt} /></button>
                          <button onClick={() => removeUser(u.id)} title="Remover" style={{ border: "none", background: "none", cursor: "pointer" }}><Trash2 size={14} color={C.red} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                  {resettingId === u.id && (
                    <tr style={{ background: C.bg }}>
                      <td colSpan={4} style={{ padding: "10px 10px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <Input type="password" placeholder="Nova password (mín. 6 caracteres)" value={resetPassword} onChange={e => setResetPassword(e.target.value)} style={{ maxWidth: 260 }} />
                          <Btn size="sm" onClick={() => saveReset(u.id)} icon={Check}>Repor</Btn>
                          <Btn size="sm" variant="ghost" onClick={() => setResettingId(null)}>Cancelar</Btn>
                        </div>
                      </td>
                    </tr>
                  )}
                  {rowMsg[u.id] && (
                    <tr><td colSpan={4} style={{ padding: "0 10px 8px", fontSize: 11.5, color: C.inkSoft }}>{rowMsg[u.id]}</td></tr>
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
