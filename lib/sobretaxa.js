const SOBRETAXA_MANCHA_DIFICIL = 50; // MT — mantido igual ao valor usado em components/inspection.js

function calcularSobretaxa(condicao) {
  return condicao && condicao.manchaDificil ? SOBRETAXA_MANCHA_DIFICIL : 0;
}

module.exports = { SOBRETAXA_MANCHA_DIFICIL, calcularSobretaxa };
