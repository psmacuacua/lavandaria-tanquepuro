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
    api.get("/articles").then(d => setArticles(d.articles)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  const filtered = useMemo(() => articles.filter(a =>
    (catFilter === "Todos" || a.categoria === catFilter) &&
    (search.trim() === "" || a.nome.toLowerCase().includes(search.toLowerCase()))
  ), [articles, catFilter, search]);

  async function toggleDisponivel(a) {
    const d = await api.patch(`/articles/${a.id}`, { disponivel: !a.disponivel });
    setArticles(articles.map(x => x.id === a.id ? d.article : x));
  }
  async function saveEdit(id, changes) {
    const d = await api.patch(`/articles/${id}`, changes);
    setArticles(articles.map(x => x.id === id ? d.article : x));
    setEditing(null);
  }
  async function removeArticle(id) {
    await api.del(`/articles/${id}`);
    setArticles(articles.filter(x => x.id !== id));
  }
  async function addArticle() {
    if (!form.nome.trim() || !form.precoBase) return;
    const d = await api.post("/articles", {
      nome: form.nome.trim(), categoria: form.categoria,
      precoBase: Number(form.precoBase), precoDesconto: Number(form.precoDesconto || form.precoBase),
    });
    setArticles([d.article, ...articles]);
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
      const res = await api.post("/articles/import", fd);
      setImportMsg(
        `Lidas: ${res.linhasLidas} · Vazias/ inválidas removidas: ${res.vaziosRemovidos} · ` +
        `Duplicadas no ficheiro: ${res.duplicadosNoFicheiro} · Já existiam: ${res.jaExistiamNaBase} · ` +
        `Inseridas: ${res.inseridos}` +
        (res.categoriasIgnoradas?.length ? ` · Categorias ignoradas (não existem): ${res.categoriasIgnoradas.join(", ")}` : "")
      );
      load();
    } catch (err) {
      setImportMsg("Erro: " + err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleExport() {
    window.open("/api/articles/export", "_blank");
  }

  return (
    <AppShell>
      <div style={{
        background: `linear-gradient(135deg, ${C.navy}, ${C.cobaltDark} 60%, ${C.cobalt})`,
        borderRadius: 18, padding: "24px 26px", marginBottom: 20,
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14
      }}>
        <div>
          <h1 style={{ fontFamily: displayFont, fontSize: 25, color: "#fff", marginBottom: 4 }}>Serviços & Artigos</h1>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{articles.length} artigos em {CATEGORIES.length} categorias</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12, padding: "10px 18px", textAlign: "center" }}>
            <div style={{ color: C.gold, fontFamily: monoFont, fontWeight: 700, fontSize: 20 }}>{articles.length}</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10.5, letterSpacing: 0.5 }}>ARTIGOS</div>
          </div>
          <Btn variant="subtle" icon={Plus} onClick={() => setShowAdd(s => !s)}>Novo Artigo</Btn>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 10 }}>Importar / Exportar Excel</div>
        <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
          <div style={{ minWidth: 220 }}>
            <Label>Categoria do ficheiro (opcional)</Label>
            <Select value={importCategoria} onChange={e => setImportCategoria(e.target.value)}>
              <option value="">Cada folha do Excel = 1 categoria</option>
              {CATEGORIES.map(c => <option key={c} value={c}>Aplicar tudo a: {c}</option>)}
            </Select>
          </div>
          <Btn variant="ghost" icon={Upload} onClick={() => fileInputRef.current?.click()} disabled={importing}>
            {importing ? "A importar..." : "Importar .xlsx"}
          </Btn>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} />
          <Btn variant="ghost" icon={Download} onClick={handleExport}>Exportar .xlsx</Btn>
        </div>
        {importMsg && <div style={{ marginTop: 10, fontSize: 12.5, color: C.inkSoft, background: C.bg, padding: 10, borderRadius: 8 }}>{importMsg}</div>}
        <div style={{ marginTop: 8, fontSize: 11.5, color: C.inkSoft }}>
          A importação remove automaticamente linhas sem nome/preço e artigos duplicados (mesma categoria + nome).
        </div>
      </Card>

      {showAdd && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 1fr 1fr auto", gap: 10, alignItems: "end" }}>
            <div><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Categoria</Label>
              <Select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>Preço base (MT)</Label><Input type="number" value={form.precoBase} onChange={e => setForm({ ...form, precoBase: e.target.value })} /></div>
            <div><Label>Preço c/ desconto (MT)</Label><Input type="number" value={form.precoDesconto} onChange={e => setForm({ ...form, precoDesconto: e.target.value })} /></div>
            <Btn onClick={addArticle} icon={Check}>Guardar</Btn>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => setCatFilter("Todos")} style={chipStyle(catFilter === "Todos")}>Todos ({articles.length})</button>
        {CATEGORIES.map(c => {
          const meta = catMeta(c);
          const count = articles.filter(a => a.categoria === c).length;
          const active = catFilter === c;
          return (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 13px 6px 10px", borderRadius: 999,
              border: `1px solid ${active ? meta.color : C.border}`, background: active ? meta.color : "#fff",
              color: active ? "#fff" : meta.color, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: bodyFont
            }}>
              <meta.icon size={13} /> {c} ({count})
            </button>
          );
        })}
      </div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: C.inkSoft }} />
        <Input placeholder="Procurar artigo ou serviço..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, maxWidth: 420 }} />
      </div>

      {loading ? <div style={{ color: C.inkSoft }}>A carregar...</div> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))", gap: 14 }}>
            {filtered.slice(0, 300).map(a => (
              <ArtigoCard key={a.id} article={a} editing={editing === a.id}
                onEdit={() => setEditing(a.id)} onCancel={() => setEditing(null)}
                onSave={changes => saveEdit(a.id, changes)}
                onToggle={() => toggleDisponivel(a)}
                onRemove={() => removeArticle(a.id)} />
            ))}
          </div>
          {filtered.length === 0 && <div style={{ color: C.inkSoft, fontSize: 13.5, padding: 20, textAlign: "center" }}>Nenhum artigo encontrado.</div>}
          {filtered.length > 300 && <div style={{ color: C.inkSoft, fontSize: 12, padding: 14, textAlign: "center" }}>A mostrar 300 de {filtered.length} — refina a pesquisa para ver mais.</div>}
        </>
      )}
    </AppShell>
  );
}

