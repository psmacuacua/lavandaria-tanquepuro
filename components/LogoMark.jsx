"use client";
import React from "react";

/**
 * Símbolo da marca Tanque Puro: círculo com três bolhas no topo e uma onda na base,
 * recriado em SVG (o ficheiro enviado pelo utilizador chegou corrompido/preto).
 * `color` controla o traço/bolhas; `waveColor` controla o preenchimento da onda.
 * Por omissão usa branco monocromático para se integrar nos badges já existentes.
 */
export default function LogoMark({ size = 24, color = "currentColor", waveColor, strokeWidth = 7 }) {
  const wave = waveColor || color;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="tp-circle-clip">
          <circle cx="50" cy="50" r="40" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="40" stroke={color} strokeWidth={strokeWidth} fill="none" />

      <g clipPath="url(#tp-circle-clip)">
        <path
          d="M4 62 C 20 50, 34 50, 50 60 C 66 70, 80 50, 96 58 L 96 100 L 4 100 Z"
          fill={wave}
          opacity="0.95"
        />
      </g>

      <circle cx="38" cy="30" r="5.5" fill={color} />
      <circle cx="51" cy="23" r="6.5" fill={color} />
      <circle cx="63" cy="31" r="4.5" fill={color} />
    </svg>
  );
}
