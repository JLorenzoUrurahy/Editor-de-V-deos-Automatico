// Título do gancho: de 1 a 3 linhas em tarjas na cor de destaque, no alto da zona
// segura (acima da cabeça), já no quadro 0 (vira a capa). Sai com fade curto.
import type React from "react";
import { CENTRO_X, ZONA } from "../motor/layout";
import { contraste } from "../motor/util";
import type { Estilo, Titulo as TipoTitulo } from "../tipos";

export const Titulo: React.FC<{ titulo: TipoTitulo; frame: number; fps: number; estilo: Estilo }> = ({ titulo, frame, fps, estilo }) => {
  if (frame >= titulo.fim_f) return null;
  const restante = (titulo.fim_f - frame) / fps;
  const opacidade = Math.min(1, restante / 0.25);
  return (
    <div style={{ position: "absolute", left: CENTRO_X - ZONA.w / 2, top: ZONA.y + 12, width: ZONA.w, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: opacidade }}>
      {titulo.linhas.map((l, i) => (
        <div
          key={i}
          style={{
            backgroundColor: estilo.cor_destaque,
            color: contraste(estilo.cor_destaque),
            fontFamily: estilo.fonte,
            fontWeight: 800,
            fontSize: titulo.tamanho,
            lineHeight: 1.12,
            padding: "6px 22px",
            borderRadius: 10,
            whiteSpace: "nowrap",
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
};
