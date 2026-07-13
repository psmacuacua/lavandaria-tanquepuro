/**
 * Ficha de inspeção do artigo/roupa, preenchida pelo operador antes de lavar.
 * Tudo por seleção (checkboxes) exceto os poucos campos que exigem um valor específico
 * (localização da mancha, marca, tamanho, cor, itens encontrados nos bolsos).
 */

export const SOBRETAXA_MANCHA_DIFICIL = 50; // MT

export const DEFEITOS_OPCOES = [
  { key: "furosRasgos", label: "Furos, rasgos ou descosturas (gola, axilas, bolsos, barras)" },
  { key: "desgasteExcessivo", label: "Desgaste excessivo / tecido puído / pilling" },
  { key: "botoesFrouxosFaltando", label: "Botões frouxos ou em falta" },
  { key: "ziperTravadoQuebrado", label: "Zíper travado ou quebrado" },
  { key: "elasticoVencido", label: "Elástico vencido" },
  { key: "fechoDanificado", label: "Fecho danificado" },
];

export const DEFORMACOES_OPCOES = [
  { key: "laEncolhida", label: "Lã encolhida" },
  { key: "golaTorta", label: "Gola torta" },
  { key: "ternoDesalinhado", label: "Terno desalinhado" },
];

export function novaCondicaoVazia() {
  return {
    defeitos: {},
    deformacoes: {},
    temMancha: false,
    manchaLocal: "",
    oxidacaoMofo: false,
    desbotamento: false,
    manchaDificil: false, // café, sangue, tinta, vinho... => sobretaxa
    marca: "",
    tamanho: "",
    corExata: "",
    etiquetaCortadaIlegivel: false,
    bolsosVerificados: false,
    itensEncontrados: "",
    notas: "",
  };
}

/** Devolve true se a condição tiver pelo menos um item assinalado (para mostrar aviso no carrinho). */
export function condicaoTemAvisos(c) {
  if (!c) return false;
  const algumDefeito = Object.values(c.defeitos || {}).some(Boolean);
  const algumaDeformacao = Object.values(c.deformacoes || {}).some(Boolean);
  return algumDefeito || algumaDeformacao || c.temMancha || c.oxidacaoMofo || c.desbotamento || c.manchaDificil;
}

/** Sobretaxa (em MT) a aplicar por causa de tratamento especial de mancha difícil. */
export function calcularSobretaxa(c) {
  return c && c.manchaDificil ? SOBRETAXA_MANCHA_DIFICIL : 0;
}
