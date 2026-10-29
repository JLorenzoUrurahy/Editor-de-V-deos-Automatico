// rede: um centro ligado a vários nós com ícones. Cada ligação se desenha do centro
// para o nó no `em` dele (um ponto corre pela linha uma vez) e o nó acende.
// Para "tudo conectado", integrações, automação, "a IA conversa com seu e-mail, agenda...".
// Sem rótulos nos nós: anel em volta do centro. Com rótulos: leque, o centro à
// esquerda e os nós em pílulas (ícone + rótulo) numa coluna à direita.
// props: {
//   rotulo?: string,
//   centro: { icone: string, rotulo?: string }, em_centro?: number,
//   nos: { icone: string, rotulo?: string, em?: number }[]          (3 a 8; com rótulo, até 5 em metade e 8 em tela)
// }
import type React from "react";
import { clamp01, entra, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { Icone } from "../../motor/icones";
import { alfa, caber, caixa, contraste, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { ESPACO_ROTULO, tamanhoRotulo } from "./texto";

type No = { icone: string; rotulo?: string; em?: number };
type Ponto = [number, number];

/** Curva cúbica horizontal de a para b, amostrada (para medir e cortar no progresso). */
function curva(a: Ponto, b: Ponto, passos = 24): Ponto[] {
  const dx = (b[0] - a[0]) * 0.5;
  const c1: Ponto = [a[0] + dx, a[1]];
  const c2: Ponto = [b[0] - dx, b[1]];
  return Array.from({ length: passos + 1 }, (_, k) => {
    const u = k / passos;
    const v = 1 - u;
    return [v ** 3 * a[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u ** 3 * b[0], v ** 3 * a[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u ** 3 * b[1]];
  });
}

export const Rede: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const rotulo = props.rotulo as string | undefined;
  const centro = (props.centro as { icone: string; rotulo?: string } | undefined) ?? { icone: "Sparkles" };
  const nos = (props.nos as No[] | undefined) ?? [];
  const emCentro = (props.em_centro as number | undefined) ?? 0.15;
  exigirDeclarados("rede", textos, [rotulo, centro.rotulo, ...nos.map((n) => n.rotulo)]);
  const n = Math.max(1, nos.length);
  const ems = nos.map((no, i) => no.em ?? emCentro + 0.45 + 0.3 * i);

  const tamRotulo = rotulo ? tamanhoRotulo(estilo, rotulo, largura) : 0;
  const topo = rotulo ? tamRotulo * 1.6 : 0;
  const h = altura - topo;
  const leque = nos.some((no) => no.rotulo);
  const popCentro = molaLeve(t - emCentro, 0.5, 0.05);
  const entrada = entra(t, 0, 0.35);

  // Geometria dos dois desenhos.
  const rc = leque ? Math.min(92, h * 0.17) : Math.min(largura, h) * 0.15;
  const cx = leque ? rc + 8 : largura / 2;
  const cy = topo + h / 2;
  const tamRotCentro = centro.rotulo ? caber(estilo, caixa(centro.rotulo, estilo), leque ? rc * 2 + 60 : largura * 0.6, 46, 40) : 0;
  const cyCentro = leque && centro.rotulo ? cy - (tamRotCentro * 1.2) / 2 : cy;
  // leque
  const gapPilula = 14;
  const alturaPilula = Math.min(104, (h - gapPilula * (n - 1)) / n);
  const xPilula = cx + rc + 110;
  const larguraPilula = largura - xPilula;
  const icPilula = alturaPilula * 0.48;
  const tamPilula = Math.max(40, Math.min(alturaPilula * 0.46, 58, ...nos.filter((no) => no.rotulo).map((no) => caber(estilo, caixa(no.rotulo!, estilo), larguraPilula - icPilula - 70, 58, 40))));
  const yPilula = (i: number) => topo + (h - (n * alturaPilula + (n - 1) * gapPilula)) / 2 + i * (alturaPilula + gapPilula);
  // anel
  const rn = Math.min(largura, h) * 0.085;
  const rx = largura / 2 - rn - 12;
  const ry = h / 2 - rn - 8;
  const posAnel = (i: number): Ponto => {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n + (n % 2 === 0 ? Math.PI / n : 0);
    return [cx + rx * Math.cos(ang), cy + ry * Math.sin(ang)];
  };

  const ligacao = (i: number): Ponto[] => {
    if (leque) return curva([cx + rc, cyCentro], [xPilula, yPilula(i) + alturaPilula / 2]);
    const [x, y] = posAnel(i);
    const d = Math.hypot(x - cx, y - cy);
    const u: Ponto = [(x - cx) / d, (y - cy) / d];
    return [[cx + u[0] * rc, cy + u[1] * rc], [x - u[0] * rn, y - u[1] * rn]];
  };

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: largura, textAlign: "center", fontSize: tamRotulo, color: estilo.cor_destaque, letterSpacing: ESPACO_ROTULO, whiteSpace: "nowrap", opacity: entrada, transform: `translateY(${lerp(18, 0, entrada)}px)` }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {nos.map((_, i) => {
          if (t < ems[i]) return null;
          const pts = ligacao(i);
          const segs = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]));
          const comp = segs.reduce((s, x) => s + x, 0);
          const p = molaSemOvershoot(t - ems[i], 0.45);
          // ponta: onde a linha está agora
          let resto = comp * p;
          let ponta: Ponto = pts[0];
          for (let k = 0; k < segs.length; k++) {
            if (resto <= segs[k]) {
              const f = segs[k] ? resto / segs[k] : 0;
              ponta = [lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f)];
              break;
            }
            resto -= segs[k];
            ponta = pts[k + 1];
          }
          const corre = clamp01((t - ems[i]) / 0.45);
          return (
            <g key={i}>
              <polyline points={pts.map((q) => q.join(",")).join(" ")} fill="none" stroke={alfa(estilo.cor_destaque, 0.75)} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={comp} strokeDashoffset={comp * (1 - p)} />
              {corre < 1 ? <circle cx={ponta[0]} cy={ponta[1]} r={9} fill="#FFFFFF" stroke={estilo.cor_destaque} strokeWidth={3} /> : null}
            </g>
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: cx - rc,
          top: cyCentro - rc,
          width: rc * 2,
          height: rc * 2,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(145deg, ${estilo.cor_destaque}, ${alfa(estilo.cor_destaque, 0.7)})`,
          boxShadow: `0 0 50px ${alfa(estilo.cor_destaque, 0.5)}, 0 18px 40px rgba(0,0,0,0.35)`,
          transform: `scale(${t >= emCentro ? popCentro : 0})`,
        }}
      >
        <Icone nome={centro.icone} tamanho={rc * 0.95} cor={contraste(estilo.cor_destaque)} traco={2.2} />
      </div>
      {centro.rotulo ? (
        <div
          style={{
            position: "absolute",
            left: leque ? cx - rc - 30 : 0,
            width: leque ? rc * 2 + 60 : largura,
            top: leque ? cyCentro + rc + 12 : cy + rc + 12,
            textAlign: "center",
            fontSize: tamRotCentro,
            color: estilo.cor_texto,
            whiteSpace: "nowrap",
            opacity: entra(t, emCentro + 0.2, 0.3),
          }}
        >
          {caixa(centro.rotulo, estilo)}
        </div>
      ) : null}
      {nos.map((no, i) => {
        const chega = ems[i] + 0.3;
        if (t < chega) return null;
        const pop = molaLeve(t - chega, 0.4, 0.05);
        const acende = molaSemOvershoot(t - chega, 0.3);
        const borda = `2px solid ${alfa(estilo.cor_destaque, lerp(0.2, 0.9, acende))}`;
        const sombra = `0 0 ${lerp(0, 26, acende)}px ${alfa(estilo.cor_destaque, 0.4)}, 0 14px 30px rgba(0,0,0,0.35)`;
        const superficie = `linear-gradient(145deg, ${alfa("#FFFFFF", 0.16)}, ${alfa("#FFFFFF", 0.05)})`;
        if (leque) {
          const y = yPilula(i);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: xPilula,
                top: y,
                width: larguraPilula,
                height: alturaPilula,
                boxSizing: "border-box",
                borderRadius: alturaPilula / 2,
                display: "flex",
                alignItems: "center",
                gap: 22,
                padding: `0 ${alturaPilula * 0.3}px`,
                background: superficie,
                border: borda,
                boxShadow: sombra,
                opacity: clamp01(pop * 1.4),
                transform: `translateX(${lerp(-30, 0, pop)}px)`,
              }}
            >
              <Icone nome={no.icone} tamanho={icPilula} cor={acende > 0.5 ? estilo.cor_destaque : "#FFFFFF"} />
              {no.rotulo ? <div style={{ fontSize: tamPilula, color: estilo.cor_texto, whiteSpace: "nowrap" }}>{caixa(no.rotulo, estilo)}</div> : null}
            </div>
          );
        }
        const [x, y] = posAnel(i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - rn,
              top: y - rn,
              width: rn * 2,
              height: rn * 2,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: superficie,
              border: borda,
              boxShadow: sombra,
              transform: `scale(${pop})`,
            }}
          >
            <Icone nome={no.icone} tamanho={rn} cor="#FFFFFF" />
          </div>
        );
      })}
    </div>
  );
};
