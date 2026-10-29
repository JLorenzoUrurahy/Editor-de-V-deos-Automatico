// icone_conceito: um conceito em destaque. Um anel na cor de destaque se desenha,
// o ícone entra no centro e o nome do conceito aparece embaixo, grande.
// props: { icone: string, rotulo: string, apoio?: string, em?: number }
// (`em`: quando o conceito é dito; o anel e o ícone chegam um pouco antes)
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";

export const IconeConceito: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const icone = props.icone as string;
  const rotulo = props.rotulo as string;
  const apoio = props.apoio as string | undefined;
  const em = (props.em as number | undefined) ?? 0.5;
  exigirDeclarados("icone_conceito", textos, [rotulo, apoio]);
  // Rótulo longo quebra em duas linhas equilibradas em vez de encolher demais.
  const max = altura >= 800 ? 104 : 84;
  const palavras = caixa(rotulo, estilo).split(" ");
  let linhas = [palavras.join(" ")];
  let tamRotulo = caber(estilo, linhas[0], largura, max, 48);
  if (palavras.length >= 2 && tamRotulo < max * 0.75) {
    let melhor = { linhas, tam: tamRotulo };
    for (let k = 1; k < palavras.length; k++) {
      const duas = [palavras.slice(0, k).join(" "), palavras.slice(k).join(" ")];
      const tam = Math.min(...duas.map((l) => caber(estilo, l, largura, max, 48)));
      if (tam > melhor.tam) melhor = { linhas: duas, tam };
    }
    linhas = melhor.linhas;
    tamRotulo = melhor.tam;
  }
  const tamApoio = apoio ? caber(estilo, caixa(apoio, estilo), largura, 46, 40) : 0;
  const textoAltura = tamRotulo * 1.15 * linhas.length + (apoio ? 10 + tamApoio * 1.25 : 0);
  const d = Math.min(largura * 0.5, altura - textoAltura - 36, 380);
  const alturaBloco = d + 36 + textoAltura;
  const topo = (altura - alturaBloco) / 2;
  const t0 = Math.max(0, em - 0.35);
  const anel = molaSemOvershoot(t - t0, 0.6);
  const pop = molaLeve(t - t0 - 0.12, 0.5, 0.06);
  const rot = entra(t, em, 0.38);
  const apo = entra(t, em + 0.25, 0.35);
  const r = d / 2 - 6;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      <div style={{ position: "absolute", left: (largura - d) / 2, top: topo, width: d, height: d }}>
        <div style={{ position: "absolute", inset: d * 0.08, borderRadius: "50%", background: `radial-gradient(circle, ${alfa(estilo.cor_destaque, 0.3)}, ${alfa(estilo.cor_destaque, 0.04)} 70%)`, opacity: anel }} />
        <svg width={d} height={d} style={{ position: "absolute", left: 0, top: 0, transform: "rotate(-90deg)" }}>
          <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={alfa("#FFFFFF", 0.12)} strokeWidth={6} />
          <circle cx={d / 2} cy={d / 2} r={r} fill="none" stroke={estilo.cor_destaque} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - anel} style={{ filter: `drop-shadow(0 0 14px ${alfa(estilo.cor_destaque, 0.7)})` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${lerp(0.4, 1, pop)})`, opacity: Math.min(1, Math.max(0, (t - t0 - 0.12) / 0.12)), filter: `drop-shadow(0 0 24px ${alfa(estilo.cor_destaque, 0.55)})` }}>
          <Icone nome={icone} tamanho={d * 0.46} cor={estilo.cor_destaque} traco={1.8} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, top: topo + d + 36, width: largura, textAlign: "center", fontSize: tamRotulo, lineHeight: 1.15, color: estilo.cor_texto, opacity: rot, transform: `translateY(${lerp(20, 0, rot)}px)`, whiteSpace: "nowrap" }}>
        {linhas.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      {apoio ? (
        <div style={{ position: "absolute", left: 0, top: topo + d + 36 + tamRotulo * 1.15 * linhas.length + 10, width: largura, textAlign: "center", fontSize: tamApoio, lineHeight: 1.25, color: alfa("#FFFFFF", 0.7), letterSpacing: 2, opacity: apo, whiteSpace: "nowrap" }}>
          {caixa(apoio, estilo)}
        </div>
      ) : null}
    </div>
  );
};
