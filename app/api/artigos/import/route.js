const { NextResponse } = require("next/server");
const { prisma } = require("@/lib/prisma");
const { getSessionFromRequest } = require("@/lib/auth");
const { parseWorkbookBuffer, extractRowsFromSheet, normalizeRow, dedupeAndClean } = require("@/lib/excel");

const runtime = "nodejs";

/**
 * Espera um ficheiro .xlsx em multipart/form-data no campo "file".
 * - Se o campo "categoria" for enviado, todas as linhas da 1ª folha ficam nessa categoria
 *   (útil para ficheiros como Engomagem.xlsx, Lavagem_Normal.xlsx, Lavagem_Urgente.xlsx).
 * - Caso contrário, cada folha do workbook é tratada como uma categoria (nome da folha = categoria),
 *   permitindo importar um único ficheiro com várias categorias.
 */
async function POST(req) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");
  const categoriaOverride = formData.get("categoria");

  if (!file) {
    return NextResponse.json({ error: "Nenhum ficheiro enviado (campo 'file')." }, { status: 400 });
  }

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
    candidatos.push({ categoriaId: catId, nome: r.nome, precoBase: r.precoBase, precoDesconto: r.precoDesconto, disponivel: r.disponivel });
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

module.exports = { POST, runtime };
