// O tocador, camada por camada, de trás para a frente:
//   pessoa (com zoom de ênfase) → cenas "atrás" e passada de trás das cenas de
//   "profundidade" → pessoa recortada → passada da frente da profundidade → foco →
//   painel (metade/tela) → destaques "sobre" e "interage" → título → legenda → sons.
import type React from "react";
import { AbsoluteFill, Audio, type CalculateMetadataFunction, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ARoll } from "./camadas/ARoll";
import { Legenda } from "./camadas/Legenda";
import { Painel } from "./camadas/Painel";
import { Titulo } from "./camadas/Titulo";
import { CATALOGO } from "./catalogo";
import { LIVRES } from "./cenas/livres";
import { useFontePronta } from "./motor/fontes";
import { ALTURA, CONTEUDO, estadoNo, LARGURA } from "./motor/layout";
import { molaSemOvershoot } from "./motor/molas";
import { alfa } from "./motor/util";
import type { Caixa, Cena, Timeline } from "./tipos";

/** Cenas que já são a própria fala escrita: a legenda some enquanto estão na tela. */
const SEM_LEGENDA = new Set(["titulo_cinetico", "citacao"]);
const Y_LEGENDA_BAIXA = 1385;

function componenteDe(cena: Cena) {
  const C = cena.tipo.startsWith("livre/") ? LIVRES[cena.tipo.slice(6)] : CATALOGO[cena.tipo];
  if (!C) throw new Error(`Cena ${cena.id}: tipo "${cena.tipo}" não existe no catálogo`);
  return C;
}

/** Entrada e saída de uma cena sobreposta (sem painel): 0 → 1 → 0. */
function presenca(frame: number, c: Cena, fps: number, entrada = 0.2, saida = 0.25) {
  const t = (frame - c.ini_f) / fps;
  const resta = (c.fim_f - frame) / fps;
  return Math.min(molaSemOvershoot(t, entrada), molaSemOvershoot(resta, saida));
}

function escalaEnfase(frame: number, tl: Timeline) {
  const e = (tl.enfases ?? []).find((x) => frame >= x.ini_f && frame < x.fim_f);
  if (!e) return { s: 1, cx: LARGURA / 2, cy: ALTURA / 2 };
  const p = Math.min(molaSemOvershoot((frame - e.ini_f) / tl.fps, 0.3), molaSemOvershoot((e.fim_f - frame) / tl.fps, 0.35));
  return { s: 1 + (e.escala - 1) * p, cx: e.cx, cy: e.cy };
}

const TELA_TODA: Caixa = { x: 0, y: 0, w: LARGURA, h: ALTURA };

const CenaNaCaixa: React.FC<{ c: Cena; caixa: Caixa; frame: number; tl: Timeline; opacidade: number; camada?: "atras" | "frente" }> = ({
  c,
  caixa,
  frame,
  tl,
  opacidade,
  camada,
}) => {
  const C = componenteDe(c);
  const t = (frame - c.ini_f) / tl.fps;
  const dur = (c.fim_f - c.ini_f) / tl.fps;
  return (
    <div style={{ position: "absolute", left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h, opacity: opacidade }}>
      <C t={t} dur={dur} largura={caixa.w} altura={caixa.h} estilo={tl.estilo} props={c.props} textos={c.textos} n={c.n} rosto={c.rosto} trilha={c.trilha} camada={camada} />
    </div>
  );
};

