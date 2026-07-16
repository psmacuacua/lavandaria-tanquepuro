"use client";
import React, { useEffect, useMemo, useState } from "react";
import { FileText, Search, Trash2, Check, X, ChevronRight, Phone, MapPin, MessageSquare, ClipboardCheck, AlertTriangle } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import {
  C, displayFont, bodyFont, monoFont, Card, Input, Label, Select, Btn, Badge,
  CATEGORIES, ORDER_STATUSES, STATUS_META, PAYMENT_METHODS, formatMT, formatDate,
  tabStyle, chipStyle, thStyle, tdStyle,
} from "@/components/ui";
import InspectionModal from "@/components/InspectionModal";
import { novaCondicaoVazia, condicaoTemAvisos, calcularSobretaxa } from "@/components/inspection";

export default function FaturacaoPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  function loadAll() {
    Promise.all([api.get("/articles"), api.get("/clients"), api.get("/invoices"), api.get("/settings")])
      .then(([a, c, i, s]) => { setArticles(a.articles); setClients(c.clients); setInvoices(i.invoices); setSettings(s.config); })
      .finally(() => setLoading(false));
  }
  useEffect(loadAll, []);

  const [tab, setTab] = useState("nova");
  const [catFilter, setCatFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [clienteId, setClienteId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [opStatusFilter, setOpStatusFilter] = useState("Todos");
  const [viewInvoice, setViewInvoice] = useState(null);
  const [pendingMethod, setPendingMethod] = useState("");

  useEffect(() => { if (!clienteId && clients[0]) setClienteId(clients[0].id); }, [clients]);

  const filteredArticles = useMemo(() => articles.filter(a => a.disponivel &&
    (catFilter === "Todos" || a.categoria === catFilter) &&
    (search.trim() === "" || a.nome.toLowerCase().includes(search.toLowerCase()))
  ), [articles, catFilter, search]);

  function addToCart(article) {
    setCart(prev => {
      const existing = prev.find(p => p.articleId === article.id);
      if (existing) return prev.map(p => p.articleId === article.id ? { ...p, qtd: p.qtd + 1 } : p);
      return [...prev, { articleId: article.id, nome: article.nome, categoria: article.categoria, precoBase: article.precoBase, precoDesconto: article.precoDesconto, qtd: 1, comDesconto: true, condicao: novaCondicaoVazia() }];
    });
  }
  function updateQtd(id, qtd) { setCart(prev => prev.map(p => p.articleId === id ? { ...p, qtd: Math.max(1, qtd) } : p)); }
  function toggleDesconto(id) { setCart(prev => prev.map(p => p.articleId === id ? { ...p, comDesconto: !p.comDesconto } : p)); }
  function removeFromCart(id) { setCart(prev => prev.filter(p => p.articleId !== id)); }
  function saveCondicao(id, condicao) { setCart(prev => prev.map(p => p.articleId === id ? { ...p, condicao } : p)); setInspectingId(null); }

  const [inspectingId, setInspectingId] = useState(null);

  const cartLines = cart.map(c => {
    const unit = c.comDesconto ? c.precoDesconto : c.precoBase;
    const sobretaxa = calcularSobretaxa(c.condicao);
    return { ...c, precoUnit: unit, subtotal: unit * c.qtd + sobretaxa, sobretaxa };
  });
  const subtotalBase = cartLines.reduce((s, c) => s + c.precoBase * c.qtd, 0);
  const totalSobretaxas = cartLines.reduce((s, c) => s + c.sobretaxa, 0);
  const total = cartLines.reduce((s, c) => s + c.subtotal, 0);
  const desconto = subtotalBase - (total - totalSobretaxas);
  const ivaPercentagem = settings?.ivaAtivo ? Number(settings.ivaPercentagem) : 0;
  const ivaValor = Math.round(total * (ivaPercentagem / 100) * 100) / 100;
  const totalComIva = Math.round((total + ivaValor) * 100) / 100;

  async function finalizarFatura(statusInicial) {
    if (cartLines.length === 0) return;
    const payload = {
      clienteId, subtotal: subtotalBase, desconto, total,
      status: statusInicial, metodoPagamento: statusInicial === "Pago" ? pendingMethod : null,
      itens: cartLines.map(c => ({
        artigoId: c.articleId, nome: c.nome, categoria: c.categoria, qtd: c.qtd,
        precoUnit: c.precoUnit, subtotal: c.subtotal, comDesconto: c.comDesconto,
        condicao: c.condicao, sobretaxa: c.sobretaxa,
      })),
    };
    const d = await api.post("/invoices", payload);
    setInvoices([d.invoice, ...invoices]);
    setCart([]);
    setPendingMethod("");
    setTab("lista");
  }

  const filteredInvoices = useMemo(() => [...invoices].filter(i =>
    (statusFilter === "Todos" || i.status === statusFilter) &&
    (opStatusFilter === "Todos" || (i.statusOperacional || "Pendente") === opStatusFilter)
  ).sort((a, b) => new Date(b.data) - new Date(a.data)), [invoices, statusFilter, opStatusFilter]);

  const clientName = id => clients.find(c => c.id === id)?.nome || "—";

  async function markPaid(id) {
    const d = await api.patch(`/invoices/${id}`, { status: "Pago" });
    setInvoices(invoices.map(i => i.id === id ? { ...i, ...d.invoice } : i));
    setViewInvoice(v => v ? { ...v, ...d.invoice } : v);
  }
  async function setMethod(id, m) {
    const d = await api.patch(`/invoices/${id}`, { metodoPagamento: m });
    setInvoices(invoices.map(i => i.id === id ? { ...i, ...d.invoice } : i));
    setViewInvoice(v => v ? { ...v, ...d.invoice } : v);
  }
  async function setStatusOp(id, s, avisarCliente) {
    const d = await api.patch(`/invoices/${id}`, { statusOperacional: s, avisarCliente });
    setInvoices(invoices.map(i => i.id === id ? { ...i, ...d.invoice } : i));
    setViewInvoice(v => v ? { ...v, ...d.invoice } : v);
    return d.sms;
  }
  async function updateItemCondicao(faturaId, itemId, condicao) {
    const d = await api.patch(`/invoices/${faturaId}/items/${itemId}`, { condicao });
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== faturaId) return inv;
      return { ...inv, ...d.fatura, itens: inv.itens.map(it => it.id === itemId ? { ...it, ...d.item } : it) };
    }));
    setViewInvoice(v => {
      if (!v || v.id !== faturaId) return v;
      return { ...v, ...d.fatura, itens: v.itens.map(it => it.id === itemId ? { ...it, ...d.item } : it) };
    });
  }

  return (
    <AppShell>
      <h1 style={{ fontFamily: displayFont, fontSize: 26, color: C.ink, marginBottom: 4 }}>Faturação & Pagamentos</h1>
      <div style={{ color: C.inkSoft, fontSize: 14, marginBottom: 18 }}>{user?.role === "Admin" ? "Cria faturas e controla o estado dos pagamentos" : "Cria pedidos e acompanha os que atendeste"}</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button onClick={() => setTab("nova")} style={tabStyle(tab === "nova")}>Nova Fatura</button>
        <button onClick={() => setTab("lista")} style={tabStyle(tab === "lista")}>{user?.role === "Admin" ? "Faturas" : "Meus Pedidos"} ({invoices.length})</button>
      </div>

      {loading ? <div style={{ color: C.inkSoft }}>A carregar...</div> : (
        <>
          {tab === "nova" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
              <Card>
                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  {["Todos", ...CATEGORIES].map(c => (
                    <button key={c} onClick={() => setCatFilter(c)} style={chipStyle(catFilter === c)}>{c}</button>
                  ))}
                </div>
                <div style={{ position: "relative", marginBottom: 12 }}>
                  <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: C.inkSoft }} />
                  <Input placeholder="Procurar artigo ou serviço..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
                </div>
                <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {filteredArticles.slice(0, 200).map(a => (
                    <div key={a.id} onClick={() => addToCart(a)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 9, cursor: "pointer", border: `1px solid ${C.border}` }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{a.nome}</div>
                        <div style={{ fontSize: 11, color: C.inkSoft }}>{a.categoria}</div>
                      </div>
                      <div style={{ textAlign: "right", fontFamily: monoFont }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.cobalt }}>{formatMT(a.precoDesconto)}</div>
                        {a.precoDesconto !== a.precoBase && <div style={{ fontSize: 10.5, color: C.inkSoft, textDecoration: "line-through" }}>{formatMT(a.precoBase)}</div>}
                      </div>
                    </div>
                  ))}
                  {filteredArticles.length === 0 && <div style={{ color: C.inkSoft, fontSize: 13.5, padding: 10 }}>Nenhum artigo encontrado.</div>}
                </div>
              </Card>

              <Card>
                <Label>Cliente</Label>
                <Select value={clienteId || ""} onChange={e => setClienteId(Number(e.target.value))} style={{ marginBottom: 8 }}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
                {(() => {
                  const cSel = clients.find(c => c.id === clienteId);
                  if (!cSel || (!cSel.telefone && !cSel.endereco)) return null;
                  return (
                    <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 14, display: "flex", flexDirection: "column", gap: 2 }}>
                      {cSel.telefone && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={11} /> {cSel.telefone}</div>}
                      {cSel.endereco && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={11} /> {cSel.endereco}</div>}
                    </div>
                  );
                })()}

                <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15, color: C.ink, marginBottom: 8 }}>Carrinho</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto", marginBottom: 12 }}>
                  {cartLines.length === 0 && <div style={{ color: C.inkSoft, fontSize: 13 }}>Adiciona artigos da lista à esquerda.</div>}
                  {cartLines.map(c => (
                    <div key={c.articleId} style={{ border: `1px solid ${condicaoTemAvisos(c.condicao) ? C.amber : C.border}`, borderRadius: 9, padding: 9 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{c.nome}</div>
                        <button onClick={() => removeFromCart(c.articleId)} style={{ border: "none", background: "none", cursor: "pointer" }}><Trash2 size={14} color={C.red} /></button>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                        <input type="number" min="1" value={c.qtd} onChange={e => updateQtd(c.articleId, Number(e.target.value))} style={{ width: 54, padding: "4px 6px", borderRadius: 7, border: `1px solid ${C.border}`, fontSize: 12.5 }} />
                        <label style={{ fontSize: 11.5, color: C.inkSoft, display: "flex", gap: 5, alignItems: "center" }}>
                          <input type="checkbox" checked={c.comDesconto} onChange={() => toggleDesconto(c.articleId)} /> desconto
                        </label>
                        <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 13 }}>{formatMT(c.subtotal)}</div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7, paddingTop: 7, borderTop: `1px dashed ${C.border}` }}>
                        <button onClick={() => setInspectingId(c.articleId)} style={{
                          display: "inline-flex", alignItems: "center", gap: 5, border: "none", background: "none", cursor: "pointer",
                          color: condicaoTemAvisos(c.condicao) ? C.amber : C.inkSoft, fontSize: 11.5, fontWeight: 600, fontFamily: bodyFont
                        }}>
                          <ClipboardCheck size={13} /> {condicaoTemAvisos(c.condicao) ? "Ver inspeção (com avisos)" : "Inspecionar artigo"}
                        </button>
                        {c.sobretaxa > 0 && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700, color: C.red }}>
                            <AlertTriangle size={11} /> +{formatMT(c.sobretaxa)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {inspectingId !== null && (() => {
                  const item = cart.find(c => c.articleId === inspectingId);
                  if (!item) return null;
                  return (
                    <InspectionModal itemNome={item.nome} condicao={item.condicao || novaCondicaoVazia()}
                      onSave={cond => saveCondicao(inspectingId, cond)} onClose={() => setInspectingId(null)} />
                  );
                })()}

                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, fontFamily: monoFont, fontSize: 13.5, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatMT(subtotalBase)}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: C.mint }}><span>Desconto</span><span>-{formatMT(desconto)}</span></div>
                  {totalSobretaxas > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: C.red }}><span>Sobretaxas (tratamento especial)</span><span>+{formatMT(totalSobretaxas)}</span></div>}
                  {ivaPercentagem > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: C.inkSoft }}><span>IVA ({ivaPercentagem}%)</span><span>+{formatMT(ivaValor)}</span></div>}
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 17, color: C.ink }}><span>Total</span><span>{formatMT(totalComIva)}</span></div>
                </div>

                <Label>Estado do pagamento</Label>
                <Select value={pendingMethod} onChange={e => setPendingMethod(e.target.value)} style={{ marginBottom: 12 }}>
                  <option value="">Sem pagamento (Pendente)</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>Pago via {m}</option>)}
                </Select>
                <Btn onClick={() => finalizarFatura(pendingMethod ? "Pago" : "Pendente")} disabled={cartLines.length === 0} icon={FileText}>Emitir Fatura</Btn>
              </Card>
            </div>
          )}

          {tab === "lista" && (
            <Card>
              <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                {["Todos", "Pago", "Pendente"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)} style={chipStyle(statusFilter === s)}>{s}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <button onClick={() => setOpStatusFilter("Todos")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, border: `1px solid ${opStatusFilter === "Todos" ? C.ink : C.border}`, background: opStatusFilter === "Todos" ? C.ink : "#fff", color: opStatusFilter === "Todos" ? "#fff" : C.inkSoft, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: bodyFont }}>Todos os estados</button>
                {ORDER_STATUSES.map(s => {
                  const meta = STATUS_META[s]; const active = opStatusFilter === s;
                  return (
                    <button key={s} onClick={() => setOpStatusFilter(s)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px 5px 9px", borderRadius: 999, border: `1px solid ${active ? meta.color : C.border}`, background: active ? meta.color : "#fff", color: active ? "#fff" : meta.color, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: bodyFont }}>
                      <meta.icon size={11} /> {s}
                    </button>
                  );
                })}
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                  <thead><tr style={{ textAlign: "left", color: C.inkSoft, fontSize: 12 }}>
                    <th style={thStyle}>Nº</th><th style={thStyle}>Data</th><th style={thStyle}>Cliente</th>
                    <th style={thStyle}>Total</th><th style={thStyle}>Pagamento</th><th style={thStyle}>Estado do Pedido</th><th style={thStyle}></th>
                  </tr></thead>
                  <tbody>
                    {filteredInvoices.map(inv => {
                      const so = inv.statusOperacional || "Pendente";
                      const soMeta = STATUS_META[so];
                      return (
                        <tr key={inv.id} style={{ borderTop: `1px solid ${C.border}` }}>
                          <td style={{ ...tdStyle, fontFamily: monoFont }}>{inv.numero}</td>
                          <td style={tdStyle}>{formatDate(inv.data)}</td>
                          <td style={tdStyle}>{clientName(inv.clienteId)}</td>
                          <td style={{ ...tdStyle, fontFamily: monoFont, fontWeight: 700 }}>{formatMT(inv.total)}</td>
                          <td style={tdStyle}><Badge tone={inv.status === "Pago" ? "mint" : "amber"}>{inv.status}</Badge></td>
                          <td style={tdStyle}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: soMeta.soft, color: soMeta.color, fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 999 }}>
                              <soMeta.icon size={11} /> {so}
                            </span>
                          </td>
                          <td style={tdStyle}><button onClick={() => setViewInvoice(inv)} style={{ border: "none", background: "none", cursor: "pointer", color: C.cobalt, display: "flex", alignItems: "center", gap: 4, fontWeight: 600, fontSize: 12.5 }}>Ver <ChevronRight size={14} /></button></td>
                        </tr>
                      );
                    })}
                    {filteredInvoices.length === 0 && <tr><td colSpan={7} style={{ padding: 20, color: C.inkSoft, textAlign: "center" }}>Sem faturas.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {viewInvoice && (
        <InvoiceDetail invoice={viewInvoice} client={clients.find(c => c.id === viewInvoice.clienteId)} settings={settings}
          onClose={() => setViewInvoice(null)} onMarkPaid={markPaid} onSetMethod={setMethod} onSetStatusOp={setStatusOp}
          onUpdateItemCondicao={updateItemCondicao} />
      )}
    </AppShell>
  );
}

