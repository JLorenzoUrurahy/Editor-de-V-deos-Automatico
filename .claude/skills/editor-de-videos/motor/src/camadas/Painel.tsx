// Fundo das cenas. Em "metade" desce do alto até a costura; em "tela" cobre tudo.
// Gradiente da marca, grade sutil e um brilho na cor de destaque. Sem movimento contínuo.
import type React from "react";
import { ALTURA, COSTURA, LARGURA, type Estado } from "../motor/layout";
import { lerp } from "../motor/molas";
import { alfa } from "../motor/util";
import type { Estilo } from "../tipos";

export const Painel: React.FC<{ estado: Estado; estilo: Estilo; children: React.ReactNode }> = ({ estado, estilo, children }) => {
  if (estado.tipo === "cheio" || estado.p <= 0) return null;
  const metade = estado.tipo === "metade";
  const altura = metade ? COSTURA : ALTURA;
  const topo = metade ? lerp(-COSTURA, 0, estado.p) : 0;
  const escala = metade ? 1 : lerp(1.04, 1, estado.p);
  const opacidade = metade ? 1 : estado.p;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: topo,
        width: LARGURA,
        height: altura,
        overflow: "hidden",
        opacity: opacidade,
        transform: `scale(${escala})`,
        background: `linear-gradient(180deg, ${estilo.cor_fundo2} 0%, ${estilo.cor_fundo} 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${alfa("#FFFFFF", 0.035)} 1px, transparent 1px), linear-gradient(90deg, ${alfa("#FFFFFF", 0.035)} 1px, transparent 1px)`,
          backgroundSize: "54px 54px",
        }}
      />
      {/* brilho suave atrás do conteúdo (centro da área de cena), não no alto */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: (metade ? 590 : 740) - altura * 0.45,
          width: LARGURA,
          height: altura * 0.9,
          background: `radial-gradient(closest-side, ${alfa(estilo.cor_destaque, 0.09)}, transparent)`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)" }} />
      {children}
      {metade ? <div style={{ position: "absolute", left: 0, bottom: 0, width: LARGURA, height: 4, backgroundColor: estilo.cor_destaque }} /> : null}
    </div>
  );
};
