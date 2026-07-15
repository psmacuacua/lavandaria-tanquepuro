"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/apiClient";
import {
  C, displayFont, bodyFont, monoFont, Card, Badge, formatMT, formatDate,
  CATEGORIES, ORDER_STATUSES, STATUS_META,
} from "@/components/ui";

export default function DashboardPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/invoices"), api.get("/clients")])
      .then(([i, c]) => { setInvoices(i.invoices); setClients(c.clients); })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const todayKey = now.toDateString();
  const monthKey = now.getFullYear() + "-" + now.getMonth();

  const stats = useMemo(() => {
    let hoje = 0, mes = 0, pendente = 0;
    const porCategoria = {}; const porStatusOp = {};
    CATEGORIES.forEach(c => porCategoria[c] = 0);
    ORDER_STATUSES.forEach(s => porStatusOp[s] = 0);
    invoices.forEach(inv => {
      const d = new Date(inv.data);
      if (d.toDateString() === todayKey && inv.status === "Pago") hoje += inv.total;
      if ((d.getFullYear() + "-" + d.getMonth()) === monthKey && inv.status === "Pago") mes += inv.total;
      if (inv.status === "Pendente") pendente += inv.total;
      inv.itens.forEach(it => { porCategoria[it.categoria] = (porCategoria[it.categoria] || 0) + it.subtotal; });
      const so = inv.statusOperacional || "Pendente";
      porStatusOp[so] = (porStatusOp[so] || 0) + 1;
    });
    return { hoje, mes, pendente, totalFaturas: invoices.length, porCategoria, porStatusOp };
  }, [invoices]);

  const chartData = CATEGORIES.map(c => ({ name: c === "Limpeza de Sofá" ? "Limp. Sofá" : c.replace("Lavagem ", "Lav. "), total: Math.round(stats.porCategoria[c] || 0) }));
  const donutData = ORDER_STATUSES.map(s => ({ name: s, value: stats.porStatusOp[s] || 0 })).filter(d => d.value > 0);
  const recentInvoices = [...invoices].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 6);
  const clientName = id => clients.find(c => c.id === id)?.nome || "—";

  return (
    <AppShell>
      {loading ? (
        <div style={{ color: C.inkSoft }}>A carregar...</div>
      ) : (
        <div>
          <div style={{
            background: `linear-gradient(135deg, ${C.navy}, ${C.cobaltDark} 60%, ${C.cobalt})`,
            borderRadius: 18, padding: "26px 28px", marginBottom: 18,
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
          }}>
            <div>
              <div style={{ color: C.gold, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>LAVANDARIA TANQUE PURO · PAINEL</div>
              <h1 style={{ fontFamily: displayFont, fontSize: 27, color: "#fff", marginBottom: 6 }}>{user?.role === "Admin" ? "Resumo financeiro" : "Os meus pedidos"}</h1>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13.5, maxWidth: 420 }}>
                {user?.role === "Admin" ? "Facturação, pagamentos pendentes e desempenho por categoria de serviço." : "Resumo dos pedidos que atendeste e do seu estado atual."}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
                <div style={{ color: C.gold, fontFamily: monoFont, fontWeight: 700, fontSize: 22 }}>{stats.totalFaturas}</div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10.5, letterSpacing: 0.5 }}>FACTURAS</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 12, padding: "12px 20px", textAlign: "center" }}>
                <div style={{ color: C.gold, fontFamily: monoFont, fontWeight: 700, fontSize: 22 }}>{clients.length}</div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10.5, letterSpacing: 0.5 }}>CLIENTES</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 18 }}>
            {["Pendente", "Em Processo", "Pronto para Entrega", "Entregue"].map(s => {
              const meta = STATUS_META[s];
              const Icon = meta.icon;
              return (
                <Card key={s} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: meta.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={20} color={meta.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft, fontWeight: 600, lineHeight: 1.2 }}>
                      {s === "Pendente" ? "Pedidos Pendentes" : s === "Em Processo" ? "Em Processamento" : s === "Pronto para Entrega" ? "Prontos p/ Entrega" : "Entregues"}
                    </div>
                    <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 22, color: C.ink }}>{stats.porStatusOp[s] || 0}</div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 22 }}>
            <Card>
              <div style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>Facturado hoje</div>
              <div style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 700, color: C.cobalt, marginTop: 6 }}>{formatMT(stats.hoje)}</div>
            </Card>
            <Card>
              <div style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>Facturado este mês</div>
              <div style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 700, color: C.mint, marginTop: 6 }}>{formatMT(stats.mes)}</div>
            </Card>
            <Card>
              <div style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>Pendente de pagamento</div>
              <div style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 700, color: C.amber, marginTop: 6 }}>{formatMT(stats.pendente)}</div>
            </Card>
            <Card>
              <div style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>Nº de facturas</div>
              <div style={{ fontFamily: monoFont, fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 6 }}>{stats.totalFaturas}</div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginBottom: 16 }}>
            <Card>
              <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15.5, color: C.ink, marginBottom: 14 }}>Facturação por serviço</div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: bodyFont, fill: C.inkSoft }} />
                  <YAxis tick={{ fontSize: 11, fontFamily: bodyFont, fill: C.inkSoft }} />
                  <Tooltip formatter={v => formatMT(v)} contentStyle={{ borderRadius: 10, fontFamily: bodyFont, fontSize: 13 }} />
                  <Bar dataKey="total" fill={C.cobalt} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15.5, color: C.ink, marginBottom: 6 }}>Visão geral dos pedidos</div>
              {donutData.length === 0 ? (
                <div style={{ color: C.inkSoft, fontSize: 13.5, padding: "30px 0", textAlign: "center" }}>Ainda não há pedidos.</div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {donutData.map((d, i) => <Cell key={i} fill={STATUS_META[d.name].color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontFamily: bodyFont, fontSize: 13 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", marginTop: 6 }}>
                {ORDER_STATUSES.map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, color: C.inkSoft }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: STATUS_META[s].color, display: "inline-block" }} /> {s}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 15.5, color: C.ink, marginBottom: 14 }}>Facturas recentes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentInvoices.length === 0 && <div style={{ color: C.inkSoft, fontSize: 13.5 }}>Ainda não há facturas.</div>}
              {recentInvoices.map(inv => (
                <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink }}>{inv.numero} · {clientName(inv.clienteId)}</div>
                    <div style={{ fontSize: 11.5, color: C.inkSoft }}>{formatDate(inv.data)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Badge tone="cobalt">{inv.statusOperacional || "Pendente"}</Badge>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 13.5, color: C.ink }}>{formatMT(inv.total)}</div>
                      <Badge tone={inv.status === "Pago" ? "mint" : "amber"}>{inv.status}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
