const XLSX = require("xlsx");

/** Lê um buffer (ficheiro .xlsx enviado) e devolve o workbook do SheetJS. */
function parseWorkbookBuffer(buffer) {
  return XLSX.read(buffer, { type: "buffer" });
}

function extractRowsFromSheet(wb, sheetName) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

function findValue(row, candidateKeys) {
  const rowKeys = Object.keys(row);
  for (const candidate of candidateKeys) {
    const found = rowKeys.find(k => k.toLowerCase().trim() === candidate);
    if (found !== undefined) return row[found];
  }
  return undefined;
}

function parseBool(value) {
  if (value === undefined || value === null || value === "") return true; // omisso => assume disponível
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const s = String(value).trim().toLowerCase();
  return !["não", "nao", "n", "false", "0", "indisponivel", "indisponível"].includes(s);
}

/** Normaliza uma linha crua da folha de cálculo para {nome, precoBase, precoDesconto, disponivel}. */
function normalizeRow(row) {
  const nome = findValue(row, ["nome", "artigo", "serviço", "servico", "name", "item"]);
  const precoBase = findValue(row, ["preco_base", "preço base", "preco base", "preçobase", "base", "preço", "preco"]);
  const precoDesconto = findValue(row, ["desconto", "preco_desconto", "preço desconto", "preco desconto", "preço com desconto"]);
  const disponivelRaw = findValue(row, ["disponivel", "disponível"]);
  return {
    nome: nome === undefined || nome === null ? "" : String(nome).trim(),
    precoBase: Number(precoBase),
    precoDesconto: precoDesconto === undefined || precoDesconto === null || precoDesconto === "" ? null : Number(precoDesconto),
    disponivel: parseBool(disponivelRaw),
  };
}

/**
 * Remove linhas vazias/inválidas e duplicados (mesma categoria + nome, sem distinguir maiúsculas).
 * Mantém a última ocorrência de cada duplicado (assume-se mais recente/corrigida).
 */
function dedupeAndClean(rows) {
  const map = new Map();
  let vaziosRemovidos = 0;
  let duplicadosRemovidos = 0;

  for (const r of rows) {
    const nome = (r.nome || "").trim();
    const categoria = (r.categoria || "").trim();
    const precoBaseNum = Number(r.precoBase);

    if (!nome || !categoria || !isFinite(precoBaseNum) || precoBaseNum <= 0) {
      vaziosRemovidos++;
      continue;
    }

    const precoDescontoNum = r.precoDesconto !== null && r.precoDesconto !== undefined && isFinite(Number(r.precoDesconto)) && Number(r.precoDesconto) > 0
      ? Number(r.precoDesconto)
      : precoBaseNum;

    const key = categoria.toLowerCase() + "::" + nome.toLowerCase();
    if (map.has(key)) duplicadosRemovidos++;
    map.set(key, {
      nome, categoria,
      precoBase: precoBaseNum,
      precoDesconto: precoDescontoNum,
      disponivel: r.disponivel !== false,
    });
  }

  return { rows: Array.from(map.values()), vaziosRemovidos, duplicadosRemovidos };
}

/** Constrói um workbook .xlsx (um sheet por categoria) a partir dos artigos guardados na base de dados. */
function buildArticlesWorkbook(articles) {
  const wb = XLSX.utils.book_new();
  const byCategoria = {};
  for (const a of articles) {
    if (!byCategoria[a.categoria]) byCategoria[a.categoria] = [];
    byCategoria[a.categoria].push({
      Nome: a.nome,
      preco_base: a.precoBase,
      Desconto: a.precoDesconto,
      disponivel: a.disponivel,
    });
  }
  for (const [categoria, rows] of Object.entries(byCategoria)) {
    const sheet = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, sheet, categoria.substring(0, 31));
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

module.exports = { parseWorkbookBuffer, extractRowsFromSheet, normalizeRow, dedupeAndClean, buildArticlesWorkbook };
