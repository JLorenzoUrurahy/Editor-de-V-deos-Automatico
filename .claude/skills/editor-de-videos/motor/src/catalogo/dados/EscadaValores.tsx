// escada_valores: valores ditos em sequência viram barras que sobem, cada uma no
// instante em que é falada, ligadas por uma seta de tendência.
// props: { rotulo?: string, itens: { texto: string, valor: number, em: number }[] }
import type React from "react";
import { entra, lerp, molaLeve } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";

type Item = { texto: string; valor: number; em: number };

export const EscadaValores: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  // Degrau sem `em` entra escalonado (0,5 s entre um e outro).
  const itens = ((props.itens as Item[]) ?? []).map((it, k) => ({ ...it, em: typeof it.em === "number" ? it.em : 0.5 + 0.5 * k }));
  const rotulo = props.rotulo as string | undefined;
  exigirDeclarados("escada_valores", textos, [rotulo, ...itens.map((i) => i.texto)]);
  const n = itens.length;
  const gap = 30;
  const barW = Math.min(170, (largura - 40 - gap * (n - 1)) / n);
  const total = n * barW + (n - 1) * gap;
  const x0 = (largura - total) / 2;
  const tamRotulo = rotulo ? caber(estilo, caixa(rotulo, estilo), largura, 58) : 0;
  const topoArea = rotulo ? tamRotulo * 1.6 : 10;
  const tamValor = Math.min(64, ...itens.map((i) => caber(estilo, i.texto, barW + gap - 4, 64)));
  const base = altura - 14;
  // Reserva acima do valor mais alto para a seta de tendência não encostar no rótulo nem no valor.
  const folgaSeta = 46;
  const hMax = base - topoArea - tamValor * 1.5 - folgaSeta;
  const vMax = Math.max(...itens.map((i) => i.valor));
  const visiveis = itens.filter((i) => t >= i.em).length;
  const rot = entra(t, 0.1, 0.4);

  const topos = itens.map((it, k) => {
    const cresce = molaLeve(t - it.em, 0.5, 0.06);
    const h = Math.max(0.1, it.valor / vMax) * hMax * cresce;
    return { x: x0 + k * (barW + gap) + barW / 2, y: base - h, h };
  });
  const pontos: [number, number][] = topos.slice(0, visiveis).map((p) => [p.x, p.y - tamValor * 1.45 - folgaSeta + 14]);
  // A ponta da seta para antes do valor mais recente (aponta para ele, sem passar por cima).
  if (pontos.length > 1) {
    const [x1, y1] = pontos[pontos.length - 2];
    const [x2, y2] = pontos[pontos.length - 1];
    const xFim = x2 - medir(estilo, itens[visiveis - 1].texto, tamValor) / 2 - 18;
    if (xFim > x1 + 10) pontos[pontos.length - 1] = [xFim, y1 + ((y2 - y1) * (xFim - x1)) / (x2 - x1)];
  }

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: largura, textAlign: "center", fontSize: tamRotulo, color: estilo.cor_destaque, letterSpacing: 4, opacity: rot, transform: `translateY(${lerp(20, 0, rot)}px)` }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: x0 - 20, top: base, width: total + 40, height: 3, borderRadius: 2, backgroundColor: alfa("#FFFFFF", 0.25), opacity: rot }} />
      <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <marker id="seta" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={estilo.cor_destaque} />
          </marker>
        </defs>
        {pontos.length > 1 ? (
          <polyline
            points={pontos.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="none"
            stroke={estilo.cor_destaque}
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2 16"
            markerEnd="url(#seta)"
          />
        ) : null}
      </svg>
      {itens.map((it, k) => {
        if (t < it.em) return null;
        const p = topos[k];
        const ultima = k === visiveis - 1;
        const v = entra(t, it.em + 0.08, 0.3);
        return (
          <div key={k}>
            <div
              style={{
                position: "absolute",
                left: p.x - barW / 2,
                top: p.y,
                width: barW,
                height: p.h,
                borderRadius: "18px 18px 4px 4px",
                background: ultima ? `linear-gradient(180deg, ${estilo.cor_destaque}, ${alfa(estilo.cor_destaque, 0.6)})` : `linear-gradient(180deg, ${alfa("#FFFFFF", 0.26)}, ${alfa("#FFFFFF", 0.07)})`,
                boxShadow: ultima ? `0 0 46px ${alfa(estilo.cor_destaque, 0.5)}` : "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: p.x - (barW + gap) / 2,
                top: p.y - tamValor * 1.3,
                width: barW + gap,
                textAlign: "center",
                fontSize: tamValor,
                color: ultima ? estilo.cor_destaque : alfa("#FFFFFF", 0.8),
                opacity: v,
                transform: `translateY(${lerp(12, 0, v)}px)`,
                whiteSpace: "nowrap",
              }}
            >
              {it.texto}
            </div>
          </div>
        );
      })}
    </div>
  );
};
