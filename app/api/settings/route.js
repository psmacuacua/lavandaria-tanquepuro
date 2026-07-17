const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { getEmpresaConfig } = require("@/lib/empresaConfig");

const runtime = "nodejs";

function serialize(c) {
  return {
    nome: c.nome,
    logoUrl: c.logoUrl || null,
    nuit: c.nuit || "",
    email: c.email || "",
    contacto: c.contacto || "",
    endereco: c.endereco || "",
    website: c.website || "",
    contaBancaria: c.contaBancaria || "",
    ivaAtivo: c.ivaAtivo,
    ivaPercentagem: Number(c.ivaPercentagem),
    sobretaxaManchaDificil: Number(c.sobretaxaManchaDificil),
    mostrarNuit: c.mostrarNuit,
    mostrarEndereco: c.mostrarEndereco,
    mostrarEmail: c.mostrarEmail,
    mostrarContacto: c.mostrarContacto,
    mostrarWebsite: c.mostrarWebsite,
    mostrarContaBancaria: c.mostrarContaBancaria,
    mensagemPronto: c.mensagemPronto,
    mensagemPortal: c.mensagemPortal,
    mensagemPromocional: c.mensagemPromocional,
  };
}

/** Qualquer utilizador autenticado pode ler (precisa para gerar faturas/recibos). */
async function GET(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const config = await getEmpresaConfig();
  return NextResponse.json({ config: serialize(config) });
}

/** Só o Admin pode atualizar. Aceita JSON normal ou multipart/form-data (quando inclui ficheiro de logótipo). */
async function PATCH(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (session.role !== "Admin") return NextResponse.json({ error: "Apenas administradores." }, { status: 403 });

  const contentType = req.headers.get("content-type") || "";
  let body = {};
  let logoDataUrl = undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    for (const [key, value] of formData.entries()) {
      if (key === "logo" && value && typeof value !== "string") {
        const buffer = Buffer.from(await value.arrayBuffer());
        if (buffer.length > 0) {
          logoDataUrl = `data:${value.type};base64,${buffer.toString("base64")}`;
        }
      } else if (key !== "logo") {
        body[key] = value;
      }
    }
  } else {
    body = await req.json();
  }

  const data = {};
  const strFields = ["nome", "nuit", "email", "contacto", "endereco", "website", "contaBancaria", "mensagemPronto", "mensagemPortal", "mensagemPromocional"];
  for (const f of strFields) if (body[f] !== undefined) data[f] = String(body[f]).trim();

  const boolFields = ["ivaAtivo", "mostrarNuit", "mostrarEndereco", "mostrarEmail", "mostrarContacto", "mostrarWebsite", "mostrarContaBancaria"];
  for (const f of boolFields) if (body[f] !== undefined) data[f] = body[f] === true || body[f] === "true";

  if (body.ivaPercentagem !== undefined && body.ivaPercentagem !== "") {
    const v = Number(body.ivaPercentagem);
    if (!isFinite(v) || v < 0 || v > 100) {
      return NextResponse.json({ error: "Taxa de IVA inválida (tem de estar entre 0 e 100)." }, { status: 400 });
    }
    data.ivaPercentagem = v;
  }

  if (body.sobretaxaManchaDificil !== undefined && body.sobretaxaManchaDificil !== "") {
    const v = Number(body.sobretaxaManchaDificil);
    if (!isFinite(v) || v < 0) {
      return NextResponse.json({ error: "Valor de sobretaxa inválido." }, { status: 400 });
    }
    data.sobretaxaManchaDificil = v;
  }

  if (logoDataUrl !== undefined) data.logoUrl = logoDataUrl;
  if (body.removerLogo === "true" || body.removerLogo === true) data.logoUrl = null;

  await getEmpresaConfig(); // garante que a linha existe antes do update
  const updated = await prisma.empresaConfig.update({ where: { id: 1 }, data });
  return NextResponse.json({ config: serialize(updated) });
}

module.exports = { GET, PATCH, runtime };
