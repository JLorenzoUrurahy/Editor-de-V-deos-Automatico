// Texto da família "outras": rótulo de título com espaçamento entre letras.
import type React from "react";
import type { Estilo } from "../../tipos";
import { caber, caixa } from "../../motor/util";

export const ESPACO_ROTULO = 4;

/** Tamanho em que o rótulo cabe numa linha, contando o espaçamento entre letras. */
export function tamanhoRotulo(estilo: Estilo, rotulo: string, largura: number, max = 54): number {
  const t = caixa(rotulo, estilo);
  return caber(estilo, t, largura - ESPACO_ROTULO * t.length, max);
}

/** Máscara que apaga as bordas de uma área (mapa cortado não fica com quina dura). */
export const bordaSuave = (px: number): React.CSSProperties => {
  const g = (dir: string) => `linear-gradient(${dir}, transparent 0, black ${px}px, black calc(100% - ${px}px), transparent 100%)`;
  return { maskImage: `${g("to right")}, ${g("to bottom")}`, maskComposite: "intersect", WebkitMaskImage: `${g("to right")}, ${g("to bottom")}`, WebkitMaskComposite: "source-in" };
};
