// Peças comuns da família telas: quebra de linha, digitação, superfícies e
// barra de janela. Tudo função pura de t, como as cenas.
import type React from "react";
import { alfa, medir } from "../../motor/util";
import type { Estilo } from "../../tipos";

/** Quebra o texto em linhas que cabem em `largura` (nunca corta palavra). */
export function quebrar(estilo: Estilo, texto: string, largura: number, tamanho: number): string[] {
  const linhas: string[] = [];
  let atual = "";
  for (const p of texto.split(/\s+/).filter(Boolean)) {
    const teste = atual ? `${atual} ${p}` : p;
    if (!atual || medir(estilo, teste, tamanho) <= largura) atual = teste;
    else {
      linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Maior tamanho (de `max` até `min`) em que o texto cabe em até `maxLinhas` linhas. */
export function tamanhoQueCabe(estilo: Estilo, texto: string, largura: number, max: number, min: number, maxLinhas: number): number {
  for (let tam = max; tam > min; tam -= 2) {
    const linhas = quebrar(estilo, texto, largura, tam);
    if (linhas.length <= maxLinhas && linhas.every((l) => medir(estilo, l, tam) <= largura)) return tam;
  }
  return min;
}

/**
 * Digitação: das linhas já quebradas (layout estável, sem refluxo), devolve o que
 * aparece com `n` caracteres digitados.
 */
export function digitado(linhas: string[], n: number): string[] {
  const saida: string[] = [];
  let resta = Math.max(0, Math.floor(n));
  for (const l of linhas) {
    if (resta <= 0) break;
    saida.push(l.slice(0, resta));
    resta -= l.length + 1;
  }
  return saida;
}

/** Caracteres digitados no instante t, de t0 até t1 (ritmo uniforme). */
export function caracteresEm(t: number, t0: number, t1: number, total: number): number {
  if (t <= t0) return 0;
  if (t >= t1) return total;
  return Math.round(((t - t0) / (t1 - t0)) * total);
}

/** Superfície de cartão (vidro escuro) do guia de cenas. */
export const superficie = (forte = false): React.CSSProperties => ({
  background: `linear-gradient(145deg, ${alfa("#FFFFFF", forte ? 0.16 : 0.14)}, ${alfa("#FFFFFF", forte ? 0.06 : 0.05)})`,
  border: `1.5px solid ${alfa("#FFFFFF", 0.18)}`,
  boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
});

/** Janela grande (chat, prompt): fundo escuro opaco, para o brilho do painel não tingir. */
export const janela = (): React.CSSProperties => ({
  background: "linear-gradient(160deg, #272A35 0%, #17181F 100%)",
  border: `1.5px solid ${alfa("#FFFFFF", 0.14)}`,
  boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
});

/** Barra de janela com as três bolinhas (navegador, terminal). */
export const BarraJanela: React.FC<{ altura: number; children?: React.ReactNode; escura?: boolean }> = ({ altura, children, escura }) => {
  const r = altura * 0.17;
  return (
    <div
      style={{
        height: altura,
        display: "flex",
        alignItems: "center",
        gap: altura * 0.18,
        padding: `0 ${altura * 0.32}px`,
        background: escura ? "#1B1E26" : "linear-gradient(180deg, #2C2F38, #23262E)",
        borderBottom: `1.5px solid ${alfa("#FFFFFF", 0.08)}`,
        flexShrink: 0,
      }}
    >
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <div key={c} style={{ width: 2 * r, height: 2 * r, borderRadius: r, backgroundColor: c, flexShrink: 0 }} />
      ))}
      {children}
    </div>
  );
};

/** Sombra de "chão" sob um objeto 3D (elipse borrada), opacidade pela entrada. */
export const SombraChao: React.FC<{ x: number; y: number; largura: number; opacidade: number }> = ({ x, y, largura, opacidade }) => (
  <div
    style={{
      position: "absolute",
      left: x - largura / 2,
      top: y - largura * 0.06,
      width: largura,
      height: largura * 0.12,
      borderRadius: "50%",
      background: "radial-gradient(closest-side, rgba(0,0,0,0.55), transparent)",
      opacity: opacidade,
    }}
  />
);
