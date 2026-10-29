// Utilitários de mapa da família "outras": dados embutidos (sem internet no render),
// busca de estado/país por sigla ou nome, ponto de pino e enquadramento.
// Fontes: brasil-uf.json (IBGE, citar a fonte), mundo.json (Natural Earth, domínio público).
import { geoCentroid, type GeoPermissibleObjects, type GeoProjection } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import BRASIL_JSON from "./dados/brasil-uf.json";
import MUNDO_JSON from "./dados/mundo.json";

export type Regiao = "brasil" | "mundo";
type Props = { sigla?: string; nome?: string; a2?: string; a3?: string };
export type Lugar = Feature<Geometry, Props>;

export const BRASIL = BRASIL_JSON as FeatureCollection<Geometry, Props>;
export const MUNDO = MUNDO_JSON as FeatureCollection<Geometry, Props>;

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Estado por sigla ("SP") ou nome ("São Paulo"); país por ISO de 2 ou 3 letras ("BR", "BRA") ou nome em português ("Brasil"). */
export function acharLugar(codigo: string, regiao: Regiao): Lugar {
  const alvo = semAcento(codigo);
  const lista = (regiao === "brasil" ? BRASIL : MUNDO).features;
  const achado = lista.find((f) => {
    const p = f.properties;
    return [p.sigla, p.a2, p.a3, p.nome].some((v) => v !== undefined && semAcento(v) === alvo);
  });
  if (!achado) throw new Error(`Lugar "${codigo}" não encontrado no mapa ${regiao === "brasil" ? "do Brasil (use a sigla do estado)" : "do mundo (use a sigla do país, ex.: BR, PT, US)"}`);
  return achado;
}

/** Ponto de referência: estado/país (centro da área) ou longitude/latitude explícitas. */
export type RefPonto = { estado?: string; pais?: string; lon?: number; lat?: number };

export function pontoDe(r: RefPonto, regiao: Regiao): [number, number] {
  if (typeof r.lon === "number" && typeof r.lat === "number") return [r.lon, r.lat];
  const codigo = r.estado ?? r.pais;
  if (!codigo) throw new Error("Ponto sem estado, pais ou lon/lat");
  // País contém o Brasil inteiro quando a região é o mundo, mesmo se veio "estado".
  const lugar = acharLugar(codigo, r.pais ? "mundo" : regiao);
  return ajusteCentro(lugar, geoCentroid(lugar as GeoPermissibleObjects));
}

// Centroides que caem fora do território (ou longe do que as pessoas reconhecem).
const CENTROS: Record<string, [number, number]> = { US: [-98.5, 39.5], FR: [2.5, 46.6], NO: [9.5, 61.5], RU: [60, 57], CA: [-100, 56], CL: [-71, -33.5] };
function ajusteCentro(lugar: Lugar, c: [number, number]): [number, number] {
  return CENTROS[lugar.properties.a2 ?? ""] ?? c;
}

/** Centro (lon/lat) e escala de uma projeção já ajustada a um retângulo. */
export function enquadramento(p: GeoProjection, w: number, h: number): { centro: [number, number]; escala: number } {
  const c = p.invert?.([w / 2, h / 2]) ?? [0, 0];
  return { centro: [c[0], c[1]], escala: p.scale() };
}
