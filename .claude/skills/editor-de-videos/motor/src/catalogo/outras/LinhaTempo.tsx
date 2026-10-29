// linha_tempo: marcos em sequência numa linha vertical que se desenha; cada marco
// (quando + texto) entra no seu `em` e o mais recente fica em destaque. O bloco
// (linha + textos) fica centrado na área.
// props: { rotulo?: string, marcos: { quando: string, texto?: string, em?: number }[] }
// Cabe até 5 marcos em metade e 7 em tela.
import type React from "react";
import { clamp01, entra, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { ESPACO_ROTULO, tamanhoRotulo } from "./texto";

type Marco = { quando: string; texto?: string; em?: number };

const PONTO = 40;
const RECUO = 52; // da linha até o texto

export const LinhaTempo: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const rotulo = props.rotulo as string | undefined;
  const marcos = (props.marcos as Marco[] | undefined) ?? [];
  exigirDeclarados("linha_tempo", textos, [rotulo, ...marcos.flatMap((m) => [m.quando, m.texto])]);
  const n = Math.max(1, marcos.length);
  const ems = marcos.map((m, i) => m.em ?? 0.4 + 0.6 * i);

  const tamRotulo = rotulo ? tamanhoRotulo(estilo, rotulo, largura) : 0;
  const topo = rotulo ? tamRotulo * 1.6 : 0;
  const h = altura - topo;
  const comTexto = marcos.some((m) => m.texto);
  const linhaAlta = Math.min(190, h / n);
  const larguraTexto = largura - PONTO - RECUO;
  // Tamanhos únicos (a lista fica alinhada), limitados pela altura de cada linha.
  const limQuando = comTexto ? Math.min(76, linhaAlta * 0.46) : Math.min(92, linhaAlta * 0.66);
  const limTexto = Math.min(62, linhaAlta * 0.36);
  const tamQuando = Math.max(40, Math.min(...marcos.map((m) => caber(estilo, caixa(m.quando, estilo), larguraTexto, limQuando, 40))));
  const tamTexto = Math.max(40, Math.min(limTexto, ...marcos.filter((m) => m.texto).map((m) => caber(estilo, caixa(m.texto!, estilo), larguraTexto, limTexto, 40))));
  // Centra na horizontal o conjunto ponto + texto mais largo.
  const maisLargo = Math.max(...marcos.map((m) => Math.max(medir(estilo, caixa(m.quando, estilo), tamQuando), m.texto ? medir(estilo, caixa(m.texto, estilo), tamTexto) : 0)));
  const x0 = Math.max(0, (largura - (PONTO + RECUO + maisLargo)) / 2);
  const xLinha = x0 + PONTO / 2;
  const xTexto = x0 + PONTO + RECUO;
  const alturaItem = comTexto ? tamQuando * 1.1 + tamTexto * 1.15 : tamQuando * 1.15;
  const y0 = topo + (h - n * linhaAlta) / 2;
  const centroDe = (i: number) => y0 + linhaAlta * i + linhaAlta / 2;

  const visiveis = ems.filter((e) => t >= e).length;
  const ultimoEm = visiveis ? ems[visiveis - 1] : 0;
  const fimLinha = visiveis ? lerp(visiveis > 1 ? centroDe(visiveis - 2) : centroDe(0), centroDe(visiveis - 1), molaSemOvershoot(t - ultimoEm, 0.35)) : centroDe(0);
  const entrada = entra(t, 0, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: largura, textAlign: "center", fontSize: tamRotulo, color: estilo.cor_destaque, letterSpacing: ESPACO_ROTULO, whiteSpace: "nowrap", opacity: entrada, transform: `translateY(${lerp(18, 0, entrada)}px)` }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: xLinha - 4, top: centroDe(0), width: 8, height: centroDe(n - 1) - centroDe(0), borderRadius: 4, backgroundColor: alfa("#FFFFFF", 0.12), opacity: entrada }} />
      {visiveis ? <div style={{ position: "absolute", left: xLinha - 4, top: centroDe(0), width: 8, height: Math.max(0, fimLinha - centroDe(0)), borderRadius: 4, background: `linear-gradient(${alfa(estilo.cor_destaque, 0.5)}, ${estilo.cor_destaque})` }} /> : null}
      {marcos.map((m, i) => {
        if (t < ems[i]) return null;
        const atual = i === visiveis - 1;
        const pop = molaLeve(t - ems[i], 0.4, 0.06);
        const v = entra(t, ems[i] + 0.05, 0.35);
        const onda = clamp01((t - ems[i]) / 0.6);
        const cy = centroDe(i);
        return (
          <div key={i}>
            {atual && onda < 1 ? (
              <div style={{ position: "absolute", left: xLinha - lerp(20, 50, onda), top: cy - lerp(20, 50, onda), width: lerp(40, 100, onda), height: lerp(40, 100, onda), borderRadius: "50%", border: `4px solid ${estilo.cor_destaque}`, opacity: 1 - onda }} />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: xLinha - PONTO / 2,
                top: cy - PONTO / 2,
                width: PONTO,
                height: PONTO,
                boxSizing: "border-box",
                borderRadius: "50%",
                backgroundColor: atual ? estilo.cor_destaque : alfa(estilo.cor_destaque, 0.55),
                border: "6px solid #111111",
                boxShadow: atual ? `0 0 30px ${alfa(estilo.cor_destaque, 0.7)}` : "none",
                transform: `scale(${pop})`,
              }}
            />
            <div style={{ position: "absolute", left: xTexto, top: cy - alturaItem / 2, width: largura - xTexto, opacity: v * (atual ? 1 : 0.55), transform: `translateX(${lerp(24, 0, v)}px)` }}>
              <div style={{ fontSize: tamQuando, lineHeight: 1.1, color: estilo.cor_destaque, whiteSpace: "nowrap" }}>{caixa(m.quando, estilo)}</div>
              {m.texto ? <div style={{ fontSize: tamTexto, lineHeight: 1.15, color: estilo.cor_texto, whiteSpace: "nowrap" }}>{caixa(m.texto, estilo)}</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
