// chips: itens (ícone + texto) entram um a um, cada um quando é dito. Caixa larga:
// em linha (quebra em duas se precisar); caixa estreita: em coluna. O item mais
// recente fica aceso; os anteriores ficam em vidro escuro. Até 4 itens.
// Caixa estreita demais para o texto em 40 px: só os ícones (prefira caixa larga).
// props: { itens: { texto: string, icone?: string, em: number }[] }
import type React from "react";
import { Icone } from "../../motor/icones";
import { molaSemOvershoot } from "../../motor/molas";
import { alfa, caixa, contraste, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { entradaDe, estiloEntrada, vidro } from "./comum";

type Item = { texto: string; icone?: string; em: number };

export const Chips: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos, n }) => {
  const itens = ((props.itens as Item[]) ?? []).slice(0, 4);
  exigirDeclarados("chips", textos, itens.map((i) => i.texto));
  const estreita = largura < altura * 1.2;
  const rotulos = itens.map((i) => caixa(i.texto, estilo));
  const comIcone = itens.some((i) => i.icone);
  const larguraChip = (tam: number, k: number) => medir(estilo, rotulos[k], tam) + tam * (comIcone ? 2.2 : 1.3);

  // Tamanho: o maior (52 → 40) em que a arrumação cabe.
  let tam = 56;
  let linhas: number[][] = [];
  let soIcones = false;
  for (; tam >= 40; tam -= 2) {
    const altChip = tam * 1.9;
    if (estreita) {
      if (itens.every((_, k) => larguraChip(tam, k) <= largura) && itens.length * altChip + (itens.length - 1) * 14 <= altura) {
        linhas = itens.map((_, k) => [k]);
        break;
      }
    } else {
      // em linha, quebrando quando passa da largura
      const ls: number[][] = [[]];
      let usado = 0;
      for (let k = 0; k < itens.length; k++) {
        const w = larguraChip(tam, k);
        const atual = ls[ls.length - 1];
        const espaco = atual.length ? 16 : 0;
        if (atual.length && usado + espaco + w > largura) {
          ls.push([k]);
          usado = w;
        } else {
          atual.push(k);
          usado += espaco + w;
        }
      }
      if (ls.length * altChip + (ls.length - 1) * 14 <= altura && ls.length <= 2) {
        linhas = ls;
        break;
      }
    }
  }
  if (!linhas.length) {
    // Nem em 40 px: só os ícones, um por linha (caixa estreita) ou em linha.
    soIcones = true;
    tam = 40;
    linhas = estreita ? itens.map((_, k) => [k]) : [itens.map((_, k) => k)];
  }
  const altChip = soIcones ? Math.min(110, (estreita ? altura / itens.length - 14 : altura), largura) : tam * 1.9;
  const visiveis = itens.filter((i) => t >= i.em - 0.06).length;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      {linhas.map((linha, li) => (
        <div key={li} style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center" }}>
          {linha.map((k) => {
            const it = itens[k];
            const t0 = it.em - 0.06;
            if (t < t0) return <div key={k} style={{ width: soIcones ? altChip : larguraChip(tam, k), height: altChip }} />;
            const aceso = k === visiveis - 1 ? 1 - molaSemOvershoot(t - (itens[k + 1]?.em ?? 1e9) + 0.06, 0.2) : 0;
            const icone = it.icone ? (
              <div
                style={{
                  width: (soIcones ? altChip : tam * 1.25) * (soIcones ? 0.72 : 1),
                  height: (soIcones ? altChip : tam * 1.25) * (soIcones ? 0.72 : 1),
                  borderRadius: "50%",
                  backgroundColor: estilo.cor_destaque,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icone nome={it.icone} tamanho={(soIcones ? altChip * 0.72 : tam * 1.25) * 0.56} cor={contraste(estilo.cor_destaque)} />
              </div>
            ) : null;
            return (
              <div
                key={k}
                style={{
                  ...vidro(estilo),
                  ...estiloEntrada(t, t0, entradaDe(n, k), 0.35),
                  height: altChip,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: tam * 0.32,
                  padding: soIcones ? 0 : `0 ${tam * 0.5}px 0 ${it.icone ? tam * 0.32 : tam * 0.5}px`,
                  width: soIcones ? altChip : undefined,
                  border: `2px solid ${aceso > 0 ? alfa(estilo.cor_destaque, 0.4 + 0.5 * aceso) : alfa("#FFFFFF", 0.16)}`,
                  boxShadow: `0 16px 40px rgba(0,0,0,0.4), 0 0 ${36 * aceso}px ${alfa(estilo.cor_destaque, 0.45 * aceso)}`,
                  fontFamily: estilo.fonte,
                  fontWeight: 800,
                  fontSize: tam,
                  color: estilo.cor_texto,
                  whiteSpace: "nowrap",
                }}
              >
                {icone}
                {soIcones ? null : rotulos[k]}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
