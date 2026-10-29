// palavra_atras: palavra gigante ATRÁS da pessoa (layout "atras": a pessoa recortada
// fica na frente). A caixa é uma faixa de largura total na altura da cabeça; a palavra
// ocupa quase a largura toda, centralizada. Segunda linha opcional, menor, EM CIMA
// (embaixo a cabeça a cobriria).
//   destaque: cor de destaque; branco: branco translúcido; contorno: só o traço.
// Entra de um de três jeitos (pela ordem da cena): crescendo com desfoque, subindo de
// trás de uma linha, ou letra a letra. Depois fica parada.
// props: { texto: string, linha2?: string, variante?: "destaque" | "branco" | "contorno", em?: number }
import type React from "react";
import { clamp01, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";

export const PalavraAtras: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos, n }) => {
  const texto = props.texto as string;
  const linha2 = props.linha2 as string | undefined;
  const variante = (props.variante as string | undefined) ?? "destaque";
  const em = (props.em as number | undefined) ?? 0.15;
  exigirDeclarados("palavra_atras", textos, [texto, linha2]);
  const t0 = Math.max(0, em - 0.1);
  const palavra = caixa(texto, estilo);
  const textoL2 = linha2 ? caixa(linha2, estilo) : "";
  const tamL2 = linha2 ? caber(estilo, textoL2, largura * 0.86, Math.min(84, altura * 0.2), 40) : 0;
  const tam = caber(estilo, palavra, largura * 0.96, (altura - (linha2 ? tamL2 * 1.2 : 0)) / 0.86, 120);

  const cor =
    variante === "branco" ? alfa("#FFFFFF", 0.9) : variante === "contorno" ? "transparent" : estilo.cor_destaque;
  const traco = variante === "contorno" ? { WebkitTextStroke: `${Math.max(8, tam * 0.035)}px ${estilo.cor_destaque}` } : {};
  const jeito = (((n ?? 0) % 3) + 3) % 3;
  const p = molaSemOvershoot(t - t0, 0.5);

  const base: React.CSSProperties = {
    fontFamily: estilo.fonte,
    fontWeight: 800,
    fontSize: tam,
    lineHeight: 0.86,
    letterSpacing: -tam * 0.02,
    color: cor,
    whiteSpace: "nowrap",
    textShadow: variante === "contorno" ? "none" : "0 12px 40px rgba(0,0,0,0.35)",
    ...traco,
  };

  let conteudo: React.ReactNode;
  if (jeito === 2) {
    // letra a letra, subindo
    conteudo = (
      <div style={base}>
        {[...palavra].map((l, i) => {
          const q = molaSemOvershoot(t - t0 - i * 0.035, 0.35);
          return (
            <span key={i} style={{ display: "inline-block", opacity: clamp01((t - t0 - i * 0.035) / 0.1), translate: `0px ${lerp(tam * 0.35, 0, q)}px` }}>
              {l === " " ? " " : l}
            </span>
          );
        })}
      </div>
    );
  } else if (jeito === 1) {
    // sobe de trás de uma linha invisível (recorte na base da palavra)
    conteudo = (
      <div style={{ overflow: "hidden", paddingTop: tam * 0.08 }}>
        <div style={{ ...base, translate: `0px ${lerp(tam * 0.95, 0, p)}px` }}>{palavra}</div>
      </div>
    );
  } else {
    // cresce do fundo com desfoque
    conteudo = <div style={{ ...base, opacity: clamp01((t - t0) / 0.15), scale: String(lerp(1.18, 1, p)), filter: `blur(${lerp(14, 0, p)}px)` }}>{palavra}</div>;
  }

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {linha2 ? (
        <div
          style={{
            marginBottom: tamL2 * 0.2,
            fontFamily: estilo.fonte,
            fontWeight: 800,
            fontSize: tamL2,
            lineHeight: 1.1,
            letterSpacing: 4,
            color: alfa("#FFFFFF", 0.92),
            whiteSpace: "nowrap",
            textShadow: "0 6px 22px rgba(0,0,0,0.5)",
            opacity: clamp01((t - t0 - 0.25) / 0.2),
            translate: `0px ${lerp(-16, 0, molaSemOvershoot(t - t0 - 0.25, 0.35))}px`,
          }}
        >
          {textoL2}
        </div>
      ) : null}
      {conteudo}
    </div>
  );
};
