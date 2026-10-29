// numero: um número dito vira contador grande que termina exatamente no instante
// em que é falado, com rótulo em cima e uma linha de apoio embaixo.
// O número vem do próprio texto dito ("R$ 12.400", "87%", "10x", "3 mil"): prefixo,
// sufixo e casas decimais são os do texto; no fim aparece o texto exato.
// props: { texto: string, rotulo?: string, sub?: string, de?: number, em: number, duracao?: number }
import type React from "react";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { alturaRotulo, Rotulo, tamanhoRotulo, textoContando } from "./comum";

export const Numero: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const texto = props.texto as string;
  const rotulo = props.rotulo as string | undefined;
  const sub = props.sub as string | undefined;
  const de = (props.de as number | undefined) ?? 0;
  const em = (props.em as number | undefined) ?? 1.4;
  const duracao = Math.min((props.duracao as number | undefined) ?? 1.2, Math.max(0.4, em - 0.25));
  exigirDeclarados("numero", textos, [texto, rotulo, sub]);

  const tamRot = tamanhoRotulo(estilo, rotulo, largura);
  // O tamanho do número é o do texto final: a contagem nunca passa da largura.
  const tamNum = caber(estilo, texto, largura * 0.96, Math.min(altura > 800 ? 300 : 240, altura * 0.42), 90);
  const tamSub = sub ? caber(estilo, sub, largura, 60, 40) : 0;
  const hNum = tamNum * 1.08;
  // Caixa com a largura do texto final, alinhada à esquerda: o prefixo ("R$") fica
  // parado e os dígitos crescem para a direita durante a contagem.
  const wFinal = Math.min(largura, medir(estilo, texto, tamNum) * 1.03);
  const bloco = alturaRotulo(tamRot) + (tamRot ? 22 : 0) + hNum + (sub ? 18 + tamSub * 1.25 : 0);
  const topo = Math.max(0, (altura - bloco) / 2);
  const yNum = topo + alturaRotulo(tamRot) + (tamRot ? 22 : 0);

  const inicio = em - duracao;
  const aparece = entra(t, Math.max(0.05, inicio - 0.25), 0.35);
  const p = molaSemOvershoot(t - inicio, duracao);
  const batida = t >= em ? 1 - molaSemOvershoot(t - em, 0.3) : 0; // pequeno "toque" quando o número é dito
  const subP = entra(t, em + 0.15, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? <Rotulo texto={rotulo} t={t} topo={topo} largura={largura} tamanho={tamRot} estilo={estilo} /> : null}
      <div
        style={{
          position: "absolute",
          left: (largura - wFinal) / 2,
          top: yNum,
          width: wFinal,
          height: hNum,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          transformOrigin: "50% 50%",
          fontSize: tamNum,
          lineHeight: 1,
          color: estilo.cor_destaque,
          textShadow: `0 0 ${lerp(44, 70, batida)}px ${alfa(estilo.cor_destaque, lerp(0.5, 0.75, batida))}`,
          opacity: aparece,
          scale: String(lerp(0.92, 1, aparece) * (1 + 0.06 * batida)),
          whiteSpace: "nowrap",
        }}
      >
        {textoContando(texto, p, de)}
      </div>
      {sub ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: yNum + hNum + 18,
            width: largura,
            textAlign: "center",
            fontSize: tamSub,
            lineHeight: 1.25,
            color: estilo.cor_texto,
            opacity: subP,
            translate: `0px ${lerp(14, 0, subP)}px`,
            whiteSpace: "nowrap",
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
