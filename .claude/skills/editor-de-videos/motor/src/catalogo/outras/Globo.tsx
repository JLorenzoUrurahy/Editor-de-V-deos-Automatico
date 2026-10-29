// globo: globo em projeção ortográfica que gira até o país (ou ponto) alvo na entrada
// e para. O alvo acende na cor de destaque e recebe pino com rótulo.
// props: {
//   pais?: string, lon?: number, lat?: number,         (alvo; padrão BR)
//   rotulo?: string,                                     (título no alto)
//   destaques?: { pais: string, em?: number }[],         (padrão: o próprio alvo, se for país)
//   pinos?: { pais?: string, lon?: number, lat?: number, rotulo?: string, em?: number }[],
//   em?: number                                          (quando o alvo acende; padrão logo depois do giro)
// }
import { geoCentroid, geoDistance, geoGraticule10, geoOrthographic, geoPath, type GeoPermissibleObjects } from "d3-geo";
import type React from "react";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { acharLugar, MUNDO, pontoDe, type RefPonto } from "./geo";
import { PinoSvg, RotuloPino } from "./Pino";
import { ESPACO_ROTULO, tamanhoRotulo } from "./texto";

type Pino = RefPonto & { rotulo?: string; em?: number };

const GIRO_S = 1.7;
const GRADE = geoGraticule10();