function ArtigoCard({ article: a, editing, onEdit, onCancel, onSave, onToggle, onRemove }) {
  const [pb, setPb] = useState(a.precoBase);
  const [pd, setPd] = useState(a.precoDesconto);
  useEffect(() => { setPb(a.precoBase); setPd(a.precoDesconto); }, [editing]);
  const meta = catMeta(a.categoria);
  const Icon = meta.icon;
  const off = a.precoBase > 0 ? Math.round((1 - a.precoDesconto / a.precoBase) * 100) : 0;

  return (
    <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, opacity: a.disponivel ? 1 : 0.55, display: "flex", flexDirection: "column" }}>
      <div style={{ background: meta.color, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3 }}>
          <Icon size={13} /> {a.categoria.toUpperCase()}
        </div>
        {off > 0 && <div style={{ background: "rgba(255,255,255,0.22)", color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>-{off}%</div>}
      </div>
      <div style={{ background: meta.soft, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={30} color={meta.color} strokeWidth={1.5} />
      </div>
      <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: C.ink, minHeight: 34, lineHeight: 1.25 }}>{a.nome}</div>
        {editing ? (
          <div style={{ display: "flex", gap: 6 }}>
            <input type="number" value={pb} onChange={e => setPb(e.target.value)} placeholder="Base" style={{ width: "50%", padding: 5, borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: monoFont }} />
            <input type="number" value={pd} onChange={e => setPd(e.target.value)} placeholder="Desconto" style={{ width: "50%", padding: 5, borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: monoFont }} />
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontFamily: monoFont }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: meta.color }}>{a.precoDesconto.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} MT</div>
            {a.precoDesconto !== a.precoBase && <div style={{ fontSize: 11.5, color: C.inkSoft, textDecoration: "line-through" }}>{a.precoBase.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} MT</div>}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
          <button onClick={onToggle} style={{ border: "none", background: "none", cursor: "pointer" }}>
            <Badge tone={a.disponivel ? "mint" : "red"}>{a.disponivel ? "Disponível" : "Indisponível"}</Badge>
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            {editing ? (
              <>
                <button onClick={() => onSave({ precoBase: Number(pb), precoDesconto: Number(pd) })} style={{ border: "none", background: "none", cursor: "pointer" }}><Check size={15} color={C.mint} /></button>
                <button onClick={onCancel} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={15} color={C.red} /></button>
              </>
            ) : (
              <>
                <button onClick={onEdit} style={{ border: "none", background: "none", cursor: "pointer" }}><Pencil size={14} color={C.inkSoft} /></button>
                <button onClick={onRemove} style={{ border: "none", background: "none", cursor: "pointer" }}><Trash2 size={14} color={C.red} /></button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
