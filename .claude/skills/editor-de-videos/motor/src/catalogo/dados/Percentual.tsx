// percentual: anel que enche até a porcentagem dita, com o número contando no centro
// e o rótulo embaixo. Com `comparar`, dois anéis lado a lado (o principal em destaque).
// props: { texto: string ("73%"), rotulo?: string, legenda?: string, em: number, duracao?: number,
//          comparar?: { texto: string, legenda?: string, em?: number } }
import type React from "react";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { Estilo } from "../../tipos";
import type { PropsCena } from "../../tipos";
import { alturaRotulo, lerNumero, Rotulo, tamanhoRotulo, textoContando } from "./comum";

type Anel = { texto: string; legenda?: string; em: number };

const AnelPct: React.FC<{ anel: Anel; t: number; diametro: number; estilo: Estilo; principal: boolean; duracao: number }> = ({ anel, t, diametro, estilo, principal, duracao }) => {
  const pct = Math.max(0, Math.min(100, lerNumero(anel.texto)?.valor ?? 0));
  const inicio = anel.em - duracao;
  const p = molaSemOvershoot(t - inicio, duracao);
  const aparece = entra(t, Math.max(0.05, inicio - 0.3), 0.35);
  const traco = Math.max(22, diametro * 0.085);
  const r = (diametro - traco) / 2;
  const c = 2 * Math.PI * r;
  const cor = principal ? estilo.cor_destaque : alfa("#FFFFFF", 0.75);
  const tamNum = caber(estilo, anel.texto, diametro - traco * 3.4, diametro * 0.26, 44);
  const tamLeg = anel.legenda ? caber(estilo, caixa(anel.legenda, estilo), diametro * 1.15, 46, 40) : 0;
  const batida = t >= anel.em ? 1 - molaSemOvershoot(t - anel.em, 0.3) : 0;
  return (
    <div style={{ position: "relative", width: diametro, opacity: aparece, scale: String(lerp(0.9, 1, aparece)) }}>
      <div style={{ position: "relative", width: diametro, height: diametro }}>
        <svg width={diametro} height={diametro} style={{ position: "absolute", left: 0, top: 0, rotate: "-90deg" }}>
          <circle cx={diametro / 2} cy={diametro / 2} r={r} fill="none" stroke={alfa("#FFFFFF", 0.1)} strokeWidth={traco} />
          <circle
            cx={diametro / 2}
            cy={diametro / 2}
            r={r}
            fill="none"
            stroke={cor}
            strokeWidth={traco}
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - (pct / 100) * p)}
            style={{ filter: principal ? `drop-shadow(0 0 ${lerp(16, 26, batida)}px ${alfa(estilo.cor_destaque, 0.6)})` : "none" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: tamNum, color: principal ? estilo.cor_destaque : estilo.cor_texto, scale: String(1 + 0.05 * batida), whiteSpace: "nowrap" }}>
          {textoContando(anel.texto, p)}
        </div>
      </div>
      {anel.legenda ? (
        <div style={{ position: "absolute", left: -diametro * 0.1, top: diametro + 16, width: diametro * 1.2, textAlign: "center", fontSize: tamLeg, color: alfa("#FFFFFF", principal ? 1 : 0.8), whiteSpace: "nowrap", opacity: entra(t, anel.em - 0.2, 0.35) }}>
          {caixa(anel.legenda, estilo)}
        </div>
      ) : null}
    </div>
  );
};

export const Percentual: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const texto = props.texto as string;
  const rotulo = props.rotulo as string | undefined;
  const legenda = props.legenda as string | undefined;
  const em = (props.em as number | undefined) ?? 1.4;
  const duracao = Math.min((props.duracao as number | undefined) ?? 1.1, Math.max(0.4, em - 0.25));
  const comparar = props.comparar as { texto: string; legenda?: string; em?: number } | undefined;
  exigirDeclarados("percentual", textos, [texto, rotulo, legenda, comparar?.texto, comparar?.legenda]);

  const tamRot = tamanhoRotulo(estilo, rotulo, largura);
  const temLegenda = Boolean(legenda || comparar?.legenda);
  const espacoLegenda = temLegenda ? 16 + 46 * 1.25 : 0;
  const topoArea = alturaRotulo(tamRot) + (tamRot ? 24 : 0);
  const disponivel = altura - topoArea - espacoLegenda;
  const dois = Boolean(comparar);
  const diametro = Math.min(disponivel, dois ? (largura - 70) / 2 : largura * 0.7, 460);
  const bloco = topoArea + diametro + espacoLegenda;
  const topo = Math.max(0, (altura - bloco) / 2);
  const principal: Anel = { texto, legenda, em };

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? <Rotulo texto={rotulo} t={t} topo={topo} largura={largura} tamanho={tamRot} estilo={estilo} /> : null}
      <div style={{ position: "absolute", left: 0, top: topo + topoArea, width: largura, display: "flex", justifyContent: "center", gap: 70 }}>
        {comparar ? <AnelPct anel={{ texto: comparar.texto, legenda: comparar.legenda, em: comparar.em ?? em }} t={t} diametro={diametro} estilo={estilo} principal={false} duracao={duracao} /> : null}
        <AnelPct anel={principal} t={t} diametro={diametro} estilo={estilo} principal duracao={duracao} />
      </div>
    </div>
  );
};
