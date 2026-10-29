// comparacao: A contra B em duas colunas. Cada coluna tem título e itens com
// ✓ ou ✗; no `em_vencedor` o lado vencedor acende na cor de destaque e o outro recua.
// props: { a: Lado, b: Lado, vencedor?: "a" | "b", em_vencedor?: number }
//   Lado = { titulo: string, icone?: string, em?: number, itens?: { texto: string, ok?: boolean, em?: number }[] }
// Sem `em` nos itens, eles entram em sequência logo depois do título do lado.
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaLeve } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { superficie, VERMELHO } from "./comum";

type ItemLado = { texto: string; ok?: boolean; em?: number };
type Lado = { titulo: string; icone?: string; em?: number; itens?: ItemLado[] };

export const Comparacao: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const a = props.a as Lado;
  const b = props.b as Lado;
  const vencedor = props.vencedor as "a" | "b" | undefined;
  const emV = (props.em_vencedor as number | undefined) ?? Infinity;
  const lados = [a, b];
  exigirDeclarados("comparacao", textos, lados.flatMap((l) => [l.titulo, ...(l.itens ?? []).map((i) => i.texto)]));

  const gap = 26;
  const larguraCol = (largura - gap) / 2;
  const maxItens = Math.max(...lados.map((l) => (l.itens ?? []).length), 0);
  const comIcone = lados.some((l) => l.icone);
  const tamTitulo = Math.min(...lados.map((l) => caber(estilo, caixa(l.titulo, estilo), larguraCol - 48, 76, 40)));
  const cabecalho = (comIcone ? tamTitulo * 1.3 + 12 : 0) + tamTitulo * 1.25 + 28;
  const alturaItem = maxItens ? Math.min(118, (altura - cabecalho - 24) / maxItens) : 0;
  const marca = alturaItem * 0.5;
  const tamItem = Math.max(40, Math.min(60, alturaItem * 0.5, ...lados.flatMap((l) => (l.itens ?? []).map((i) => caber(estilo, caixa(i.texto, estilo), larguraCol - 48 - marca - 14, 60, 40)))));
  const alturaCol = Math.min(altura, cabecalho + maxItens * alturaItem + 24);
  const topo = (altura - alturaCol) / 2;
  const decide = vencedor ? entra(t, emV, 0.4) : 0;
  const pop = vencedor ? molaLeve(t - emV, 0.45, 0.05) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {lados.map((l, k) => {
        const emLado = l.em ?? (k === 0 ? 0.1 : 0.45);
        if (t < emLado) return null;
        const chega = entra(t, emLado, 0.42);
        const ganha = vencedor === (k === 0 ? "a" : "b");
        const realce = ganha ? decide : 0;
        const recua = vencedor && !ganha ? decide : 0;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: k * (larguraCol + gap),
              top: topo,
              width: larguraCol,
              height: alturaCol,
              boxSizing: "border-box",
              padding: "24px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              ...superficie(estilo.cor_destaque, realce),
              opacity: chega * lerp(1, 0.45, recua),
              transform: `translateY(${lerp(40, 0, chega)}px) scale(${ganha && t >= emV ? lerp(1, 1.035, pop) : lerp(1, 0.97, recua)})`,
            }}
          >
            {l.icone ? <Icone nome={l.icone} tamanho={tamTitulo * 1.3} cor={realce > 0.5 ? estilo.cor_destaque : alfa("#FFFFFF", 0.85)} /> : comIcone ? <div style={{ height: tamTitulo * 1.3 }} /> : null}
            <div style={{ marginTop: comIcone ? 12 : 0, fontSize: tamTitulo, lineHeight: 1.25, color: realce > 0.5 ? estilo.cor_destaque : estilo.cor_texto, whiteSpace: "nowrap" }}>{caixa(l.titulo, estilo)}</div>
            <div style={{ width: "100%", height: 2, marginTop: 14, marginBottom: 6, backgroundColor: alfa("#FFFFFF", 0.14) }} />
            {(l.itens ?? []).map((it, j) => {
              const emItem = it.em ?? emLado + 0.25 + 0.12 * j;
              if (t < emItem) return <div key={j} style={{ height: alturaItem }} />;
              const v = entra(t, emItem, 0.32);
              const ok = it.ok !== false;
              return (
                <div key={j} style={{ height: alturaItem, width: "100%", display: "flex", alignItems: "center", gap: 14, opacity: v, transform: `translateX(${lerp(-24, 0, v)}px)` }}>
                  <div style={{ flex: "none", width: marca, height: marca, borderRadius: marca / 2, backgroundColor: alfa(ok ? estilo.cor_destaque : VERMELHO, 0.18), display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icone nome={ok ? "Check" : "X"} tamanho={marca * 0.7} cor={ok ? estilo.cor_destaque : VERMELHO} traco={3} />
                  </div>
                  <div style={{ fontSize: tamItem, color: ok ? estilo.cor_texto : alfa("#FFFFFF", 0.7), whiteSpace: "nowrap" }}>{caixa(it.texto, estilo)}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
