// Utilidades da família "interacao": onde estão a cabeça e a mão em cada instante,
// e as peças visuais que nascem delas. Tudo função pura de `t`: a trilha já vem
// suavizada dos scripts; aqui só uma média curta para nenhum quadro tremer.
//
// Trilha de rosto: pontos [centro x, centro y, largura do rosto].
// Trilha de mão: pontos [centro x, centro y, altura da mão].
import type React from "react";
import { Icone } from "../../motor/icones";
import { posicao, type Ponto } from "../../motor/trilha";
import { alfa, contraste } from "../../motor/util";
import type { Caixa, Estilo, Trilha } from "../../tipos";

export const FPS = 30;

/** Cabeça padrão, quando não há trilha nem caixa do rosto: selfie centrada. */
const CABECA_PADRAO: Ponto = { x: 540, y: 900, s: 440 };

/** Posição média de t até 0,13 s antes (ignora amostras sem detecção). */
export function suave(trilha: Trilha | undefined, t: number): Ponto | null {
  const ps = [0, 2, 4].map((k) => posicao(trilha, Math.max(0, t - k / FPS), FPS)).filter((p): p is Ponto => p !== null);
  if (!ps.length) return null;
  return { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length, s: ps.reduce((a, p) => a + p.s, 0) / ps.length };
}

/** Centro e largura do rosto no instante t: trilha de rosto, senão a caixa, senão o padrão. */
export function cabeca(trilha: Trilha | undefined, rosto: Caixa | undefined, t: number): Ponto {
  if (trilha?.de === "rosto") {
    const p = suave(trilha, t);
    if (p) return p;
  }
  if (rosto) return { x: rosto.x + rosto.w / 2, y: rosto.y + rosto.h / 2, s: rosto.w };
  return CABECA_PADRAO;
}

/** Topo da cabeça (cabelo) a partir do centro e da largura do rosto. */
export const topoCabeca = (c: Ponto) => c.y - c.s * 0.5 - c.s * 0.4;

/** Índice da amostra da trilha no instante t. */
const amostra = (trilha: Trilha, t: number) => Math.max(0, Math.min(trilha.pontos.length - 1, Math.floor((t * FPS) / trilha.passo_f)));

/** Primeiro instante, a partir de `desde`, em que a trilha tem detecção. */
export function primeiraVista(trilha: Trilha | undefined, desde: number): number | null {
  if (!trilha) return null;
  for (let k = amostra(trilha, desde); k < trilha.pontos.length; k++) {
    if (trilha.pontos[k]) return Math.max(desde, (k * trilha.passo_f) / FPS);
  }
  return null;
}

/**
 * Última posição vista até t e há quanto tempo ela sumiu (0 = visível agora).
 * null = a trilha ainda não teve detecção até t.
 */
export function ultimaVista(trilha: Trilha | undefined, t: number): { p: Ponto; sumiu: number } | null {
  if (!trilha) return null;
  const agora = suave(trilha, t);
  const k0 = amostra(trilha, t);
  if (agora && trilha.pontos[k0]) return { p: agora, sumiu: 0 };
  for (let k = k0; k >= 0; k--) {
    const q = trilha.pontos[k];
    if (q) {
      const tk = (k * trilha.passo_f) / FPS;
      const p = suave(trilha, tk) ?? { x: q[0], y: q[1], s: q[2] };
      return { p, sumiu: Math.max(0, t - tk - trilha.passo_f / FPS) };
    }
  }
  return null;
}

/** Mistura de dois pontos. */
export const misturar = (a: { x: number; y: number }, b: { x: number; y: number }, f: number) => ({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });

/** Prende o centro de um elemento (w, h) na zona segura (x 108–918, y 300–1320). */
export function prender(x: number, y: number, w: number, h: number) {
  return { x: Math.max(108 + w / 2, Math.min(918 - w / 2, x)), y: Math.max(300 + h / 2, Math.min(1320 - h / 2, y)) };
}

/** Lado com mais espaço livre ao lado da cabeça (dentro da zona segura). */
export function ladoLivre(c: Ponto): "esquerda" | "direita" {
  const esq = c.x - c.s / 2 - 108;
  const dir = 918 - (c.x + c.s / 2);
  return dir >= esq ? "direita" : "esquerda";
}

/** Círculo na cor de destaque com brilho e um ícone escuro dentro: o "objeto". */
export const Bolha: React.FC<{ estilo: Estilo; icone: string; d: number; brilho?: number; apagado?: boolean }> = ({ estilo, icone, d, brilho = 1, apagado }) => (
  <div
    style={{
      width: d,
      height: d,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: apagado
        ? `linear-gradient(145deg, ${alfa(estilo.cor_fundo2, 0.92)}, ${alfa(estilo.cor_fundo, 0.92)})`
        : `radial-gradient(circle at 35% 30%, ${alfa("#FFFFFF", 0.35)}, ${estilo.cor_destaque} 55%)`,
      border: apagado ? `2px solid ${alfa(estilo.cor_destaque, 0.7)}` : `3px solid ${alfa("#FFFFFF", 0.35)}`,
      boxShadow: apagado ? "0 12px 30px rgba(0,0,0,0.45)" : `0 0 ${36 * brilho}px ${alfa(estilo.cor_destaque, 0.6 * brilho)}, 0 14px 34px rgba(0,0,0,0.4)`,
    }}
  >
    <Icone nome={icone} tamanho={d * 0.5} cor={apagado ? estilo.cor_destaque : contraste(estilo.cor_destaque)} traco={2.2} />
  </div>
);
