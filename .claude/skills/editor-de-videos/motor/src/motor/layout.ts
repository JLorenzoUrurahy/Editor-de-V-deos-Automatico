// Em que layout o quadro está e quanto da transição já andou.
// Layouts da timeline são só os trechos com cena (metade ou tela); fora deles é "cheio".
import type { Timeline, TipoLayout } from "../tipos";
import { molaSemOvershoot } from "./molas";

export type Estado = { tipo: TipoLayout; p: number };

export const LARGURA = 1080;
export const ALTURA = 1920;
/** Zona segura (fora da interface do Reels, TikTok e Shorts). */
export const ZONA = { x: 108, y: 288, w: 810, h: 1152 };
export const CENTRO_X = ZONA.x + ZONA.w / 2;
/** Na metade, o painel de cena ocupa o alto e a pessoa a metade de baixo. */
export const COSTURA = 960;
/** Área do conteúdo da cena dentro do painel, em cada layout. */
export const CONTEUDO = {
  metade: { x: ZONA.x, y: 300, w: ZONA.w, h: 580 },
  tela: { x: ZONA.x, y: 300, w: ZONA.w, h: 880 },
};
/** Centro vertical da legenda. */
export const Y_LEGENDA = { cheio: 1300, metade: COSTURA, tela: 1300 };

export function estadoNo(frame: number, tl: Timeline): Estado {
  const l = tl.layouts.find((x) => x.tipo !== "cheio" && frame >= x.ini_f && frame < x.fim_f);
  if (!l) return { tipo: "cheio", p: 0 };
  const T = tl.transicao_f / tl.fps;
  const entrada = molaSemOvershoot((frame - l.ini_f) / tl.fps, T);
  const saida = molaSemOvershoot((l.fim_f - frame) / tl.fps, T);
  return { tipo: l.tipo, p: Math.min(entrada, saida) };
}