export const Reel: React.FC<Timeline> = (tl) => {
  const frame = useCurrentFrame();
  const pronto = useFontePronta(tl.estilo);
  const estado = estadoNo(frame, tl);
  const ativas = tl.cenas.filter((c) => frame >= c.ini_f && frame < c.fim_f);
  const painel = ativas.filter((c) => c.layout === "metade" || c.layout === "tela");
  const atras = ativas.filter((c) => c.layout === "atras");
  const sobre = ativas.filter((c) => c.layout === "sobre");
  const foco = ativas.filter((c) => c.layout === "foco");
  const interage = ativas.filter((c) => c.layout === "interage");
  const profundidade = ativas.filter((c) => c.layout === "profundidade");
  const z = estado.tipo === "cheio" ? escalaEnfase(frame, tl) : { s: 1, cx: 0, cy: 0 };
  const legendaBaixa = (tl.legenda_baixa ?? []).some((r) => frame >= r.ini_f && frame < r.fim_f);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: `scale(${z.s})`, transformOrigin: `${z.cx}px ${z.cy}px` }}>
        <ARoll src={tl.aroll} estado={estado} rostoY={tl.rosto_y} />
        {pronto
          ? atras.map((c) => <CenaNaCaixa key={c.id} c={c} caixa={c.caixa ?? { x: 0, y: 0, w: LARGURA, h: ALTURA }} frame={frame} tl={tl} opacidade={presenca(frame, c, tl.fps, 0.15, 0.3)} />)
          : null}
        {pronto
          ? profundidade.map((c) => <CenaNaCaixa key={`tras-${c.id}`} c={c} caixa={TELA_TODA} frame={frame} tl={tl} opacidade={presenca(frame, c, tl.fps, 0.15, 0.3)} camada="atras" />)
          : null}
        {tl.cenas
          .filter((c) => (c.layout === "atras" || c.layout === "profundidade") && c.frente)
          .map((c) => (
            <Sequence key={`frente-${c.id}`} from={c.ini_f} durationInFrames={c.fim_f - c.ini_f} layout="none">
              <OffthreadVideo transparent muted src={staticFile(c.frente!)} style={{ position: "absolute", left: 0, top: 0, width: LARGURA, height: ALTURA }} />
            </Sequence>
          ))}
        {pronto
          ? profundidade.map((c) => <CenaNaCaixa key={`frente-${c.id}`} c={c} caixa={TELA_TODA} frame={frame} tl={tl} opacidade={presenca(frame, c, tl.fps, 0.15, 0.3)} camada="frente" />)
          : null}
      </AbsoluteFill>

      {pronto
        ? foco.map((c) => {
            const p = presenca(frame, c, tl.fps, 0.3, 0.3);
            return (
              <AbsoluteFill key={c.id}>
                <AbsoluteFill style={{ backgroundColor: alfa(tl.estilo.cor_fundo, 0.78 * p), backdropFilter: `blur(${10 * p}px)` }} />
                <CenaNaCaixa c={c} caixa={c.caixa ?? CONTEUDO.tela} frame={frame} tl={tl} opacidade={p} />
              </AbsoluteFill>
            );
          })
        : null}

      {pronto ? (
        <Painel estado={estado} estilo={tl.estilo}>
          {painel.map((c) => {
            const zona = CONTEUDO[c.layout as "metade" | "tela"];
            const t = (frame - c.ini_f) / tl.fps;
            const dur = (c.fim_f - c.ini_f) / tl.fps;
            const saida = 1 - molaSemOvershoot(t - (dur - 0.25), 0.25);
            const C = componenteDe(c);
            return (
              <div key={c.id} style={{ position: "absolute", left: zona.x, top: zona.y, width: zona.w, height: zona.h, opacity: saida }}>
                <C t={t} dur={dur} largura={zona.w} altura={zona.h} estilo={tl.estilo} props={c.props} textos={c.textos} n={c.n} />
              </div>
            );
          })}
        </Painel>
      ) : null}

      {pronto
        ? sobre.map((c) => {
            const caixa = c.caixa ?? { x: 108, y: 300, w: 810, h: 240 };
            const p = presenca(frame, c, tl.fps);
            return (
              <div key={c.id}>
                {c.vidro ? (
                  <div
                    style={{
                      position: "absolute",
                      left: caixa.x - 22,
                      top: caixa.y - 22,
                      width: caixa.w + 44,
                      height: caixa.h + 44,
                      borderRadius: 30,
                      backgroundColor: alfa(tl.estilo.cor_fundo, 0.62),
                      backdropFilter: "blur(16px)",
                      border: `1.5px solid ${alfa("#FFFFFF", 0.14)}`,
                      boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
                      opacity: p,
                    }}
                  />
                ) : null}
                <CenaNaCaixa c={c} caixa={caixa} frame={frame} tl={tl} opacidade={p} />
              </div>
            );
          })
        : null}

      {pronto
        ? interage.map((c) => <CenaNaCaixa key={c.id} c={c} caixa={TELA_TODA} frame={frame} tl={tl} opacidade={presenca(frame, c, tl.fps, 0.12, 0.25)} />)
        : null}

      {pronto && tl.titulo ? <Titulo titulo={tl.titulo} frame={frame} fps={tl.fps} estilo={tl.estilo} /> : null}
      {pronto && !ativas.some((c) => SEM_LEGENDA.has(c.tipo)) ? (
        <Legenda paginas={tl.paginas} frame={frame} fps={tl.fps} estilo={tl.estilo} estado={estado} yForcado={legendaBaixa && estado.tipo === "cheio" ? Y_LEGENDA_BAIXA : undefined} />
      ) : null}

      {(tl.sons ?? []).map((s, i) => (
        <Sequence key={`som-${i}`} from={s.f} durationInFrames={Math.round(tl.fps * 1.2)} layout="none">
          <Audio src={staticFile(`sons/${s.nome}.wav`)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const calcularMetadados: CalculateMetadataFunction<Timeline> = ({ props }) => ({
  durationInFrames: Math.max(1, props.duracao_f),
  fps: props.fps,
  width: 1080,
  height: 1920,
});
