"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Droplets, AlertCircle } from "lucide-react";

const C = {
  bg: "#F6F8FB", panel: "#FFFFFF", border: "#E2E8F2", ink: "#1B2440", inkSoft: "#5B6785",
  cobalt: "#24427A", cobaltDark: "#182E56", mint: "#2F9E8F", mintSoft: "#E4F4F1",
  amber: "#C98A2E", amberSoft: "#FBF0DE", red: "#C24545", redSoft: "#FAEAEA",
};
const displayFont = "'Space Grotesk', 'Segoe UI', sans-serif";
const bodyFont = "'Inter', 'Segoe UI', sans-serif";
const monoFont = "'IBM Plex Mono', 'Courier New', monospace";

function formatMT(v) {
  return Number(v || 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MT";
}
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("pt-PT");
}

const STATUS_COLORS = {
  "Pendente": ["#EEF0F5", "#8992A8"],
  "Em Processo": ["#FDF1DE", "#E2922F"],
  "Pronto para Entrega": ["#E4F5EC", "#2F9E6B"],
  "Entregue": ["#E8F0FF", "#2F6FED"],
  "Devolvido": ["#FAEAEA", "#C24545"],
};

export default function PortalClientePage() {
  const params = useParams();
  const [data, setData] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/portal/${params.token}`)
      .then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao carregar.");
        setData(json);
      })
      .catch(e => setError(e.message));
  }, [params.token]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: bodyFont, padding: "24px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.cobaltDark}, ${C.cobalt})`, borderRadius: 16,
          padding: "22px 20px", textAlign: "center", marginBottom: 18
        }}>
          {data?.empresa?.logoUrl && <img src={data.empresa.logoUrl} alt="Logótipo" style={{ height: 36, margin: "0 auto 10px", display: "block", objectFit: "contain" }} />}
          <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 20, color: "#fff" }}>{data?.empresa?.nome || "Lavandaria"}</div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>
            {data ? `Olá, ${data.cliente.nome}` : "Portal do cliente"}
          </div>
        </div>

        {error && (
          <div style={{ background: C.redSoft, color: C.red, borderRadius: 12, padding: 16, display: "flex", gap: 10, alignItems: "center", fontSize: 13.5 }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {!data && !error && <div style={{ textAlign: "center", color: C.inkSoft, padding: 30 }}>A carregar...</div>}

        {data && (
          <>
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, color: C.inkSoft, fontWeight: 600 }}>Total em dívida</div>
              <div style={{ fontFamily: monoFont, fontWeight: 700, fontSize: 26, color: data.totalDivida > 0 ? C.red : C.mint, marginTop: 4 }}>
                {formatMT(data.totalDivida)}
              </div>
              {data.totalDivida === 0 && <div style={{ fontSize: 12, color: C.mint, marginTop: 4 }}>Sem faturas pendentes. Obrigado!</div>}
            </div>

            {data.faturasPendentes.length > 0 && (
              <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18, marginBottom: 14 }}>
                <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 14.5, color: C.ink, marginBottom: 10 }}>Faturas por pagar</div>
                {data.faturasPendentes.map(f => (
                  <div key={f.numero} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${C.border}`, fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: C.ink }}>{f.numero}</div>
                      <div style={{ color: C.inkSoft, fontSize: 11.5 }}>{formatDate(f.data)}</div>
                    </div>
                    <div style={{ fontFamily: monoFont, fontWeight: 700, color: C.red }}>{formatMT(f.total)}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
              <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 14.5, color: C.ink, marginBottom: 10 }}>Histórico de lavagens</div>
              {data.historico.length === 0 && <div style={{ color: C.inkSoft, fontSize: 13 }}>Ainda não há pedidos.</div>}
              {data.historico.map(f => {
                const [soft, fg] = STATUS_COLORS[f.statusOperacional] || STATUS_COLORS["Pendente"];
                return (
                  <div key={f.numero} style={{ padding: "10px 0", borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: C.ink }}>{f.numero} · {formatDate(f.data)}</div>
                      <span style={{ background: soft, color: fg, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>{f.statusOperacional}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 3 }}>
                      {f.itens.map(it => `${it.qtd}x ${it.nome}`).join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", color: C.inkSoft, fontSize: 11, marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <Droplets size={12} /> {data.empresa.nome}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
