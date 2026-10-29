// funil: etapas empilhadas que afinam de cima para baixo, cada uma no seu `em`;
// a última (o resultado) fica na cor de destaque. Com valores, o funil vai para a
// esquerda e os valores ficam numa coluna à direita, alinhados a cada etapa.
// props: { rotulo?: string, etapas: { texto: string, valor?: string, em?: number }[] }
// De 3 a 5 etapas.
import type React from "react";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { ESPACO_ROTULO, tamanhoRotulo } from "./texto";

type Etapa = { texto: string; valor?: string; em?: number };

export const Funil: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const rotulo = props.rotulo as string | undefined;
  const etapas = (props.etapas as Etapa[] | undefined) ?? [];
  exigirDeclarados("funil", textos, [rotulo, ...etapas.flatMap((e) => [e.texto, e.valor])]);
  const n = Math.max(1, etapas.length);
  const ems = etapas.map((e, i) => e.em ?? 0.3 + 0.5 * i);

  const tamRotulo = rotulo ? tamanhoRotulo(estilo, rotulo, largura) : 0;
  const topo = rotulo ? tamRotulo * 1.6 : 0;
  const h = altura - topo;
  const gap = 12;
  const alturaCamada = Math.min(170, (h - gap * (n - 1)) / n);
  const bloco = n * alturaCamada + (n - 1) * gap;
  const y0 = topo + (h - bloco) / 2;
  const comValor = etapas.some((e) => e.valor);
  const larguraColuna = comValor ? largura * 0.3 : 0;
  const larguraFunil = largura - larguraColuna - (comValor ? 24 : 0);
  const cxFunil = larguraFunil / 2;
  const larguraEm = (k: number) => lerp(larguraFunil, larguraFunil * 0.42, k / n);
  const limTexto = Math.min(64, alturaCamada * 0.46);
  // Cada etapa usa o maior tamanho que cabe nela (as de baixo são mais estreitas).
  const tamTexto = etapas.map((e, i) => caber(estilo, caixa(e.texto, estilo), larguraEm(i + 1) - 44, limTexto, 40));
  const tamValor = Math.max(40, Math.min(64, alturaCamada * 0.48, ...etapas.filter((e) => e.valor).map((e) => caber(estilo, caixa(e.valor!, estilo), larguraColuna, 64, 40))));
  const entrada = entra(t, 0, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: largura, textAlign: "center", fontSize: tamRotulo, color: estilo.cor_destaque, letterSpacing: ESPACO_ROTULO, whiteSpace: "nowrap", opacity: entrada, transform: `translateY(${lerp(18, 0, entrada)}px)` }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="funil-final" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={estilo.cor_destaque} />
            <stop offset="100%" stopColor={alfa(estilo.cor_destaque, 0.72)} />
          </linearGradient>
        </defs>
        {etapas.map((_, i) => {
          if (t < ems[i]) return null;
          const a = molaSemOvershoot(t - ems[i], 0.45);
          const y = y0 + i * (alturaCamada + gap) - lerp(30, 0, a);
          const wt = larguraEm(i);
          const wb = larguraEm(i + 1);
          const ultima = i === n - 1;
          const pts = [[cxFunil - wt / 2, y], [cxFunil + wt / 2, y], [cxFunil + wb / 2, y + alturaCamada], [cxFunil - wb / 2, y + alturaCamada]];
          return (
            <polygon
              key={i}
              points={pts.map((p) => p.join(",")).join(" ")}
              fill={ultima ? "url(#funil-final)" : alfa("#FFFFFF", 0.1 + 0.05 * i)}
              stroke={alfa("#FFFFFF", ultima ? 0.5 : 0.22)}
              strokeWidth={1.5}
              strokeLinejoin="round"
              opacity={a}
              style={ultima ? { filter: `drop-shadow(0 0 26px ${alfa(estilo.cor_destaque, 0.5)})` } : undefined}
            />
          );
        })}
      </svg>
      {etapas.map((e, i) => {
        if (t < ems[i]) return null;
        const a = entra(t, ems[i] + 0.08, 0.35);
        const y = y0 + i * (alturaCamada + gap) - lerp(30, 0, molaSemOvershoot(t - ems[i], 0.45));
        const ultima = i === n - 1;
        return (
          <div key={i}>
            <div style={{ position: "absolute", left: 0, top: y, width: larguraFunil, height: alturaCamada, display: "flex", alignItems: "center", justifyContent: "center", opacity: a }}>
              <div style={{ fontSize: tamTexto[i], lineHeight: 1.1, color: ultima ? contraste(estilo.cor_destaque) : estilo.cor_texto, whiteSpace: "nowrap" }}>{caixa(e.texto, estilo)}</div>
            </div>
            {e.valor ? (
              <div
                style={{
                  position: "absolute",
                  left: largura - larguraColuna,
                  top: y,
                  width: larguraColuna,
                  height: alturaCamada,
                  display: "flex",
                  alignItems: "center",
                  fontSize: tamValor,
                  color: ultima ? estilo.cor_destaque : estilo.cor_texto,
                  textShadow: ultima ? `0 0 30px ${alfa(estilo.cor_destaque, 0.5)}` : "none",
                  whiteSpace: "nowrap",
                  opacity: entra(t, ems[i] + 0.18, 0.3),
                  transform: `translateX(${lerp(-16, 0, entra(t, ems[i] + 0.18, 0.3))}px)`,
                }}
              >
                {caixa(e.valor, estilo)}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
