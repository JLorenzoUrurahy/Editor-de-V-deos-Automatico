// linha: gráfico de linha que se desenha da esquerda para a direita, com área
// suave embaixo; cada ponto acende quando a linha passa por ele e o valor final
// entra numa etiqueta na cor de destaque.
// Com números ditos: `pontos` (o valor de cada ponto sai do texto dito ou de `valor`).
// Sem números ("cresceu muito", "despencou"): `variante` dá o desenho, e só o texto
// dito em `final` aparece. Nunca invente valores de pontos para parecer dado.
// props: { rotulo?: string, pontos?: { texto?: string, valor?: number, rotulo?: string, em?: number }[],
//          variante?: "subida" | "subida_forte" | "queda" | "virada", final?: string, em?: number }
import type React from "react";
import { clamp01, entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { alturaRotulo, Rotulo, tamanhoRotulo, valorDe } from "./comum";

type Ponto = { texto?: string; valor?: number; rotulo?: string; em?: number };

// Desenhos prontos (0 = base, 1 = topo), sem significado numérico.
const FORMAS: Record<string, number[]> = {
  subida: [0.12, 0.2, 0.17, 0.33, 0.3, 0.5, 0.58, 0.82],
  subida_forte: [0.06, 0.08, 0.1, 0.12, 0.18, 0.32, 0.6, 0.95],
  queda: [0.88, 0.8, 0.84, 0.62, 0.66, 0.42, 0.3, 0.1],
  virada: [0.7, 0.55, 0.42, 0.22, 0.14, 0.3, 0.62, 0.92],
};

type P = { x: number; y: number };

/** Curva suave (Catmull-Rom) amostrada em pontos, para desenhar por comprimento. */
function amostrar(pts: P[], porTrecho = 24): P[] {
  if (pts.length < 2) return pts;
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < porTrecho; k++) {
      const s = k / porTrecho;
      const s2 = s * s;
      const s3 = s2 * s;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export const Linha: React.FC<PropsCena> = ({ t, dur, largura, altura, estilo, props, textos }) => {
  const pontos = (props.pontos as Ponto[] | undefined) ?? [];
  const forma = props.variante as string | undefined;
  const rotulo = props.rotulo as string | undefined;
  const final = (props.final as string | undefined) ?? [...pontos].reverse().find((p) => p.texto)?.texto;
  exigirDeclarados("linha", textos, [rotulo, final, ...pontos.flatMap((p) => [p.texto, p.rotulo])]);

  const usarPontos = pontos.length >= 2;
  const ys = usarPontos ? pontos.map(valorDe) : FORMAS[forma ?? "subida"] ?? FORMAS.subida;
  const n = ys.length;
  const vMin = usarPontos ? Math.min(0, ...ys) : 0;
  const vMax = usarPontos ? Math.max(...ys) : 1;
  const sobe = ys[n - 1] >= ys[0];

  const tamRot = tamanhoRotulo(estilo, rotulo, largura);
  const temEixoX = usarPontos && pontos.some((p) => p.rotulo);
  const tamX = temEixoX ? Math.max(40, Math.min(44, ...pontos.map((p) => (p.rotulo ? caber(estilo, caixa(p.rotulo, estilo), largura / n, 44, 40) : 44)))) : 0;
  const tamFinal = final ? caber(estilo, final, largura * 0.5, 66, 44) : 0;
  const topo = alturaRotulo(tamRot) + (tamRot ? 24 : 0) + (sobe ? tamFinal * 1.5 + 20 : 10);
  const base = altura - (temEixoX ? tamX * 1.5 : 8) - (sobe ? 8 : tamFinal * 1.5 + 20);
  const margemX = 26;
  const x0 = margemX;
  const x1 = largura - margemX - (final ? Math.min(largura * 0.22, 90) : 0);
  const pts: P[] = ys.map((v, i) => ({ x: lerp(x0, x1, i / (n - 1)), y: lerp(base, topo, (v - vMin) / (vMax - vMin || 1)) }));
  const curva = amostrar(pts);

  // Comprimento acumulado da curva.
  const acum = [0];
  for (let i = 1; i < curva.length; i++) acum.push(acum[i - 1] + Math.hypot(curva[i].x - curva[i - 1].x, curva[i].y - curva[i - 1].y));
  const total = acum[acum.length - 1] || 1;

  // Progresso do desenho: com `em` nos pontos, a linha chega em cada ponto no seu tempo.
  const t0 = 0.35;
  const emFim = (props.em as number | undefined) ?? pontos[n - 1]?.em ?? Math.max(t0 + 1.2, dur - 1.2);
  const marcos = usarPontos && pontos.every((p) => typeof p.em === "number") ? pontos.map((p) => p.em as number) : null;
  let fracao: number; // 0..1 em "pontos percorridos"
  if (marcos) {
    if (t <= marcos[0]) fracao = 0;
    else if (t >= marcos[n - 1]) fracao = 1;
    else {
      const k = marcos.findIndex((m, i) => t >= m && t < marcos[i + 1]);
      fracao = (k + clamp01((t - marcos[k]) / (marcos[k + 1] - marcos[k]))) / (n - 1);
    }
  } else {
    fracao = molaSemOvershoot(t - t0, emFim - t0);
  }
  // Fração de pontos → índice na curva amostrada → comprimento.
  const idxCurva = fracao * (curva.length - 1);
  const i0 = Math.floor(idxCurva);
  const comprimento = lerp(acum[i0], acum[Math.min(curva.length - 1, i0 + 1)], idxCurva - i0);
  const ponta = curva[Math.min(curva.length - 1, Math.round(idxCurva))];
  const caminho = curva.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${caminho} L${x1},${base} L${x0},${base} Z`;
  const fim = t >= (marcos ? marcos[n - 1] : emFim);
  const etiqueta = fim ? molaSemOvershoot(t - (marcos ? marcos[n - 1] : emFim), 0.35) : 0;
  const eixo = entra(t, 0.1, 0.4);
  const corEtiqueta = contraste(estilo.cor_destaque);
  const ultimo = pts[n - 1];

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? <Rotulo texto={rotulo} t={t} topo={0} largura={largura} tamanho={tamRot} estilo={estilo} /> : null}
      <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="linha-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={estilo.cor_destaque} stopOpacity={0.32} />
            <stop offset="100%" stopColor={estilo.cor_destaque} stopOpacity={0} />
          </linearGradient>
          <clipPath id="linha-corte">
            <rect x={0} y={0} width={ponta.x} height={altura} />
          </clipPath>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={x0} x2={largura - margemX} y1={lerp(base, topo, f)} y2={lerp(base, topo, f)} stroke={alfa("#FFFFFF", 0.07)} strokeWidth={2} opacity={eixo} />
        ))}
        <line x1={x0} x2={largura - margemX} y1={base} y2={base} stroke={alfa("#FFFFFF", 0.28)} strokeWidth={3} opacity={eixo} />
        <path d={areaPath} fill="url(#linha-area)" clipPath="url(#linha-corte)" opacity={fracao > 0 ? 1 : 0} />
        {comprimento > 1 ? (
          <path d={caminho} fill="none" stroke={estilo.cor_destaque} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${comprimento} ${total * 2}`} style={{ filter: `drop-shadow(0 0 14px ${alfa(estilo.cor_destaque, 0.55)})` }} />
        ) : null}
        {pts.map((p, i) => {
          const passou = fracao * (n - 1) >= i - 1e-6 && fracao > 0;
          if (!passou || (!usarPontos && i !== n - 1)) return null;
          const ehUltimo = i === n - 1;
          return <circle key={i} cx={p.x} cy={p.y} r={ehUltimo ? 16 : 10} fill={ehUltimo ? estilo.cor_destaque : estilo.cor_fundo} stroke={estilo.cor_destaque} strokeWidth={6} />;
        })}
      </svg>
      {usarPontos
        ? pontos.map((p, i) => {
            if (!p.texto || i === n - 1 || fracao <= 0 || fracao * (n - 1) < i - 1e-6) return null;
            const q = pts[i];
            const tam = caber(estilo, p.texto, largura / n + 20, 46, 40);
            // Rótulo centrado no ponto e acima da curva no trecho que ele ocupa (nunca cortado
            // pela linha). Em vale, embaixo do ponto, se couber acima da base.
            const w = medir(estilo, p.texto, tam) + 8;
            const left = Math.max(0, Math.min(largura - w, q.x - w / 2));
            const trecho = curva.filter((c) => c.x >= left - 6 && c.x <= left + w + 6);
            const ant = pts[Math.max(0, i - 1)].y;
            const prox = pts[Math.min(n - 1, i + 1)].y;
            const vale = i > 0 && ant < q.y && prox < q.y && q.y + 22 + tam * 1.2 < base;
            const top = vale ? Math.max(...trecho.map((c) => c.y), q.y) + 18 : Math.min(...trecho.map((c) => c.y), q.y) - 14 - tam * 1.15;
            const v = entra(t, marcos ? marcos[i] : t0 + ((emFim - t0) * i) / (n - 1), 0.3);
            return (
              <div key={`v${i}`} style={{ position: "absolute", left, top, width: w, textAlign: "center", fontSize: tam, lineHeight: 1.15, color: alfa("#FFFFFF", 0.9), opacity: v, whiteSpace: "nowrap" }}>
                {p.texto}
              </div>
            );
          })
        : null}
      {temEixoX
        ? pontos.map((p, i) =>
            p.rotulo ? (
              <div key={`x${i}`} style={{ position: "absolute", left: pts[i].x - largura / n / 2 - 20, top: base + tamX * 0.3, width: largura / n + 40, textAlign: "center", fontSize: tamX, color: alfa("#FFFFFF", 0.7), opacity: eixo, whiteSpace: "nowrap" }}>
                {caixa(p.rotulo, estilo)}
              </div>
            ) : null,
          )
        : null}
      {final && etiqueta > 0 ? (
        <div
          style={{
            position: "absolute",
            left: Math.min(largura - 8, Math.max(8, ultimo.x)) ,
            top: sobe ? ultimo.y - tamFinal * 1.45 - 26 : ultimo.y + 30,
            translate: "-60% 0px",
            padding: `${tamFinal * 0.12}px ${tamFinal * 0.32}px`,
            borderRadius: 16,
            backgroundColor: estilo.cor_destaque,
            color: corEtiqueta,
            fontSize: tamFinal,
            lineHeight: 1.15,
            boxShadow: `0 0 40px ${alfa(estilo.cor_destaque, 0.5)}`,
            opacity: etiqueta,
            scale: String(lerp(0.7, 1, etiqueta)),
            whiteSpace: "nowrap",
          }}
        >
          {final}
        </div>
      ) : null}
    </div>
  );
};
