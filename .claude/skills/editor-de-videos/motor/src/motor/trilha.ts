// Posição do rosto ou da mão em qualquer instante da cena, interpolando as amostras
// da trilha (os scripts já entregam a trilha suavizada). Sem detecção por perto,
// devolve null: a cena decide para onde ir (normalmente para perto do rosto).
import type { Trilha } from "../tipos";

export type Ponto = { x: number; y: number; s: number };

export function posicao(trilha: Trilha | undefined, t: number, fps: number): Ponto | null {
  if (!trilha || trilha.pontos.length === 0) return null;
  const k = (t * fps) / trilha.passo_f;
  const i = Math.max(0, Math.min(trilha.pontos.length - 1, Math.floor(k)));
  const j = Math.min(trilha.pontos.length - 1, i + 1);
  const a = trilha.pontos[i] ?? trilha.pontos[j];
  const b = trilha.pontos[j] ?? a;
  if (!a || !b) return null;
  const f = Math.max(0, Math.min(1, k - i));
  return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, s: a[2] + (b[2] - a[2]) * f };
}

/** Mantém um elemento de tamanho (w, h) centrado em (x, y) dentro da zona segura. */
export function naZona(x: number, y: number, w: number, h: number): { x: number; y: number } {
  return {
    x: Math.max(108 + w / 2, Math.min(918 - w / 2, x)),
    y: Math.max(300 + h / 2, Math.min(1320 - h / 2, y)),
  };
}
