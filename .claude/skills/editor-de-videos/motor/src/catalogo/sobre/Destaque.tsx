// destaque: 1 a 3 palavras-chave que saltam no espaço livre ao redor do rosto, no
// instante em que são ditas. Caixa larga (acima da cabeça): uma ou duas linhas;
// caixa estreita e alta (lateral): uma palavra por linha.
//   palavra: texto grande na cor de destaque, contorno escuro, sem caixa;
//   pilula:  pílula de vidro escuro, ícone opcional num círculo na cor de destaque;
//   selo:    selo inclinado na cor de destaque.
// props: { texto: string, icone?: string, variante?: "palavra" | "pilula" | "selo", em?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { lerp, molaLeve } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { blocoDeLinhas, contornoTexto, entradaDe, estiloEntrada, vidro } from "./comum";

export const Destaque: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos, n }) => {
  const texto = props.texto as string;
  const icone = props.icone as string | undefined;
  const variante = (props.variante as string | undefined) ?? "palavra";
  const em = (props.em as number | undefined) ?? 0.15;
  exigirDeclarados("destaque", textos, [texto]);
  const t0 = Math.max(0, em - 0.08);
  const estreita = largura < altura * 1.2;

  if (variante === "pilula") {
    // Pílula: uma linha; o texto cabe na largura que sobra depois do ícone.
    const alt = Math.min(altura, 150);
    const tamIcone = icone ? alt * 0.62 : 0;
    const folga = alt * 0.32;
    const tam = caber(estilo, caixa(texto, estilo), largura - tamIcone - folga * (icone ? 2.4 : 2), Math.min(84, alt * 0.52), 40);
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            ...vidro(estilo),
            ...estiloEntrada(t, t0, entradaDe(n), 0.4),
            height: alt,
            display: "flex",
            alignItems: "center",
            gap: alt * 0.18,
            padding: `0 ${folga}px 0 ${icone ? alt * 0.19 : folga}px`,
            fontFamily: estilo.fonte,
            fontWeight: 800,
            fontSize: tam,
            color: estilo.cor_texto,
            whiteSpace: "nowrap",
          }}
        >
          {icone ? (
            <div style={{ width: tamIcone, height: tamIcone, borderRadius: "50%", backgroundColor: estilo.cor_destaque, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 26px ${alfa(estilo.cor_destaque, 0.55)}` }}>
              <Icone nome={icone} tamanho={tamIcone * 0.56} cor={contraste(estilo.cor_destaque)} />
            </div>
          ) : null}
          {caixa(texto, estilo)}
        </div>
      </div>
    );
  }

  if (variante === "selo") {
    // Selo: tarja inclinada na cor de destaque, entra girando um pouco e assenta.
    const { linhas, tamanho } = blocoDeLinhas(estilo, texto, largura * 0.86, altura * 0.72, 112, 40, estreita ? 3 : 2, 1.08);
    const p = molaLeve(t - t0, 0.42, 0.06);
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            backgroundColor: estilo.cor_destaque,
            color: contraste(estilo.cor_destaque),
            fontFamily: estilo.fonte,
            fontWeight: 800,
            fontSize: tamanho,
            lineHeight: 1.08,
            textAlign: "center",
            padding: `${tamanho * 0.14}px ${tamanho * 0.32}px`,
            borderRadius: 14,
            boxShadow: `0 16px 40px rgba(0,0,0,0.4), 0 0 40px ${alfa(estilo.cor_destaque, 0.35)}`,
            opacity: Math.min(1, Math.max(0, (t - t0) / 0.1)),
            scale: String(lerp(0.4, 1, p)),
            rotate: `${lerp(-14, -4, p)}deg`,
            whiteSpace: "nowrap",
          }}
        >
          {linhas.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>
    );
  }

  // Palavra solta: o maior tamanho que cabe; ícone opcional à esquerda (caixa larga) ou em cima.
  const reservaIcone = icone ? (estreita ? 0.32 : 0.22) : 0;
  const { linhas, tamanho } = blocoDeLinhas(
    estilo,
    texto,
    largura * (estreita ? 1 : 1 - reservaIcone) - 24,
    altura * (estreita ? 1 - reservaIcone : 1) - 12,
    160,
    40,
    estreita ? 3 : 2,
  );
  const tamIcone = icone ? Math.min(tamanho * 1.05, estreita ? largura * 0.6 : altura * 0.8) : 0;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: estreita ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: tamanho * 0.22,
        ...estiloEntrada(t, t0, entradaDe(n), 0.4),
      }}
    >
      {icone ? (
        <div style={{ filter: `drop-shadow(0 6px 18px rgba(0,0,0,0.6)) drop-shadow(0 0 18px ${alfa(estilo.cor_destaque, 0.45)})` }}>
          <Icone nome={icone} tamanho={tamIcone} cor={estilo.cor_destaque} traco={2.4} />
        </div>
      ) : null}
      <div style={{ fontFamily: estilo.fonte, fontWeight: 800, fontSize: tamanho, lineHeight: 1.02, textAlign: "center", color: estilo.cor_destaque, whiteSpace: "nowrap", ...contornoTexto(estilo, tamanho) }}>
        {linhas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};
