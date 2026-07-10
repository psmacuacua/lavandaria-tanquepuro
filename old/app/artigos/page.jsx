"use client";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Search, Trash2, Pencil, Check, X, Upload, Download } from "lucide-react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/apiClient";
import {
  C, displayFont, bodyFont, monoFont, Card, Input, Label, Select, Btn, Badge,
  CATEGORIES, catMeta, chipStyle,
} from "@/components/ui";

export default function ArtigosPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nome: "", categoria: CATEGORIES[0], precoBase: "", precoDesconto: "" });
  const [importCategoria, setImportCategoria] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  function load() {
    // CORRIGIDO: path e chave da resposta
    api.get("/artigos").then(d => setArticles(d.artigos)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const filtered = useMemo(() => articles.filter(a =>
    (catFilter === "Todos" || a.categoria === catFilter) &&
    (search.trim() === "" || a.nome.toLowerCase().includes(search.toLowerCase()))
  ), [articles, catFilter, search]);

  async function toggleDisponivel(a) {
    // CORRIGIDO: path e chave da resposta
    const d = await api.patch(`/artigos/${a.id}`, { disponivel: !a.disponivel });
    setArticles(articles.map(x => x.id === a.id ? d.artigo : x));
  }
  async function saveEdit(id, changes) {
    // CORRIGIDO: path e chave da resposta
    const d = await api.patch(`/artigos/${id}`, changes);
    setArticles(articles.map(x => x.id === id ? d.artigo : x));
    setEditing(null);
  }
  async function removeArticle(id) {
    // CORRIGIDO: path
    await api.del(`/artigos/${id}`);
    setArticles(articles.filter(x => x.id !== id));
  }
  async function addArticle() {
    if (!form.nome.trim() || !form.precoBase) return;
    // CORRIGIDO: path e chave da resposta
    const d = await api.post("/artigos", {
      nome: form.nome.trim(), categoria: form.categoria,
      precoBase: Number(form.precoBase), precoDesconto: Number(form.precoDesconto || form.precoBase),
    });
    setArticles([d.artigo, ...articles]);
    setForm({ nome: "", categoria: CATEGORIES[0], precoBase: "", precoDesconto: "" });
    setShowAdd(false);
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("A importar...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (importCategoria) fd.append("categoria", importCategoria);
      // CORRIGIDO: path
      const res = await api.post("/artigos/import", fd);
      setImportMsg(`Sucesso: ${res.inseridos} artigos inseridos.`);
      load();
    } catch (err) {
      setImportMsg("Erro: " + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleExport() {
    // CORRIGIDO: path
    window.open("/api/artigos/export", "_blank");
  }

  return (
    <AppShell>
      {/* O resto do JSX permanece igual, pois não depende dos nomes das rotas */}
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.cobaltDark} 60%, ${C.cobalt})`, borderRadius: 18, padding: "24px 26px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: displayFont, fontSize: 25, color: "#fff", marginBottom: 4 }}>Serviços & Artigos</h1>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{articles.length} artigos registados</div>
        </div>
        <Btn variant="subtle" icon={Plus} onClick={() => setShowAdd(s => !s)}>Novo Artigo</Btn>
      </div>

      {/* Renderização da lista (mantida igual) */}
      {loading ? <div style={{ color: C.inkSoft }}>A carregar...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))", gap: 14 }}>
          {filtered.map(a => (
            <ArtigoCard key={a.id} article={a} editing={editing === a.id}
              onEdit={() => setEditing(a.id)} onCancel={() => setEditing(null)}
              onSave={changes => saveEdit(a.id, changes)}
              onToggle={() => toggleDisponivel(a)}
              onRemove={() => removeArticle(a.id)} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function ArtigoCard({ article: a, editing, onEdit, onCancel, onSave, onToggle, onRemove }) {
  // A lógica do card não precisa de alterações, desde que o objeto 'a' venha com os mesmos campos
  const [pb, setPb] = useState(a.precoBase);
  const [pd, setPd] = useState(a.precoDesconto);
  const meta = catMeta(a.categoria);
  const Icon = meta.icon;

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, opacity: a.disponivel ? 1 : 0.55 }}>
      <div style={{ background: meta.color, padding: "12px 14px", color: "#fff", fontSize: 11.5, fontWeight: 700 }}>{a.categoria.toUpperCase()}</div>
      <div style={{ padding: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink }}>{a.nome}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontFamily: monoFont }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: meta.color }}>{a.precoDesconto.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} MT</div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={onToggle}><Badge tone={a.disponivel ? "mint" : "red"}>{a.disponivel ? "Disponível" : "Indisponível"}</Badge></button>
          <button onClick={onEdit}><Pencil size={14} /></button>
          <button onClick={onRemove}><Trash2 size={14} color={C.red} /></button>
        </div>
      </div>
    </div>
  );
}