function InvoiceDetail({ invoice, client, settings, onClose, onMarkPaid, onSetMethod, onSetStatusOp, onUpdateItemCondicao }) {
  const so = invoice.statusOperacional || "Pendente";
  const [smsMsg, setSmsMsg] = useState("");
  const [inspectingItem, setInspectingItem] = useState(null);

  async function handleStatusChange(newStatus) {
    const notifiable = newStatus === "Pronto para Entrega" || newStatus === "Entregue";
    const avisar = notifiable && client?.telefone ? window.confirm(`Enviar SMS a ${client.nome} a avisar "${newStatus}"?`) : false;
    const sms = await onSetStatusOp(invoice.id, newStatus, avisar);
    if (sms) setSmsMsg(sms.simulated ? "SMS simulado (ver consola do servidor)" : sms.ok ? "SMS enviado!" : sms.error || "Falha ao enviar SMS");
  }

  const nomeEmpresa = settings?.nome || "Lavandaria Tanque Puro";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,28,50,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 4, position: "relative", boxShadow: "0 30px 70px rgba(10,20,50,0.4)" }}>
        <div style={{ height: 10, background: `repeating-radial-gradient(circle at 10px 5px, transparent 0 4px, ${C.bg} 4px 5px)`, backgroundSize: "20px 10px", backgroundColor: C.cobaltDark }} />
        <div style={{ padding: "22px 26px 26px", fontFamily: monoFont }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            {settings?.logoUrl && <img src={settings.logoUrl} alt="Logótipo" style={{ height: 34, margin: "0 auto 8px", display: "block", objectFit: "contain" }} />}
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 17, color: C.ink }}>{nomeEmpresa.toUpperCase()}</div>
            <div style={{ fontSize: 11.5, color: C.inkSoft }}>Recibo / Fatura {invoice.numero}</div>
            <div style={{ fontSize: 11, color: C.inkSoft }}>{formatDate(invoice.data)}</div>
            {settings?.mostrarEndereco && settings?.endereco && <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 4 }}>{settings.endereco}</div>}
            <div style={{ fontSize: 10, color: C.inkSoft, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
              {settings?.mostrarNuit && settings?.nuit && <span>NUIT: {settings.nuit}</span>}
              {settings?.mostrarContacto && settings?.contacto && <span>{settings.contacto}</span>}
              {settings?.mostrarEmail && settings?.email && <span>{settings.email}</span>}
            </div>
            {(settings?.mostrarWebsite && settings?.website) || (settings?.mostrarContaBancaria && settings?.contaBancaria) ? (
              <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>
                {settings?.mostrarWebsite && settings?.website && <span>{settings.website}</span>}
                {settings?.mostrarWebsite && settings?.website && settings?.mostrarContaBancaria && settings?.contaBancaria && " · "}
                {settings?.mostrarContaBancaria && settings?.contaBancaria && <span>Conta: {settings.contaBancaria}</span>}
              </div>
            ) : null}
          </div>
          <div style={{ borderTop: `1px dashed ${C.border}`, borderBottom: `1px dashed ${C.border}`, padding: "10px 0", marginBottom: 12, fontSize: 12.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cliente</span><b>{client?.nome || "—"}</b></div>
            {client?.telefone && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, color: C.inkSoft }}><span>Telefone</span><span>{client.telefone}</span></div>}
            {client?.endereco && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, color: C.inkSoft }}><span>Endereço</span><span style={{ textAlign: "right", maxWidth: 220 }}>{client.endereco}</span></div>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {invoice.itens.map((it, i) => (
              <div key={it.id || i} style={{ fontSize: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>{it.qtd}x {it.nome}</span><span>{formatMT(it.subtotal)}</span></div>
                <div style={{ color: C.inkSoft, fontSize: 10.5 }}>{it.categoria} · {formatMT(it.precoUnit)}/un {it.comDesconto ? "(desconto)" : ""}</div>
                {condicaoTemAvisos(it.condicao) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.amber, fontSize: 10, marginTop: 2 }}>
                    <ClipboardCheck size={10} /> Inspeção com avisos registados{it.sobretaxa > 0 ? ` · tratamento especial +${formatMT(it.sobretaxa)}` : ""}
                  </div>
                )}
                {it.id && (
                  <button onClick={() => setInspectingItem(it)} style={{
                    marginTop: 3, display: "inline-flex", alignItems: "center", gap: 4, border: "none", background: "none",
                    cursor: "pointer", color: C.cobalt, fontSize: 10, fontWeight: 600, fontFamily: bodyFont, padding: 0
                  }}>
                    <ClipboardCheck size={10} /> {condicaoTemAvisos(it.condicao) ? "Ver / editar inspeção" : "Inspecionar artigo"}
                  </button>
                )}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 10, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatMT(invoice.subtotal)}</span></div>
            {invoice.desconto > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: C.mint }}><span>Desconto</span><span>-{formatMT(invoice.desconto)}</span></div>}
            {invoice.ivaValor > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: C.inkSoft }}><span>IVA ({invoice.ivaPercentagem}%)</span><span>+{formatMT(invoice.ivaValor)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 16, marginTop: 6, color: C.ink }}><span>TOTAL</span><span>{formatMT(invoice.total)}</span></div>
          </div>

          <div style={{ marginTop: 14, fontFamily: bodyFont }}>
            <Label>Estado do pedido</Label>
            <Select value={so} onChange={e => handleStatusChange(e.target.value)} style={{ fontSize: 12.5 }}>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            {smsMsg && <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}><MessageSquare size={12} /> {smsMsg}</div>}
          </div>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: bodyFont }}>
            <Badge tone={invoice.status === "Pago" ? "mint" : "amber"}>{invoice.status}{invoice.status === "Pago" ? ` · ${invoice.metodoPagamento}` : ""}</Badge>
            {invoice.status !== "Pago" && (
              <div style={{ display: "flex", gap: 6 }}>
                <Select value={invoice.metodoPagamento || ""} onChange={e => onSetMethod(invoice.id, e.target.value)} style={{ width: 130, fontSize: 12, padding: "6px 8px" }}>
                  <option value="">Método...</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
                <Btn size="sm" variant="success" icon={Check} onClick={() => onMarkPaid(invoice.id)} disabled={!invoice.metodoPagamento}>Pago</Btn>
              </div>
            )}
          </div>
        </div>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, border: "none", background: C.bg, borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} color={C.inkSoft} /></button>
      </div>

      {inspectingItem && (
        <InspectionModal itemNome={inspectingItem.nome} condicao={inspectingItem.condicao || novaCondicaoVazia()}
          onSave={async cond => { await onUpdateItemCondicao(invoice.id, inspectingItem.id, cond); setInspectingItem(null); }}
          onClose={() => setInspectingItem(null)} />
      )}
    </div>
  );
}
