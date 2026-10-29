// icone_pop: um ícone num círculo na cor de destaque salta no espaço livre ao redor
// do rosto, com brilho, e o rótulo entra logo depois (ao lado, se a caixa for larga;
// embaixo, se for estreita). Acento para "ideia", "dinheiro", "celular", "tempo"...
// props: { icone: string, rotulo?: string, em?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { lerp, molaLeve } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { contornoTexto, entradaDe, estiloEntrada } from "./comum";

export const IconePop: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos, n }) => {
  const icone = props.icone as string;
  const rotulo = props.rotulo as string | undefined;
  const em = (props.em as number | undefined) ?? 0.15;
  exigirDeclarados("icone_pop", textos, [rotulo]);
  const t0 = Math.max(0, em - 0.1);
  const aoLado = Boolean(rotulo) && largura >= altura * 2;
  const textoRot = rotulo ? caixa(rotulo, estilo) : "";

  // Círculo: o maior que deixa espaço para o rótulo.
  let d: number;
  let tamRot = 0;
  if (!rotulo) {
    d = Math.min(altura, largura, 220);
  } else if (aoLado) {
    d = Math.min(altura * 0.92, 200);
    tamRot = caber(estilo, textoRot, largura - d - 40, Math.min(96, d * 0.6), 40);
  } else {
    tamRot = caber(estilo, textoRot, largura - 8, 72, 40);
    d = Math.min(largura * 0.9, altura - tamRot * 1.3 - 16, 220);
  }
  const p = molaLeve(t - t0, 0.45, 0.08);
  const rot = estiloEntrada(t, t0 + 0.12, entradaDe(n, 1), 0.38);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: aoLado ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: aoLado ? 26 : 14,
      }}
    >
      <div
        style={{
          width: d,
          height: d,
          flexShrink: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${alfa("#FFFFFF", 0.35)}, transparent 55%), ${estilo.cor_destaque}`,
          border: `4px solid ${alfa("#FFFFFF", 0.55)}`,
          boxShadow: `0 14px 36px rgba(0,0,0,0.45), 0 0 ${d * 0.35}px ${alfa(estilo.cor_destaque, 0.55)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: Math.min(1, Math.max(0, (t - t0) / 0.08)),
          scale: String(lerp(0.3, 1, p)),
          rotate: `${lerp(-18, 0, p)}deg`,
        }}
      >
        <Icone nome={icone} tamanho={d * 0.5} cor={contraste(estilo.cor_destaque)} traco={2.2} />
      </div>
      {rotulo ? (
        <div style={{ fontFamily: estilo.fonte, fontWeight: 800, fontSize: tamRot, lineHeight: 1.05, color: estilo.cor_texto, whiteSpace: "nowrap", ...contornoTexto(estilo, tamRot), ...rot }}>
          {textoRot}
        </div>
      ) : null}
    </div>
  );
};
