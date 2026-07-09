// Mapeia entre as chaves do enum no Prisma (sem acentos/espaços) e o texto mostrado na interface.

const PAYMENT_METHOD_TO_ENUM = {
  "Dinheiro": "Dinheiro",
  "M-Pesa": "M_Pesa",
  "e-Mola": "e_Mola",
  "mKesh": "mKesh",
  "Cartão": "Cartao",
  "Transferência Bancária": "Transferencia_Bancaria",
};
const ENUM_TO_PAYMENT_METHOD = Object.fromEntries(Object.entries(PAYMENT_METHOD_TO_ENUM).map(([k, v]) => [v, k]));

const STATUS_OP_TO_ENUM = {
  "Pendente": "Pendente",
  "Em Processo": "Em_Processo",
  "Pronto para Entrega": "Pronto_para_Entrega",
  "Entregue": "Entregue",
  "Devolvido": "Devolvido",
};
const ENUM_TO_STATUS_OP = Object.fromEntries(Object.entries(STATUS_OP_TO_ENUM).map(([k, v]) => [v, k]));

module.exports = {
  PAYMENT_METHOD_TO_ENUM, ENUM_TO_PAYMENT_METHOD,
  STATUS_OP_TO_ENUM, ENUM_TO_STATUS_OP,
};
