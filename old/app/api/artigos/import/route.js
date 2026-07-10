import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth";
import { parseWorkbookBuffer, extractRowsFromSheet, normalizeRow, dedupeAndClean } from "@/lib/excel";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  const categoriaOverride = formData.get("categoria");

  if (!file) {
    return NextResponse.json({ error: "Nenhum ficheiro enviado (campo 'file')." }, { status: 400 });
  }

  // Next.js (App Router) já lida bem com a conversão de File para Buffer
  const buffer = Buffer.from(await file.arrayBuffer());
  let wb;
  try {
    wb = parseWorkbookBuffer(buffer);
  } catch (e) {
    return NextResponse.json({ error: "Não foi possível ler o ficheiro. Confirma que é um .xlsx válido." }, { status: 400 });
  }

  let rawRows = [];
  if (categoriaOverride) {
    const sheetName = wb.SheetNames[0];
    rawRows = extractRowsFromSheet(wb, sheetName).map(normalizeRow).map(r => ({ ...r, categoria: categoriaOverride }));
  } else {
    for (const sheetName of wb.SheetNames) {
      const rows = extractRowsFromSheet(wb, sheetName).map(normalizeRow).map(r => ({ ...r, categoria: sheetName }));
      rawRows.push(...rows);
    }
  }

  const { rows: cleaned, vaziosRemovidos, duplicadosRemovidos } = dedupeAndClean(rawRows);

  const categorias = await prisma.categoria.findMany();
  const catMap = {};
  categorias.forEach(c => { catMap[c.nome.toLowerCase()] = c.id; });

  const categoriasIgnoradas = new Set();
  const candidatos = [];
  for (const r of cleaned) {
    const catId = catMap[r.categoria.toLowerCase()];
    if (!catId) { categoriasIgnoradas.add(r.categoria); continue; }
    candidatos.push({ 
      categoriaId: catId, 
      nome: r.nome, 
      precoBase: r.precoBase, 
      precoDesconto: r.precoDesconto, 
      disponivel: r.disponivel 
    });
  }

  const existentes = await prisma.artigo.findMany({ select: { categoriaId: true, nome: true } });
  const existentesKeys = new Set(existentes.map(e => `${e.categoriaId}::${e.nome.toLowerCase()}`));
  const paraInserir = candidatos.filter(c => !existentesKeys.has(`${c.categoriaId}::${c.nome.toLowerCase()}`));

  let inseridos = 0;
  const CHUNK = 200;
  for (let i = 0; i < paraInserir.length; i += CHUNK) {
    const res = await prisma.artigo.createMany({ data: paraInserir.slice(i, i + CHUNK) });
    inseridos += res.count;
  }

  return NextResponse.json({
    linhasLidas: rawRows.length,
    vaziosRemovidos,
    duplicadosNoFicheiro: duplicadosRemovidos,
    jaExistiamNaBase: candidatos.length - paraInserir.length,
    categoriasIgnoradas: Array.from(categoriasIgnoradas),
    inseridos,
  });
}