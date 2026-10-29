// antes_depois: dois cartões, "antes" e "depois", ligados por uma seta. O antes entra
// primeiro, neutro; no `em` o depois entra em destaque e o antes esmaece.
// Lado a lado (padrão) ou em pilha (melhor em "tela" ou com textos longos).
// Títulos ("ANTES", "DEPOIS") só aparecem se foram ditos; sem eles, a seta conta a história.
// props: { antes: Lado, depois: Lado, em: number, variante?: "lado" | "pilha" }
//   Lado = { texto: string, titulo?: string, icone?: string, itens?: string[] }
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaLeve } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados } from "../../motor/util";
import type { Estilo, PropsCena } from "../../tipos";
import { superficie, superficieDestaque } from "./comum";

type Lado = { texto: string; titulo?: string; icone?: string; itens?: string[] };

const Cartao: React.FC<{ lado: Lado; largura: number; altura: number; estilo: Estilo; destaque: boolean }> = ({ lado, largura, altura, estilo, destaque }) => {
  const cor = destaque ? contraste(estilo.cor_destaque) : estilo.cor_texto;
  const pad = 30;
  const itens = lado.itens ?? [];
  // Cartão largo (pilha): ícone à esquerda e textos à direita; estreito: tudo empilhado.
  const deitado = largura > altura * 1.5;
  const tamIcone = lado.icone ? Math.min(deitado ? 130 : 96, (deitado ? altura : altura * 0.22) - (deitado ? 2 * pad : 0)) : 0;
  const util = deitado ? largura - 2 * pad - (tamIcone ? tamIcone + 34 : 0) : largura - 2 * pad;
  const tamTitulo = lado.titulo ? caber(estilo, caixa(lado.titulo, estilo), util, 44, 40) : 0;
  const tamItem = itens.length ? Math.max(40, Math.min(46, ...itens.map((i) => caber(estilo, i, util - 52, 46, 40)))) : 0;
  const ocupado = (tamTitulo ? tamTitulo * 1.3 + 10 : 0) + (!deitado && tamIcone ? tamIcone + 16 : 0) + (itens.length ? 14 + itens.length * tamItem * 1.3 : 0);
  const tamTexto = caber(estilo, lado.texto, util, Math.min(deitado ? 88 : 96, Math.max(48, (altura - 2 * pad - ocupado) * 0.85)), 44);
  const textos = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: deitado ? "flex-start" : "center", gap: 8, minWidth: 0 }}>
      {lado.titulo ? <div style={{ fontSize: tamTitulo, lineHeight: 1.2, letterSpacing: 3, opacity: destaque ? 0.85 : 0.7, whiteSpace: "nowrap" }}>{caixa(lado.titulo, estilo)}</div> : null}
      {!deitado && lado.icone ? <Icone nome={lado.icone} tamanho={tamIcone} cor={destaque ? cor : alfa("#FFFFFF", 0.85)} traco={2.2} /> : null}
      <div style={{ fontSize: tamTexto, lineHeight: 1.08, whiteSpace: "nowrap" }}>{lado.texto}</div>
      {itens.length ? (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: tamItem * 0.28, alignItems: "flex-start" }}>
          {itens.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: tamItem, lineHeight: 1, whiteSpace: "nowrap" }}>
              <Icone nome={destaque ? "Check" : "Minus"} tamanho={tamItem * 0.9} cor={cor} traco={3} />
              {it}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
  return (
    <div
      style={{
        ...(destaque ? superficieDestaque(estilo) : superficie()),
        width: largura,
        height: altura,
        boxSizing: "border-box",
        padding: pad,
        display: "flex",
        flexDirection: deitado ? "row" : "column",
        alignItems: "center",
        justifyContent: deitado ? "flex-start" : "center",
        gap: 34,
        color: cor,
      }}
    >
      {deitado && lado.icone ? (
        <div style={{ width: tamIcone, height: tamIcone, flexShrink: 0, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: destaque ? alfa("#000000", 0.1) : alfa("#FFFFFF", 0.06) }}>
          <Icone nome={lado.icone} tamanho={tamIcone * 0.62} cor={destaque ? cor : alfa("#FFFFFF", 0.85)} traco={2.2} />
        </div>
      ) : null}
      {textos}
    </div>
  );
};

export const AntesDepois: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const antes = props.antes as Lado;
  const depois = props.depois as Lado;
  const em = (props.em as number | undefined) ?? 1.4;
  const pilha = props.variante === "pilha";
  exigirDeclarados("antes_depois", textos, [antes.texto, antes.titulo, depois.texto, depois.titulo, ...(antes.itens ?? []), ...(depois.itens ?? [])]);

  const seta = 72;
  const gap = 18;
  const w = pilha ? Math.min(largura, 700) : (largura - seta - 2 * gap) / 2;
  const h = pilha ? (altura - seta - 2 * gap) / 2 : Math.min(altura, 520);
  const pA = entra(t, 0.15, 0.4);
  const pD = molaLeve(t - em, 0.5, 0.05);
  const esmaece = entra(t, em, 0.4);
  const pSeta = entra(t, em - 0.25, 0.3);
  const xA = pilha ? (largura - w) / 2 : 0;
  const yA = pilha ? 0 : (altura - h) / 2;
  const xD = pilha ? xA : largura - w;
  const yD = pilha ? altura - h : yA;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      <div style={{ position: "absolute", left: xA, top: yA, opacity: pA * lerp(1, 0.5, esmaece), translate: `0px ${lerp(20, 0, pA)}px`, scale: String(lerp(1, 0.95, esmaece)) }}>
        <Cartao lado={antes} largura={w} altura={h} estilo={estilo} destaque={false} />
      </div>
      <div
        style={{
          position: "absolute",
          left: pilha ? largura / 2 - seta / 2 : w + gap,
          top: pilha ? h + gap : altura / 2 - seta / 2,
          width: seta,
          height: seta,
          borderRadius: seta / 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: alfa(estilo.cor_destaque, 0.16),
          border: `2px solid ${alfa(estilo.cor_destaque, 0.6)}`,
          opacity: pSeta,
          scale: String(lerp(0.6, 1, pSeta)),
        }}
      >
        <Icone nome={pilha ? "ArrowDown" : "ArrowRight"} tamanho={40} cor={estilo.cor_destaque} traco={3} />
      </div>
      {t >= em ? (
        <div style={{ position: "absolute", left: xD, top: yD, opacity: Math.min(1, (t - em) / 0.12), translate: pilha ? `0px ${lerp(40, 0, pD)}px` : `${lerp(40, 0, pD)}px 0px`, scale: String(lerp(0.9, 1, pD)) }}>
          <Cartao lado={depois} largura={w} altura={h} estilo={estilo} destaque />
        </div>
      ) : null}
    </div>
  );
};
