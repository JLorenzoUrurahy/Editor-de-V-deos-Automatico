// A pessoa: o vídeo da câmera já cortado. Em "metade" desce para a metade de baixo,
// com o rosto (rosto_y) no terço de cima da caixa; em "cheio" e "tela" ocupa tudo.
import type React from "react";
import { OffthreadVideo, staticFile } from "remotion";
import { ALTURA, COSTURA, LARGURA, type Estado } from "../motor/layout";
import { lerp } from "../motor/molas";

export const ARoll: React.FC<{ src: string; estado: Estado; rostoY: number }> = ({ src, estado, rostoY }) => {
  const m = estado.tipo === "metade" ? estado.p : 0;
  const caixaTopo = lerp(0, COSTURA, m);
  const caixaAltura = ALTURA - caixaTopo;
  // Topo do vídeo na metade: o rosto vai para 35% da caixa; o vídeo sempre cobre a caixa inteira.
  const alvo = Math.min(COSTURA, Math.max(0, COSTURA + 0.35 * (ALTURA - COSTURA) - rostoY * ALTURA));
  const videoTopo = lerp(0, alvo, m);
  return (
    <div style={{ position: "absolute", left: 0, top: caixaTopo, width: LARGURA, height: caixaAltura, overflow: "hidden", backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile(src)}
        style={{ position: "absolute", left: 0, top: videoTopo - caixaTopo, width: LARGURA, height: ALTURA }}
      />
      {/* sombra suave na costura, para o painel "pousar" sobre a pessoa */}
      {m > 0 ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: LARGURA, height: 90, opacity: m, background: "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0))" }} />
      ) : null}
    </div>
  );
};
