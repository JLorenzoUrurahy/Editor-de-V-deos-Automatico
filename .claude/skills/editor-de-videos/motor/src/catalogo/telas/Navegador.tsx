// navegador: janela de navegador com o print (ou a gravação) da página da pessoa.
// A janela entra inclinada e assenta; o print rola de cima para baixo entre
// em_inicio e em_fim (movimento do conteúdo, como quem desce a página) e para.
// Opcional: uma região em destaque (moldura na cor de destaque, o resto escurece).
// props: { imagem?: string, video?: string, endereco?: string, rotulo?: string, rolar?: boolean,
//          em_inicio?: number, em_fim?: number,
//          destaque?: { x: number, y: number, w: number, h: number } (frações da área visível),
//          em_destaque?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { ehVideo, Midia } from "../../motor/midia";
import { clamp01, entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { BarraJanela } from "./comum";

type Regiao = { x: number; y: number; w: number; h: number };

/** Vai e vem suave (começa e termina devagar). */
const suave = (p: number) => {
  const x = clamp01(p);
  return x * x * (3 - 2 * x);
};

export const Navegador: React.FC<PropsCena> = ({ t, dur, largura, altura, estilo, props, textos }) => {
  const imagem = (props.imagem ?? props.video) as string | undefined;
  const endereco = props.endereco as string | undefined;
  const rotulo = props.rotulo as string | undefined;
  const destaque = props.destaque as Regiao | undefined;
  const emDestaque = (props.em_destaque as number | undefined) ?? dur * 0.6;
  const rolar = props.rolar !== false && Boolean(imagem) && !ehVideo(imagem ?? "");
  const emInicio = (props.em_inicio as number | undefined) ?? 0.9;
  const emFim = (props.em_fim as number | undefined) ?? (destaque ? emDestaque - 0.2 : dur - 0.6);
  exigirDeclarados("navegador", textos, [endereco, rotulo]);

  const tamRot = rotulo ? caber(estilo, caixa(rotulo, estilo), largura, 54, 44) : 0;
  const topoJanela = rotulo ? tamRot * 1.25 + 22 : 0;
  const w = largura;
  const h = altura - topoJanela;
  const barra = 68;
  const tamEnd = endereco ? caber(estilo, endereco, w - 330, 42, 40) : 0;
  const vista = h - barra;

  const e = molaSemOvershoot(t, 0.7);
  const rolagem = rolar ? suave((t - emInicio) / Math.max(0.3, emFim - emInicio)) : 0;
  const realce = destaque && t >= emDestaque ? molaSemOvershoot(t - emDestaque, 0.4) : 0;
  const rot = entra(t, 0.2, 0.4);

  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1800, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: largura, textAlign: "center", fontSize: tamRot, color: estilo.cor_destaque, letterSpacing: 3, whiteSpace: "nowrap", opacity: rot, transform: `translateY(${lerp(14, 0, rot)}px)` }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: topoJanela,
          width: w,
          height: h,
          borderRadius: 26,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0E1016",
          border: `1.5px solid ${alfa("#FFFFFF", 0.16)}`,
          boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
          opacity: Math.min(1, e * 2.5),
          transformOrigin: "50% 100%",
          transform: `translateY(${lerp(90, 0, e)}px) rotateX(${lerp(22, 0, e)}deg) scale(${lerp(0.9, 1, e)})`,
        }}
      >
        <BarraJanela altura={barra}>
          <div style={{ flex: 1, marginLeft: 18, height: barra * 0.66, borderRadius: barra, backgroundColor: "#15171D", display: "flex", alignItems: "center", gap: 12, padding: "0 22px", overflow: "hidden" }}>
            <Icone nome="Lock" tamanho={28} cor={alfa("#FFFFFF", 0.55)} />
            {endereco ? <span style={{ fontSize: tamEnd, color: alfa("#FFFFFF", 0.88), whiteSpace: "nowrap" }}>{endereco}</span> : null}
          </div>
        </BarraJanela>
        <div style={{ position: "relative", width: w, height: vista, overflow: "hidden", backgroundColor: "#FFFFFF" }}>
          {imagem ? (
            <Midia src={imagem} largura={w} altura={vista} posicao={`50% ${(rolagem * 100).toFixed(3)}%`} />
          ) : (
            <div style={{ width: w, height: vista, background: `linear-gradient(160deg, #1B1D2A, #0E0F16)` }} />
          )}
          {destaque && realce > 0 ? (
            <div
              style={{
                position: "absolute",
                left: destaque.x * w,
                top: destaque.y * vista,
                width: destaque.w * w,
                height: destaque.h * vista,
                borderRadius: 18,
                border: `6px solid ${estilo.cor_destaque}`,
                boxShadow: `0 0 0 3000px rgba(0,0,0,${0.55 * realce}), 0 0 40px ${alfa(estilo.cor_destaque, 0.6)}`,
                opacity: realce,
                transform: `scale(${lerp(1.12, 1, realce)})`,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
