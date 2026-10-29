// numero_pop: um número dito conta rápido e chega ao valor exato no instante em que é
// falado, grande, na cor de destaque, com contorno; rótulo pequeno embaixo. Ao chegar,
// dá um único "toque" de escala e para.
// props: { texto: string ("R$ 79", "87%", "+30", "3 mil"), rotulo?: string, em: number }
import type React from "react";
import { lerp, molaSemOvershoot } from "../../motor/molas";
import { caber, caixa, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { textoContando } from "../dados/comum";
import { contornoTexto, entradaDe, estiloEntrada } from "./comum";

const CONTAGEM_S = 0.6;

export const NumeroPop: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos, n }) => {
  const texto = props.texto as string;
  const rotulo = props.rotulo as string | undefined;
  const em = (props.em as number | undefined) ?? CONTAGEM_S + 0.1;
  exigirDeclarados("numero_pop", textos, [texto, rotulo]);
  const inicio = Math.max(0, em - CONTAGEM_S);
  const textoRot = rotulo ? caixa(rotulo, estilo) : "";
  const tamRot = rotulo ? caber(estilo, textoRot, largura - 8, 60, 40) : 0;
  // O toque cresce o número 8% e o contorno passa da letra: o tamanho já desconta os dois para não sair da área.
  const tamNum = caber(estilo, texto, (largura - 24) / 1.08, Math.min(180, (altura - tamRot * 1.25) / 1.05), 48);
  // Caixa com a largura do texto final, alinhada à esquerda: os dígitos contando não
  // empurram o prefixo ("R$") para os lados.
  const larguraFinal = medir(estilo, texto, tamNum);
  const p = molaSemOvershoot(t - inicio, CONTAGEM_S * 0.9);
  const toque = t >= em ? 1 + 0.08 * (1 - molaSemOvershoot(t - em, 0.3)) : 1;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...estiloEntrada(t, inicio, entradaDe(n), 0.35) }}>
      <div
        style={{
          width: larguraFinal + 4,
          fontFamily: estilo.fonte,
          fontWeight: 800,
          fontSize: tamNum,
          lineHeight: 1.05,
          color: estilo.cor_destaque,
          whiteSpace: "nowrap",
          scale: String(toque),
          ...contornoTexto(estilo, tamNum),
        }}
      >
        {t >= em ? texto : textoContando(texto, p)}
      </div>
      {rotulo ? (
        <div
          style={{
            fontFamily: estilo.fonte,
            fontWeight: 800,
            fontSize: tamRot,
            lineHeight: 1.2,
            letterSpacing: 3,
            color: estilo.cor_texto,
            whiteSpace: "nowrap",
            opacity: Math.min(1, Math.max(0, (t - em + 0.15) / 0.2)),
            translate: `0px ${lerp(14, 0, molaSemOvershoot(t - em + 0.15, 0.3))}px`,
            ...contornoTexto(estilo, tamRot),
          }}
        >
          {textoRot}
        </div>
      ) : null}
    </div>
  );
};
