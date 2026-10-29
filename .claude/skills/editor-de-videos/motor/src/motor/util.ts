// Utilidades das cenas.
import { measureText } from "@remotion/layout-utils";
import type { Estilo } from "../tipos";

/** Largura de um texto na fonte da marca (só depois de useFontePronta). */
export function medir(estilo: Estilo, texto: string, tamanho: number): number {
  return measureText({ text: texto, fontFamily: estilo.fonte, fontSize: tamanho, fontWeight: 800, validateFontIsLoaded: true }).width;
}

/** Maior tamanho (até `max`) em que o texto cabe em `largura`. */
export function caber(estilo: Estilo, texto: string, largura: number, max: number, min = 24): number {
  const w = medir(estilo, texto, max);
  return w <= largura ? max : Math.max(min, Math.floor((max * largura) / w));
}

/** Falha alto se a cena tenta mostrar texto que não foi declarado (e conferido contra a fala). */
export function exigirDeclarados(id: string, textos: string[], usados: (string | undefined)[]): void {
  const ok = new Set(textos);
  for (const u of usados) {
    if (u && !ok.has(u)) throw new Error(`Cena ${id}: texto "${u}" não está declarado`);
  }
}

export const caixa = (t: string, estilo: Estilo) => (estilo.caixa_alta ? t.toUpperCase() : t);

/** Cor com transparência a partir de #RRGGBB. */
export function alfa(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/** Texto escuro ou claro, o que contrastar com o fundo. */
export function contraste(hex: string): string {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((k) => parseInt(h.slice(k, k + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55 ? "#111111" : "#FFFFFF";
}
