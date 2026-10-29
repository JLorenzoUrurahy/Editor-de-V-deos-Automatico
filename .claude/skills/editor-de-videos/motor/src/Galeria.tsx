// Galeria: uma cena do catálogo sozinha, no layout em que vai aparecer, para conferir
// o desenho quadro a quadro (scripts/galeria.py).
// - metade/tela: no painel; a metade de baixo fica cinza.
// - sobre/foco/atras: sobre uma foto de pessoa (fundo-galeria.jpg na pasta pública, se
//   existir), com a caixa da cena e o rosto marcados; em atras, a pessoa recortada
//   (frente-galeria.png) fica na frente.
import type React from "react";
import { AbsoluteFill, type CalculateMetadataFunction, Img, staticFile, useCurrentFrame } from "remotion";
import { Painel } from "./camadas/Painel";
import { CATALOGO } from "./catalogo";
import { useFontePronta } from "./motor/fontes";
import { COSTURA, CONTEUDO } from "./motor/layout";
import { alfa } from "./motor/util";
import type { Caixa, Estilo, LayoutCena, Trilha } from "./tipos";

export type PropsGaleria = {
  tipo: string;
  layout: LayoutCena;
  dur_s: number;
  props: Record<string, unknown>;
  textos: string[];
  estilo: Estilo;
  caixa?: Caixa;
  rosto?: Caixa;
  vidro?: boolean;
  n?: number;
  fundo?: boolean;
  /** "mao": foto com a mão levantada (para cenas que seguem a mão) */
  foto?: "rosto" | "mao";
  trilha?: Trilha;
  /** contorno tracejado da área da cena (padrão: ligado; desligue para imagens limpas) */
  guias?: boolean;
};

export const Galeria: React.FC<PropsGaleria> = ({ tipo, layout, dur_s, props, textos, estilo, caixa, rosto, vidro, n, fundo, foto, trilha, guias = true }) => {
  const frame = useCurrentFrame();
  const pronto = useFontePronta(estilo);
  const C = CATALOGO[tipo];
  if (!C) throw new Error(`Tipo "${tipo}" não está no catálogo`);
  const t = frame / 30;
  if (layout === "metade" || layout === "tela") {
    const z = CONTEUDO[layout];
    return (
      <AbsoluteFill style={{ backgroundColor: "#2A2A2E" }}>
        {layout === "metade" ? <div style={{ position: "absolute", left: 0, top: COSTURA, width: 1080, height: 1920 - COSTURA, background: "linear-gradient(#3A3A40, #26262A)" }} /> : null}
        {pronto ? (
          <Painel estado={{ tipo: layout, p: 1 }} estilo={estilo}>
            <div style={{ position: "absolute", left: z.x, top: z.y, width: z.w, height: z.h, outline: guias ? "1px dashed rgba(255,255,255,0.12)" : "none" }}>
              <C t={t} dur={dur_s} largura={z.w} altura={z.h} estilo={estilo} props={props} textos={textos} n={n} />
            </div>
          </Painel>
        ) : null}
      </AbsoluteFill>
    );
  }
  const sufixo = foto === "mao" ? "-mao" : "";
  if (layout === "interage" || layout === "profundidade") {
    const passada = (camada?: "atras" | "frente") => (
      <C t={t} dur={dur_s} largura={1080} altura={1920} estilo={estilo} props={props} textos={textos} n={n} rosto={rosto} trilha={trilha} camada={camada} />
    );
    return (
      <AbsoluteFill style={{ backgroundColor: "#3A3A40" }}>
        {fundo ? <Img src={staticFile(`fundo-galeria${sufixo}.jpg`)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} /> : null}
        {pronto && layout === "profundidade" ? <AbsoluteFill>{passada("atras")}</AbsoluteFill> : null}
        {layout === "profundidade" && fundo ? <Img src={staticFile(`frente-galeria${sufixo}.png`)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} /> : null}
        {pronto ? <AbsoluteFill>{passada(layout === "profundidade" ? "frente" : undefined)}</AbsoluteFill> : null}
      </AbsoluteFill>
    );
  }
  const cx = caixa ?? (layout === "foco" ? CONTEUDO.tela : { x: 108, y: 300, w: 810, h: 240 });
  const rostoRel = rosto ? { x: rosto.x - cx.x, y: rosto.y - cx.y, w: rosto.w, h: rosto.h } : undefined;
  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3A40" }}>
      {fundo ? <Img src={staticFile(`fundo-galeria${sufixo}.jpg`)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} /> : null}
      {layout === "foco" ? <AbsoluteFill style={{ backgroundColor: alfa(estilo.cor_fundo, 0.78), backdropFilter: "blur(10px)" }} /> : null}
      {pronto ? (
        <>
          {vidro ? (
            <div style={{ position: "absolute", left: cx.x - 22, top: cx.y - 22, width: cx.w + 44, height: cx.h + 44, borderRadius: 30, backgroundColor: alfa(estilo.cor_fundo, 0.62), backdropFilter: "blur(16px)", border: `1.5px solid ${alfa("#FFFFFF", 0.14)}` }} />
          ) : null}
          <div style={{ position: "absolute", left: cx.x, top: cx.y, width: cx.w, height: cx.h, outline: guias ? "1px dashed rgba(255,255,255,0.25)" : "none" }}>
            <C t={t} dur={dur_s} largura={cx.w} altura={cx.h} estilo={estilo} props={props} textos={textos} n={n} rosto={rostoRel} />
          </div>
        </>
      ) : null}
      {layout === "atras" && fundo ? <Img src={staticFile(`frente-galeria${sufixo}.png`)} style={{ position: "absolute", inset: 0, width: 1080, height: 1920 }} /> : null}
      {rosto && guias ? <div style={{ position: "absolute", left: rosto.x, top: rosto.y, width: rosto.w, height: rosto.h, outline: "2px dashed rgba(0,255,120,0.6)" }} /> : null}
    </AbsoluteFill>
  );
};

export const metadadosGaleria: CalculateMetadataFunction<PropsGaleria> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.round(props.dur_s * 30)),
  fps: 30,
  width: 1080,
  height: 1920,
});
