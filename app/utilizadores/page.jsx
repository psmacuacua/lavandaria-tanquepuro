"use client";
import React, { useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck } from "lucide-react";
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
          <div><Label>Palavra-passe</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <div><Label>Função</Label>
            <Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="Funcionario">Funcionário</option>
              <option value="Admin">Admin</option>
            </Select>
          </div>
          <Btn onClick={addUser} icon={Plus}>Adicionar</Btn>
        </div>
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
                <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={tdStyle}>{u.nome}</td>
                  <td style={{ ...tdStyle, fontFamily: monoFont }}>{u.username}</td>
                  <td style={tdStyle}><Badge tone={u.role === "Admin" ? "cobalt" : "mint"}>{u.role === "Admin" && <ShieldCheck size={11} style={{ marginRight: 3, marginBottom: -1 }} />}{u.role}</Badge></td>
                  <td style={tdStyle}><button onClick={() => removeUser(u.id)} style={{ border: "none", background: "none", cursor: "pointer" }}><Trash2 size={14} color={C.red} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
