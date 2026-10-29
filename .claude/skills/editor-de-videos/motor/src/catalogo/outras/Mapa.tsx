// mapa: mapa desenhado do Brasil (estados) ou do mundo (países). Na entrada a câmera
// aproxima do foco e para; regiões acendem na cor de destaque no `em` de cada uma,
// pinos caem com rótulo e uma rota opcional se desenha entre pontos.
// props: {
//   regiao?: "brasil" | "mundo",                       (padrão brasil)
//   rotulo?: string,                                     (título no alto)
//   foco?: string[],                                     (estados/países para enquadrar; padrão: os destacados)
//   destaques?: { estado?: string, pais?: string, em?: number }[],
//   pinos?: { estado?: string, pais?: string, lon?: number, lat?: number, rotulo?: string, em?: number }[],
//   rota?: { estado?: string, pais?: string, lon?: number, lat?: number }[], em_rota?: number,
//   em?: number                                          (tempo padrão dos destaques e pinos sem em)
// }
import { geoInterpolate, geoMercator, geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import type React from "react";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { acharLugar, BRASIL, enquadramento, MUNDO, pontoDe, type RefPonto, type Regiao } from "./geo";
import { PinoSvg, RotuloPino } from "./Pino";
import { bordaSuave, ESPACO_ROTULO, tamanhoRotulo } from "./texto";

type Destaque = { estado?: string; pais?: string; em?: number };
type Pino = RefPonto & { rotulo?: string; em?: number };

export const Mapa: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const regiao: Regiao = props.regiao === "mundo" ? "mundo" : "brasil";
  const rotulo = props.rotulo as string | undefined;
  const destaques = (props.destaques as Destaque[] | undefined) ?? [];
  const pinos = (props.pinos as Pino[] | undefined) ?? [];
  const rota = (props.rota as RefPonto[] | undefined) ?? [];
  const emPadrao = (props.em as number | undefined) ?? 0.9;
  const emRota = (props.em_rota as number | undefined) ?? emPadrao;
  exigirDeclarados("mapa", textos, [rotulo, ...pinos.map((p) => p.rotulo)]);

  const base = regiao === "brasil" ? BRASIL : MUNDO;
  const tamRotulo = rotulo ? tamanhoRotulo(estilo, rotulo, largura) : 0;
  const topo = rotulo ? tamRotulo * 1.5 : 0;
  const w = largura;
  const h = altura - topo;
  const margem = 24;

  // Enquadramento inicial (região inteira, um pouco afastado) e final (foco).
  const lugaresFoco = ((props.foco as string[] | undefined) ?? destaques.map((d) => d.estado ?? d.pais ?? "")).filter(Boolean);
  const focoFC: FeatureCollection<Geometry> = { type: "FeatureCollection", features: lugaresFoco.map((c) => acharLugar(c, regiao)) };
  const nova = () => (regiao === "brasil" ? geoMercator() : geoNaturalEarth1());
  const inteira = nova().fitExtent([[margem, margem], [w - margem, h - margem]], (regiao === "mundo" ? { type: "Sphere" } : base) as GeoPermissibleObjects);
  const e0 = enquadramento(inteira, w, h);
  const e1 = focoFC.features.length
    ? enquadramento(nova().fitExtent([[margem * 3, margem * 3], [w - margem * 3, h - margem * 3]], focoFC as GeoPermissibleObjects), w, h)
    : e0;
  const zoomFinal = Math.min(e1.escala, e0.escala * 6);
  const k = molaSemOvershoot(t - 0.1, 1.3);
  const escala = Math.exp(lerp(Math.log(e0.escala * (focoFC.features.length ? 1 : 0.94)), Math.log(zoomFinal), k));
  const centro: [number, number] = [lerp(e0.centro[0], e1.centro[0], k), lerp(e0.centro[1], e1.centro[1], k)];
  const proj = nova().center(centro).scale(escala).translate([w / 2, h / 2]).precision(0.3);
  const caminho = geoPath(proj);
  const entrada = entra(t, 0, 0.4);

  const acesas = new Map<string, number>();
  for (const d of destaques) {
    const lugar = acharLugar(d.estado ?? d.pais ?? "", regiao);
    acesas.set(lugar.properties.sigla ?? lugar.properties.a3 ?? "", molaSemOvershoot(t - (d.em ?? emPadrao), 0.45));
  }

  const pts = rota.map((r) => pontoDe(r, regiao));
  const progressoRota = pts.length > 1 ? molaSemOvershoot(t - emRota, 0.9 + 0.35 * (pts.length - 2)) : 0;
  const rotaParcial: [number, number][] = [];
  if (progressoRota > 0) {
    const trechos = pts.length - 1;
    const andado = progressoRota * trechos;
    for (let i = 0; i < trechos; i++) {
      if (andado <= i) break;
      rotaParcial.push(pts[i]);
      if (andado < i + 1) rotaParcial.push(geoInterpolate(pts[i], pts[i + 1])(andado - i) as [number, number]);
    }
    if (andado >= trechos) rotaParcial.push(pts[trechos]);
  }
  const ponta = rotaParcial.length ? proj(rotaParcial[rotaParcial.length - 1]) : null;

  const tamPino = Math.min(46, ...pinos.filter((p) => p.rotulo).map((p) => caber(estilo, caixa(p.rotulo!, estilo), w * 0.6, 46, 40)));

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: largura, textAlign: "center", fontSize: tamRotulo, color: estilo.cor_destaque, letterSpacing: ESPACO_ROTULO, whiteSpace: "nowrap", opacity: entrada, transform: `translateY(${lerp(18, 0, entrada)}px)` }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: topo, width: w, height: h, overflow: "hidden", opacity: entrada, ...bordaSuave(44) }}>
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0 }}>
          {regiao === "mundo" ? <path d={caminho({ type: "Sphere" }) ?? ""} fill={alfa("#FFFFFF", 0.025)} stroke={alfa("#FFFFFF", 0.12)} strokeWidth={1.5} /> : null}
          {base.features.map((f, i) => (
            <path key={i} d={caminho(f as GeoPermissibleObjects) ?? ""} fill={alfa("#FFFFFF", regiao === "brasil" ? 0.1 : 0.08)} stroke={alfa("#FFFFFF", 0.28)} strokeWidth={regiao === "brasil" ? 1.6 : 1} strokeLinejoin="round" />
          ))}
          <g style={{ filter: `drop-shadow(0 0 18px ${alfa(estilo.cor_destaque, 0.55)})` }}>
            {base.features.map((f, i) => {
              const a = acesas.get(f.properties.sigla ?? f.properties.a3 ?? "") ?? 0;
              return a > 0 ? <path key={i} d={caminho(f as GeoPermissibleObjects) ?? ""} fill={estilo.cor_destaque} fillOpacity={0.94 * a} stroke={alfa("#000000", 0.4 * a)} strokeWidth={2.2} strokeLinejoin="round" /> : null;
            })}
          </g>
          {rotaParcial.length > 1 ? (
            <path d={caminho({ type: "LineString", coordinates: rotaParcial }) ?? ""} fill="none" stroke={estilo.cor_destaque} strokeWidth={7} strokeLinecap="round" strokeDasharray="2 16" />
          ) : null}
          {pts.map((p, i) => {
            const xy = proj(p);
            const chegou = progressoRota * (pts.length - 1) >= i - 0.001;
            return xy && progressoRota > 0 && chegou ? <circle key={i} cx={xy[0]} cy={xy[1]} r={10} fill={estilo.cor_destaque} stroke="#111111" strokeWidth={3} /> : null;
          })}
          {ponta && progressoRota > 0 && progressoRota < 1 ? <circle cx={ponta[0]} cy={ponta[1]} r={13} fill="#FFFFFF" stroke={estilo.cor_destaque} strokeWidth={4} /> : null}
          {pinos.map((p, i) => {
            const xy = proj(pontoDe(p, regiao));
            return xy ? <PinoSvg key={i} x={xy[0]} y={xy[1]} t={t} em={p.em ?? emPadrao + 0.15 * i} estilo={estilo} /> : null;
          })}
        </svg>
        {pinos.map((p, i) => {
          const xy = proj(pontoDe(p, regiao));
          return p.rotulo && xy ? (
            <RotuloPino key={i} x={xy[0]} y={xy[1]} t={t} em={(p.em ?? emPadrao + 0.15 * i) + 0.12} texto={p.rotulo} tamanho={tamPino} largura={w} estilo={estilo} />
          ) : null;
        })}
      </div>
      {regiao === "brasil" ? (
        // A malha dos estados é do IBGE, que pede a citação da fonte.
        <div style={{ position: "absolute", right: 14, bottom: 6, fontSize: 22, fontWeight: 700, color: alfa("#FFFFFF", 0.6), opacity: entrada }}>
          Fonte: IBGE
        </div>
      ) : null}
    </div>
  );
};
