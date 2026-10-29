// contagem: selos numerados (1, 2, 3...) com rótulo curto. Cada um sai da mão (ou do
// alto da cabeça, sem mão) no instante em que o item é dito e voa para o seu lugar:
// em fileira acima da cabeça, ou em coluna ao lado dela quando não há espaço em cima.
// O item mais recente fica aceso; os anteriores apagam um pouco.
// props: { itens: { texto: string, em: number }[] }   (até 4)
import type React from "react";
import { clamp01, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { contornoTexto } from "../sobre/comum";
import { cabeca, ladoLivre, misturar, topoCabeca, ultimaVista } from "./comum";

type Item = { texto: string; em: number };

export const Contagem: React.FC<PropsCena> = ({ t, estilo, props, textos, rosto, trilha }) => {
  const itens = ((props.itens as Item[]) ?? []).slice(0, 4);
  exigirDeclarados("contagem", textos, itens.map((i) => i.texto));
  if (!itens.length) return null;
  const mao = trilha?.de === "mao" ? trilha : undefined;
  const em0 = itens[0].em ?? 0.2;
  // O lugar dos selos é decidido uma vez, pela cabeça no primeiro item (fila estável).
  const cab0 = cabeca(trilha?.de === "rosto" ? trilha : undefined, rosto, em0);
  const n = itens.length;
  const d = 116;
  const topoLivre = topoCabeca(cab0) - 24;
  const emFila = topoLivre - 300 >= 196;

  const lado = ladoLivre(cab0) === "direita" ? 1 : -1;
  const rotulos = itens.map((i) => caixa(i.texto, estilo));
  const larguraLateral = Math.max(160, lado > 0 ? 918 - (cab0.x + cab0.s / 2) - 20 : cab0.x - cab0.s / 2 - 20 - 108);
  // Em fileira, cada selo ocupa a largura do seu rótulo: o maior tamanho (até 58) em
  // que a fileira inteira cabe nos 810 px da zona segura.
  let tamRotulo = 40;
  let larguras: number[] = [];
  if (emFila) {
    for (let tam = 58; tam >= 40; tam -= 2) {
      larguras = rotulos.map((r) => Math.max(d, medir(estilo, r, tam)) + 36);
      tamRotulo = tam;
      if (larguras.reduce((a, b) => a + b, 0) <= 810) break;
    }
  } else {
    tamRotulo = Math.min(58, ...rotulos.map((r) => caber(estilo, r, larguraLateral - 12, 58, 40)));
    larguras = rotulos.map(() => larguraLateral);
  }
  const alturaSlot = d + 10 + tamRotulo * 1.15;
  const totalFila = larguras.reduce((a, b) => a + b, 0);
  const slots = itens.map((_, k) => {
    if (emFila) {
      const y = 300 + (topoLivre - 300 - alturaSlot) / 2 + d / 2;
      const antes = larguras.slice(0, k).reduce((a, b) => a + b, 0);
      return { x: 513 - totalFila / 2 + antes + larguras[k] / 2, y };
    }
    const x = lado > 0 ? 918 - larguraLateral / 2 : 108 + larguraLateral / 2;
    return { x, y: Math.max(300 + d / 2, cab0.y - cab0.s * 0.55) + k * (alturaSlot + 14) };
  });
  const atual = itens.reduce((a, it, k) => (t >= it.em ? k : a), -1);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {itens.map((it, k) => {
        if (t < it.em - 0.05) return null;
        const vista = ultimaVista(mao, it.em);
        const cabAgora = cabeca(trilha?.de === "rosto" ? trilha : undefined, rosto, it.em);
        const origem = vista && vista.sumiu < 0.5 ? { x: vista.p.x, y: vista.p.y - vista.p.s * 0.3 } : { x: cabAgora.x, y: topoCabeca(cabAgora) + 40 };
        const voo = molaSemOvershoot(t - it.em, 0.45);
        const pos = misturar(origem, slots[k], voo);
        const escala = lerp(0.3, 1, molaLeve(t - it.em, 0.45, 0.06));
        const aceso = k === atual ? 1 : 1 - molaSemOvershoot(t - (itens[k + 1]?.em ?? Infinity), 0.25);
        const op = clamp01((t - it.em + 0.05) / 0.1);
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: pos.x - larguras[k] / 2,
              top: pos.y - d / 2,
              width: larguras[k],
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              opacity: op,
              transform: `scale(${escala})`,
              transformOrigin: `50% ${d / 2}px`,
            }}
          >
            <div
              style={{
                width: d,
                height: d,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: d * 0.56,
                lineHeight: 1,
                color: aceso > 0.5 ? contraste(estilo.cor_destaque) : estilo.cor_destaque,
                background: aceso > 0.5 ? estilo.cor_destaque : alfa(estilo.cor_fundo, 0.85),
                border: `3px solid ${alfa(estilo.cor_destaque, lerp(0.6, 1, aceso))}`,
                boxShadow: `0 0 ${34 * aceso}px ${alfa(estilo.cor_destaque, 0.6 * aceso)}, 0 12px 30px rgba(0,0,0,0.45)`,
              }}
            >
              {k + 1}
            </div>
            <div style={{ fontSize: tamRotulo, lineHeight: 1.1, color: estilo.cor_texto, opacity: lerp(0.75, 1, aceso), whiteSpace: "nowrap", ...contornoTexto(estilo, tamRotulo) }}>
              {caixa(it.texto, estilo)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
