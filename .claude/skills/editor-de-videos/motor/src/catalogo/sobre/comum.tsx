// Utilidades da família "sobre": acentos que ficam sobre o vídeo da pessoa, sem
// painel. Texto solto sempre com contorno e sombra (o fundo é o vídeo, que muda);
// entradas curtas que variam com a ordem da cena (`n`) e nada se mexe depois.
import type React from "react";
import { clamp01, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { alfa, caixa, medir } from "../../motor/util";
import type { Estilo } from "../../tipos";

/** Três jeitos de entrar, escolhidos pela ordem da cena: varia entre cenas do mesmo tipo. */
export type Entrada = "pop" | "subir" | "deslizar";
const ENTRADAS: Entrada[] = ["pop", "subir", "deslizar"];
export const entradaDe = (n: number | undefined, desloca = 0): Entrada => ENTRADAS[(((n ?? 0) + desloca) % 3 + 3) % 3];

/**
 * Estilo de entrada a partir de t0. Pop: escala com leve sobra (só formas e palavras
 * grandes, até 6%); subir: 40 px de baixo; deslizar: 60 px da esquerda. Opacidade
 * chega antes do movimento terminar, para o elemento já estar legível no `em`.
 */
export function estiloEntrada(t: number, t0: number, tipo: Entrada, dur = 0.4): React.CSSProperties {
  const dt = t - t0;
  const op = clamp01(dt / 0.12);
  if (tipo === "pop") {
    const p = molaLeve(dt, dur, 0.06);
    return { opacity: op, scale: String(lerp(0.55, 1, p)) };
  }
  const p = molaSemOvershoot(dt, dur);
  if (tipo === "subir") return { opacity: op, translate: `0px ${lerp(40, 0, p)}px` };
  return { opacity: op, translate: `${lerp(-60, 0, p)}px 0px` };
}

/** Contorno escuro e sombra para texto solto sobre vídeo. */
export function contornoTexto(estilo: Estilo, tamanho: number): React.CSSProperties {
  return {
    WebkitTextStroke: `${Math.max(6, Math.round(tamanho * 0.09))}px ${estilo.cor_contorno}`,
    paintOrder: "stroke fill",
    textShadow: "0 6px 22px rgba(0,0,0,0.55)",
  };
}

/** Vidro escuro: o cartão dos acentos (desfoca o vídeo atrás). */
export function vidro(estilo: Estilo, raio = 999): React.CSSProperties {
  return {
    backgroundColor: alfa(estilo.cor_fundo, 0.66),
    backdropFilter: "blur(14px)",
    border: `1.5px solid ${alfa("#FFFFFF", 0.16)}`,
    borderRadius: raio,
    boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
  };
}

/**
 * Quebra palavras em até `maxLinhas` linhas e acha o maior tamanho (entre min e max)
 * em que todas cabem na largura e o bloco cabe na altura. Palavras medidas na caixa
 * do estilo. Devolve as linhas e o tamanho; se nada couber, o mínimo em uma por linha.
 */
export function blocoDeLinhas(
  estilo: Estilo,
  texto: string,
  largura: number,
  altura: number,
  max: number,
  min = 40,
  maxLinhas = 3,
  entrelinha = 1.02,
): { linhas: string[]; tamanho: number } {
  const palavras = caixa(texto, estilo).split(/\s+/).filter(Boolean);
  let melhor: { linhas: string[]; tamanho: number } | null = null;
  for (let n = 1; n <= Math.min(maxLinhas, palavras.length); n++) {
    // divisões possíveis em n linhas (poucas palavras: dá para testar todas)
    const cortes = combinacoes(palavras.length - 1, n - 1);
    for (const c of cortes) {
      const linhas: string[] = [];
      let ini = 0;
      for (const k of [...c, palavras.length - 1]) {
        linhas.push(palavras.slice(ini, k + 1).join(" "));
        ini = k + 1;
      }
      const maiorLargura = Math.max(...linhas.map((l) => medir(estilo, l, 100)));
      const pelaLargura = (100 * largura) / maiorLargura;
      const pelaAltura = altura / (linhas.length * entrelinha);
      const tam = Math.floor(Math.min(max, pelaLargura, pelaAltura));
      if (tam >= min && (!melhor || tam > melhor.tamanho + 2)) melhor = { linhas, tamanho: tam };
    }
  }
  return melhor ?? { linhas: palavras, tamanho: min };
}

/** Todas as escolhas de k pontos de corte entre 0 e m-1 (em ordem). */
function combinacoes(m: number, k: number): number[][] {
  if (k === 0) return [[]];
  const saida: number[][] = [];
  const rec = (ini: number, atual: number[]) => {
    if (atual.length === k) {
      saida.push([...atual]);
      return;
    }
    for (let i = ini; i < m; i++) rec(i + 1, [...atual, i]);
  };
  rec(0, []);
  return saida;
}