export const Globo: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const rotulo = props.rotulo as string | undefined;
  const pinos = (props.pinos as Pino[] | undefined) ?? [];
  const alvoRef: RefPonto = props.lon !== undefined && props.lat !== undefined ? { lon: props.lon as number, lat: props.lat as number } : { pais: (props.pais as string | undefined) ?? "BR" };
  const destaques = (props.destaques as { pais: string; em?: number }[] | undefined) ?? (alvoRef.pais ? [{ pais: alvoRef.pais }] : []);
  const emPadrao = (props.em as number | undefined) ?? GIRO_S - 0.2;
  exigirDeclarados("globo", textos, [rotulo, ...pinos.map((p) => p.rotulo)]);

  const tamRotulo = rotulo ? tamanhoRotulo(estilo, rotulo, largura) : 0;
  const topo = rotulo ? tamRotulo * 1.5 : 0;
  const h = altura - topo;
  const raio = Math.min(largura, h) * 0.46;
  const cx = largura / 2;
  const cy = topo + h / 2;

  const [lon, lat] = alvoRef.pais ? (geoCentroid(acharLugar(alvoRef.pais, "mundo") as GeoPermissibleObjects) as [number, number]) : pontoDe(alvoRef, "mundo");
  const alvoLon = alvoRef.pais ? pontoDe(alvoRef, "mundo")[0] : lon;
  const alvoLat = alvoRef.pais ? pontoDe(alvoRef, "mundo")[1] : lat;
  // O giro só acontece na entrada; depois o globo para com o alvo um pouco acima do centro.
  const giro = molaSemOvershoot(t - 0.05, GIRO_S);
  const lambda = lerp(-alvoLon + 150, -alvoLon, giro);
  const phi = lerp(-alvoLat + 30, -alvoLat * 0.85 - 8, giro);
  const zoom = lerp(0.82, 1, molaSemOvershoot(t, 1.2));
  const proj = geoOrthographic().rotate([lambda, phi]).scale(raio * zoom).translate([cx, cy]).clipAngle(90).precision(0.4);
  const caminho = geoPath(proj);
  const centroVisto: [number, number] = [-lambda, -phi];
  const visivel = (p: [number, number]) => geoDistance(p, centroVisto) < Math.PI / 2 - 0.05;
  const entrada = entra(t, 0, 0.4);
  const r = raio * zoom;

  const acesas = new Map<string, number>();
  for (const d of destaques) {
    const l = acharLugar(d.pais, "mundo");
    acesas.set(l.properties.a3 ?? "", molaSemOvershoot(t - (d.em ?? emPadrao), 0.45));
  }
  const tamPino = Math.min(46, ...pinos.filter((p) => p.rotulo).map((p) => caber(estilo, caixa(p.rotulo!, estilo), largura * 0.6, 46, 40)));

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: largura, textAlign: "center", fontSize: tamRotulo, color: estilo.cor_destaque, letterSpacing: ESPACO_ROTULO, whiteSpace: "nowrap", opacity: entrada, transform: `translateY(${lerp(18, 0, entrada)}px)` }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      {/* atmosfera */}
      <div style={{ position: "absolute", left: cx - r * 1.25, top: cy - r * 1.25, width: r * 2.5, height: r * 2.5, borderRadius: "50%", background: `radial-gradient(closest-side, ${alfa(estilo.cor_destaque, 0.2)} 78%, transparent 100%)`, opacity: entrada }} />
      <svg width={largura} height={altura} style={{ position: "absolute", left: 0, top: 0, opacity: entrada }}>
        <defs>
          <radialGradient id="oceano" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#2A2E3A" />
            <stop offset="100%" stopColor="#0A0B10" />
          </radialGradient>
          <radialGradient id="halo">
            <stop offset="0%" stopColor={alfa(estilo.cor_destaque, 0.55)} />
            <stop offset="100%" stopColor={alfa(estilo.cor_destaque, 0)} />
          </radialGradient>
          <radialGradient id="sombra" cx="72%" cy="74%" r="70%">
            <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <path d={caminho({ type: "Sphere" }) ?? ""} fill="url(#oceano)" />
        <path d={caminho(GRADE) ?? ""} fill="none" stroke={alfa("#FFFFFF", 0.07)} strokeWidth={1} />
        {MUNDO.features.map((f, i) => (
          <path key={i} d={caminho(f as GeoPermissibleObjects) ?? ""} fill={alfa("#FFFFFF", 0.17)} stroke={alfa("#FFFFFF", 0.26)} strokeWidth={0.9} strokeLinejoin="round" />
        ))}
        <g style={{ filter: `drop-shadow(0 0 16px ${alfa(estilo.cor_destaque, 0.6)})` }}>
          {MUNDO.features.map((f, i) => {
            const a = acesas.get(f.properties.a3 ?? "") ?? 0;
            return a > 0 ? <path key={i} d={caminho(f as GeoPermissibleObjects) ?? ""} fill={estilo.cor_destaque} fillOpacity={0.95 * a} stroke={alfa("#000000", 0.35 * a)} strokeWidth={1.5} /> : null;
          })}
        </g>
        {/* halo no alvo: país pequeno (Portugal, Japão) também aparece */}
        {(() => {
          const xy = proj([alvoLon, alvoLat]);
          const a = molaSemOvershoot(t - emPadrao, 0.5);
          return xy && a > 0 && visivel([alvoLon, alvoLat]) ? <circle cx={xy[0]} cy={xy[1]} r={r * 0.22 * a} fill="url(#halo)" /> : null;
        })()}
        <circle cx={cx} cy={cy} r={r} fill="url(#sombra)" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={alfa(estilo.cor_destaque, 0.35)} strokeWidth={2} />
        {pinos.map((p, i) => {
          const g = pontoDe(p, "mundo");
          const xy = proj(g);
          return xy && visivel(g) ? <PinoSvg key={i} x={xy[0]} y={xy[1]} t={t} em={p.em ?? emPadrao + 0.15 * i} estilo={estilo} /> : null;
        })}
      </svg>
      {pinos.map((p, i) => {
        const g = pontoDe(p, "mundo");
        const xy = proj(g);
        return p.rotulo && xy && visivel(g) ? (
          <RotuloPino key={i} x={xy[0]} y={xy[1]} t={t} em={(p.em ?? emPadrao + 0.15 * i) + 0.12} texto={p.rotulo} tamanho={tamPino} largura={largura} estilo={estilo} />
        ) : null;
      })}
    </div>
  );
};
