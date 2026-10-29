// Pino com onda de chegada e rótulo em cartão, usado pelo mapa e pelo globo.
// O pino cai e a onda abre uma vez, no `em`; depois tudo fica parado.
import type React from "react";
import { clamp01, entra, lerp, molaLeve } from "../../motor/molas";
import { alfa, caixa, medir } from "../../motor/util";
import type { Estilo } from "../../tipos";

export const PinoSvg: React.FC<{ x: number; y: number; t: number; em: number; estilo: Estilo }> = ({ x, y, t, em, estilo }) => {
  if (t < em) return null;
  const cai = molaLeve(t - em, 0.45, 0.06);
  const onda = clamp01((t - em) / 0.7);
  return (
    <g transform={`translate(${x}, ${y - lerp(46, 0, cai)})`}>
      {onda < 1 ? <circle r={lerp(16, 60, onda)} fill="none" stroke={estilo.cor_destaque} strokeWidth={4} opacity={1 - onda} /> : null}
      <circle r={19} fill={estilo.cor_destaque} stroke="#111111" strokeWidth={5} />
      <circle r={6} fill="#111111" />
    </g>
  );
};

/** Rótulo do pino: acima do ponto (ou abaixo, sem espaço em cima), sem sair da área. */
export const RotuloPino: React.FC<{ x: number; y: number; t: number; em: number; texto: string; tamanho: number; largura: number; estilo: Estilo }> = ({
  x,
  y,
  t,
  em,
  texto,
  tamanho,
  largura,
  estilo,
}) => {
  if (t < em) return null;
  const tx = caixa(texto, estilo);
  const lw = medir(estilo, tx, tamanho) + 40;
  const lh = tamanho * 1.45;
  const acima = y - 34 - lh > 4;
  const left = Math.min(largura - lw - 6, Math.max(6, x - lw / 2));
  const top = acima ? y - 34 - lh : y + 34;
  const v = entra(t, em, 0.3);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        height: lh,
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        borderRadius: 16,
        backgroundColor: alfa(estilo.cor_fundo, 0.9),
        border: `1.5px solid ${alfa("#FFFFFF", 0.22)}`,
        boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
        color: estilo.cor_texto,
        fontSize: tamanho,
        whiteSpace: "nowrap",
        opacity: v,
        transform: `translateY(${lerp(acima ? 12 : -12, 0, v)}px)`,
      }}
    >
      {tx}
    </div>
  );
};
