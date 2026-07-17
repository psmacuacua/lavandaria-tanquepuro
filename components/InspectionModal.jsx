"use client";
import React, { useState } from "react";
import { X, AlertTriangle, ClipboardCheck } from "lucide-react";
import { C, displayFont, bodyFont, monoFont, Input, Label, Btn } from "@/components/ui";
import { DEFEITOS_OPCOES, DEFORMACOES_OPCOES } from "@/components/inspection";

function Check({ checked, onChange, label }) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: C.ink, fontFamily: bodyFont, cursor: "pointer", padding: "5px 0" }}>
      <input type="checkbox" checked={!!checked} onChange={onChange} style={{ marginTop: 2 }} />
      <span>{label}</span>
    </label>
  );
}

function SectionTitle({ n, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, marginBottom: 6 }}>
      <div style={{
        width: 20, height: 20, borderRadius: 999, background: C.cobaltSoft, color: C.cobalt,
        fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>{n}</div>
      <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 13.5, color: C.ink }}>{children}</div>
    </div>
  );
}

export default function InspectionModal({ itemNome, condicao, onSave, onClose, sobretaxaValor = 50 }) {
  const [c, setC] = useState(condicao);

  function setField(key, value) { setC(prev => ({ ...prev, [key]: value })); }
  function setGroup(group, key, value) { setC(prev => ({ ...prev, [group]: { ...prev[group], [key]: value } })); }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,28,50,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: 16, position: "relative", boxShadow: "0 30px 70px rgba(10,20,50,0.4)" }}>
        <div style={{ position: "sticky", top: 0, background: "#fff", padding: "18px 22px 12px", borderBottom: `1px solid ${C.border}`, zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ClipboardCheck size={18} color={C.cobalt} />
            <div style={{ fontFamily: displayFont, fontWeight: 700, fontSize: 16, color: C.ink }}>Ficha de inspeção</div>
          </div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 3 }}>{itemNome}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, border: "none", background: C.bg, borderRadius: 8, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={15} color={C.inkSoft} /></button>
        </div>

        <div style={{ padding: "6px 22px 22px" }}>
          <SectionTitle n={1}>Defeitos e danos pré-existentes</SectionTitle>
          {DEFEITOS_OPCOES.map(o => (
            <Check key={o.key} label={o.label} checked={c.defeitos?.[o.key]} onChange={e => setGroup("defeitos", o.key, e.target.checked)} />
          ))}

          <SectionTitle n={2}>Manchas e sujidades críticas</SectionTitle>
          <Check label="Tem mancha visível" checked={c.temMancha} onChange={e => setField("temMancha", e.target.checked)} />
          {c.temMancha && (
            <div style={{ marginLeft: 28, marginBottom: 6 }}>
              <Input placeholder='Localização (ex: "axila direita", "barra da calça")' value={c.manchaLocal} onChange={e => setField("manchaLocal", e.target.value)} style={{ fontSize: 12.5, padding: "6px 10px" }} />
            </div>
          )}
          <Check label="Sinais de oxidação ou mofo (manchas antigas / de guardado)" checked={c.oxidacaoMofo} onChange={e => setField("oxidacaoMofo", e.target.checked)} />
          <Check label="Desbotamento (sol, desodorante ou químicos)" checked={c.desbotamento} onChange={e => setField("desbotamento", e.target.checked)} />
          <div style={{ background: C.amberSoft, borderRadius: 10, padding: "10px 12px", marginTop: 6 }}>
            <Check label={`Mancha difícil — café, sangue, tinta de caneta, vinho, etc. (requer tratamento especial, +${sobretaxaValor} MT)`} checked={c.manchaDificil} onChange={e => setField("manchaDificil", e.target.checked)} />
          </div>

          <SectionTitle n={3}>Características originais da peça</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><Label>Marca</Label><Input value={c.marca} onChange={e => setField("marca", e.target.value)} /></div>
            <div><Label>Tamanho</Label><Input value={c.tamanho} onChange={e => setField("tamanho", e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 6 }}>
            <Label>Cor exata</Label>
            <Input placeholder="ex: branco encardido, azul-marinho" value={c.corExata} onChange={e => setField("corExata", e.target.value)} />
          </div>
          <Check label="Etiqueta de lavagem cortada ou ilegível" checked={c.etiquetaCortadaIlegivel} onChange={e => setField("etiquetaCortadaIlegivel", e.target.checked)} />

          <SectionTitle n={4}>Itens esquecidos (bolsos)</SectionTitle>
          <Check label="Bolsos verificados e esvaziados na frente do cliente" checked={c.bolsosVerificados} onChange={e => setField("bolsosVerificados", e.target.checked)} />
          <div style={{ marginTop: 6 }}>
            <Label>Itens encontrados (opcional)</Label>
            <Input placeholder="ex: dinheiro, fones de ouvido, objeto pontiagudo" value={c.itensEncontrados} onChange={e => setField("itensEncontrados", e.target.value)} />
          </div>

          <SectionTitle n={5}>Deformações</SectionTitle>
          {DEFORMACOES_OPCOES.map(o => (
            <Check key={o.key} label={o.label} checked={c.deformacoes?.[o.key]} onChange={e => setGroup("deformacoes", o.key, e.target.checked)} />
          ))}

          <div style={{ marginTop: 14 }}>
            <Label>Notas adicionais (opcional)</Label>
            <textarea value={c.notas} onChange={e => setField("notas", e.target.value)} rows={2}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${C.border}`, fontFamily: bodyFont, fontSize: 13, resize: "vertical" }} />
          </div>

          {c.manchaDificil && (
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, background: C.redSoft, color: C.red, padding: "9px 12px", borderRadius: 10, fontSize: 12.5, fontWeight: 600 }}>
              <AlertTriangle size={15} /> Sobretaxa de tratamento especial: +{sobretaxaValor} MT será somada a este artigo.
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <Btn onClick={() => onSave(c)}>Guardar inspeção</Btn>
            <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
