// Legenda "palavra em destaque": página de 1 a 3 palavras, uma linha, a palavra
// sendo dita na cor de destaque. Encolhe até caber na zona segura; nunca quebra linha.
// Some durante a troca de layout e volta na posição nova.
import type React from "react";
import { CENTRO_X, Y_LEGENDA, ZONA, type Estado } from "../motor/layout";
import { molaSemOvershoot } from "../motor/molas";
import { caixa, medir } from "../motor/util";
import type { Estilo, Pagina } from "../tipos";

const TAMANHO = 92;
const CONTORNO = 6;

export const Legenda: React.FC<{ paginas: Pagina[]; frame: number; fps: number; estilo: Estilo; estado: Estado; yForcado?: number }> = ({ paginas, frame, fps, estilo, estado, yForcado }) => {
  const pagina = paginas.find((p) => p.ini_f <= frame && frame < p.fim_f);
  if (!pagina || pagina.palavras.length === 0) return null;
  const emTroca = estado.tipo === "metade" && estado.p > 0 && estado.p < 1;
  const opacidade = emTroca ? Math.abs(estado.p - 0.5) * 2 : 1;
  const y = yForcado ?? (estado.tipo === "metade" && estado.p >= 0.5 ? Y_LEGENDA.metade : Y_LEGENDA[estado.tipo === "tela" ? "tela" : "cheio"]);
  const textos = pagina.palavras.map((w) => caixa(w.texto, estilo));
  const largura = medir(estilo, textos.join(" "), TAMANHO) + 4 * CONTORNO;
  const tamanho = largura > ZONA.w ? Math.floor((TAMANHO * ZONA.w) / largura) : TAMANHO;
  const pop = 0.92 + 0.08 * molaSemOvershoot((frame - pagina.ini_f) / fps, 0.12);
  const ativa = pagina.palavras.findIndex((w, i) => w.ini_f <= frame && (i === pagina.palavras.length - 1 || frame < pagina.palavras[i + 1].ini_f));
  return (
    <div
      style={{
        position: "absolute",
        left: CENTRO_X - ZONA.w / 2,
        top: y - tamanho,
        width: ZONA.w,
        height: tamanho * 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: opacidade,
        filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.55))",
      }}
    >
      <div style={{ display: "flex", gap: tamanho * 0.26, whiteSpace: "nowrap", transform: `scale(${pop})`, fontFamily: estilo.fonte, fontWeight: 800, fontSize: tamanho, lineHeight: 1.1 }}>
        {textos.map((t, i) => (
          <span
            key={`${pagina.ini_f}-${i}`}
            style={{
              color: i === ativa ? estilo.cor_destaque : estilo.cor_texto,
              WebkitTextStroke: `${2 * CONTORNO}px ${estilo.cor_contorno}`,
              paintOrder: "stroke fill",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};
