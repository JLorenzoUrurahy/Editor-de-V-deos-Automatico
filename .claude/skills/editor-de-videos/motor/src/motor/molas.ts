// Molas em forma fechada (expressão analítica, sem simulação passo a passo).
// Entrada: tempo decorrido `t` e duração `dur`, ambos em segundos.
// Saída: progresso de 0 a 1. Determinístico: mesmo t, mesmo resultado.
//
// Regra: "molas em forma fechada, sem overshoot em texto,
// overshoot leve (até 4%) em cartões".

/**
 * Mola criticamente amortecida: nunca passa de 1 (sem overshoot).
 * Normalizada para valer exatamente 1 em t = dur.
 */
export function molaSemOvershoot(t: number, dur: number): number {
  if (!(dur > 0) || t >= dur) return 1;
  if (t <= 0) return 0;
  const w = 7 / dur; // w*dur = 7: resíduo de ~0,7% antes da normalização; movimento bem distribuído
  const f = (x: number) => 1 - (1 + w * x) * Math.exp(-w * x);
  return f(t) / f(dur);
}

/**
 * Mola sub-amortecida com overshoot máximo controlado (padrão 4%).
 * Pico em ~55% da duração; em t = dur o resíduo é < 0,3% e o valor é travado em 1.
 */
export function molaLeve(t: number, dur: number, overshoot = 0.04): number {
  if (!(dur > 0) || t >= dur) return 1;
  if (t <= 0) return 0;
  const a = Math.log(1 / overshoot) / Math.PI;
  const zeta = a / Math.sqrt(1 + a * a); // razão de amortecimento que dá o overshoot pedido
  const wd = Math.PI / (0.55 * dur); // frequência amortecida: pico em 0,55*dur
  const wn = wd / Math.sqrt(1 - zeta * zeta);
  const env = Math.exp(-zeta * wn * t);
  return 1 - env * (Math.cos(wd * t) + ((zeta * wn) / wd) * Math.sin(wd * t));
}

/** Interpolação linear. */
export function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

/** Limita a [0, 1]. */
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

/** Progresso 0→1 de uma animação que começa em t0 e dura dur, já limitado. */
export const janela = (t: number, t0: number, dur: number): number => clamp01((t - t0) / dur);

/** Entrada com mola sem overshoot a partir de t0 (0 antes, 1 depois de dur). */
export const entra = (t: number, t0: number, dur = 0.45): number => molaSemOvershoot(t - t0, dur);

/** Saída nos últimos `dur` segundos da cena: 1 → 0. */
export const sai = (t: number, total: number, dur = 0.3): number => 1 - molaSemOvershoot(t - (total - dur), dur);
