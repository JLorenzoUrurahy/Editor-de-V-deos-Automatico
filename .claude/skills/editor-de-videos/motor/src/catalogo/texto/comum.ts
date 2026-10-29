// Utilidades da família "texto": quebra de linha medida, superfícies e cores.
import type React from "react";
import { alfa, caixa, medir } from "../../motor/util";
import type { Estilo } from "../../tipos";

export const VERMELHO = "#FF4D4F";
/** Espaço entre palavras, em fração do tamanho da fonte. */
export const ESPACO = 0.28;

/** Cartão padrão do catálogo; com `cor`, a borda e um leve tom puxam para ela. */
export function superficie(cor?: string, ativo = 0): React.CSSProperties {
  return {
    borderRadius: 24,
    background: cor
      ? `linear-gradient(145deg, ${alfa(cor, 0.1 + 0.12 * ativo)}, ${alfa("#FFFFFF", 0.05)})`
      : `linear-gradient(145deg, ${alfa("#FFFFFF", 0.14)}, ${alfa("#FFFFFF", 0.05)})`,
    border: `${cor ? 2 : 1.5}px solid ${cor ? alfa(cor, 0.35 + 0.5 * ativo) : alfa("#FFFFFF", 0.18)}`,
    boxShadow: cor && ativo > 0 ? `0 18px 40px rgba(0,0,0,0.35), 0 0 ${40 * ativo}px ${alfa(cor, 0.35 * ativo)}` : "0 18px 40px rgba(0,0,0,0.35)",
  };
}

/** Largura de cada palavra (já na caixa do estilo). */
export function larguras(estilo: Estilo, palavras: string[], tamanho: number): number[] {
  return palavras.map((p) => medir(estilo, caixa(p, estilo), tamanho));
}

/** Largura de uma linha: palavras medidas uma a uma + espaço fixo entre elas. */
export function larguraLinha(estilo: Estilo, palavras: string[], tamanho: number): number {
  return larguras(estilo, palavras, tamanho).reduce((s, w) => s + w, 0) + ESPACO * tamanho * Math.max(0, palavras.length - 1);
}

/**
 * Quebra palavras em linhas (gulosa) no tamanho dado. Devolve índices por linha,
 * ou null se alguma palavra sozinha não couber.
 */
export function quebrar(estilo: Estilo, palavras: string[], tamanho: number, largura: number): number[][] | null {
  const linhas: number[][] = [];
  let atual: number[] = [];
  for (let i = 0; i < palavras.length; i++) {
    const tentativa = [...atual, i];
    if (larguraLinha(estilo, tentativa.map((k) => palavras[k]), tamanho) <= largura) {
      atual = tentativa;
    } else {
      if (atual.length === 0) return null;
      linhas.push(atual);
      atual = [i];
      if (larguraLinha(estilo, [palavras[i]], tamanho) > largura) return null;
    }
  }
  if (atual.length) linhas.push(atual);
  return linhas;
}

/**
 * Maior tamanho (de `max` a `min`, passo 2) em que as palavras cabem em até
 * `maxLinhas` linhas e na altura dada (entrelinha `entre`).
 */
export function ajustarBloco(
  estilo: Estilo,
  palavras: string[],
  largura: number,
  altura: number,
  max: number,
  min: number,
  maxLinhas: number,
  entre = 1.12,
): { tamanho: number; linhas: number[][] } {
  for (let tam = max; tam >= min; tam -= 2) {
    const linhas = quebrar(estilo, palavras, tam, largura);
    if (linhas && linhas.length <= maxLinhas && linhas.length * tam * entre <= altura) return { tamanho: tam, linhas };
  }
  return { tamanho: min, linhas: quebrar(estilo, palavras, min, largura) ?? palavras.map((_, i) => [i]) };
}

/** Topos de itens empilhados com `gap`, centrados verticalmente em `altura`. */
export function empilhar(alturas: number[], gap: number, altura: number): number[] {
  const total = alturas.reduce((s, h) => s + h, 0) + gap * Math.max(0, alturas.length - 1);
  let y = Math.max(0, (altura - total) / 2);
  return alturas.map((h) => {
    const topo = y;
    y += h + gap;
    return topo;
  });
}
