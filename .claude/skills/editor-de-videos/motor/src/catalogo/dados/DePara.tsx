// de_para: "de 8 horas para 15 minutos", "de 2 para 20 clientes". O valor de antes
// entra com uma barra cheia; no `em_para` o valor novo entra em destaque e a barra
// dele encolhe (ou cresce) até a proporção real entre os dois.
// Converte unidades de tempo (segundos a anos) e "mil"/"milhões" para achar a proporção;
// sem como comparar, use `variante` ("reduz" | "aumenta").
// props: { de: string, para: string, rotulo?: string, legenda_de?: string, legenda_para?: string,
//          em_de?: number, em_para: number, variante?: "reduz" | "aumenta" }
import type React from "react";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { alturaRotulo, lerNumero, Rotulo, tamanhoRotulo } from "./comum";

const UNIDADES: [RegExp, number][] = [
  [/^\s*(s|seg|segundos?)\b/i, 1],
  [/^\s*(min|minutos?)\b/i, 60],
  [/^\s*(h|hrs?|horas?)\b/i, 3600],
  [/^\s*(dias?)\b/i, 86400],
  [/^\s*(semanas?)\b/i, 604800],
  [/^\s*(m[eê]s|meses)\b/i, 2592000],
  [/^\s*(anos?)\b/i, 31536000],
  [/^\s*(mil)\b/i, 1e3],
  [/^\s*(milh(ão|ao|ões|oes)|mi)\b/i, 1e6],
];

/** Valor comparável: número do texto vezes a unidade que vem depois dele. */
function grandeza(texto: string): { v: number; tempo: boolean } | null {
  const n = lerNumero(texto);
  if (!n) return null;
  for (const [re, f] of UNIDADES) {
    if (re.test(n.depois)) return { v: n.valor * f, tempo: f <= 31536000 && !/mil|milh|mi\b/i.test(n.depois) };
  }
  return { v: n.valor, tempo: false };
}

export const DePara: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const de = props.de as string;
  const para = props.para as string;
  const rotulo = props.rotulo as string | undefined;
  const legDe = props.legenda_de as string | undefined;
  const legPara = props.legenda_para as string | undefined;
  const emPara = (props.em_para as number | undefined) ?? 1.6;
  const emDe = Math.min((props.em_de as number | undefined) ?? 0.25, emPara - 0.4);
  exigirDeclarados("de_para", textos, [de, para, rotulo, legDe, legPara]);

  const a = grandeza(de);
  const b = grandeza(para);
  let razao = a && b && a.v > 0 && a.tempo === b.tempo ? b.v / a.v : NaN;
  if (!Number.isFinite(razao)) razao = props.variante === "aumenta" ? 3 : 0.3;
  // A barra maior ocupa a largura toda; a outra fica na proporção (com um mínimo visível).
  const larguraDe = razao > 1 ? Math.max(0.04, 1 / razao) : 1;
  const larguraPara = razao > 1 ? 1 : Math.max(0.035, razao);

  const tamRot = tamanhoRotulo(estilo, rotulo, largura);
  const tamLeg = Math.max(40, Math.min(46, ...[legDe, legPara].filter(Boolean).map((l) => caber(estilo, caixa(l as string, estilo), largura, 46, 40))));
  const tamDe = caber(estilo, de, largura, Math.min(84, altura * 0.13), 48);
  const tamPara = caber(estilo, para, largura, Math.min(120, altura * 0.18), 56);
  const barra = Math.max(22, Math.min(34, altura * 0.05));
  const linhaDe = (legDe ? tamLeg * 1.25 + 4 : 0) + tamDe * 1.1 + 14 + barra;
  const linhaPara = (legPara ? tamLeg * 1.25 + 4 : 0) + tamPara * 1.1 + 14 + barra;
  const gap = Math.max(34, Math.min(70, altura * 0.08));
  const topoArea = alturaRotulo(tamRot) + (tamRot ? 28 : 0);
  const bloco = topoArea + linhaDe + gap + linhaPara;
  const topo = Math.max(0, (altura - bloco) / 2);
  const yDe = topo + topoArea;
  const yPara = yDe + linhaDe + gap;

  const pDe = entra(t, emDe, 0.4);
  const barraDe = molaSemOvershoot(t - emDe - 0.1, 0.5);
  const pPara = entra(t, emPara - 0.05, 0.35);
  // A barra nova nasce do tamanho da antiga e vai para a proporção real: a redução se vê.
  const muda = molaSemOvershoot(t - emPara, 0.9);
  const esmaece = entra(t, emPara, 0.4);
  const wPara = lerp(larguraDe, larguraPara, muda);

  const Linha = (y: number, leg: string | undefined, valor: string, tam: number, frac: number, ativo: boolean, opac: number, mostrar: boolean) => (
    <div style={{ position: "absolute", left: 0, top: y, width: largura, opacity: opac }}>
      {leg ? <div style={{ fontSize: tamLeg, lineHeight: 1.25, letterSpacing: 3, color: ativo ? estilo.cor_destaque : alfa("#FFFFFF", 0.65), whiteSpace: "nowrap" }}>{caixa(leg, estilo)}</div> : null}
      <div style={{ marginTop: leg ? 4 : 0, fontSize: tam, lineHeight: 1.1, color: ativo ? estilo.cor_destaque : estilo.cor_texto, textShadow: ativo ? `0 0 44px ${alfa(estilo.cor_destaque, 0.5)}` : "none", whiteSpace: "nowrap" }}>{valor}</div>
      <div style={{ position: "relative", marginTop: 14, width: largura, height: barra, borderRadius: barra / 2, backgroundColor: alfa("#FFFFFF", 0.08) }}>
        {mostrar ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: barra,
              width: Math.max(barra, largura * frac),
              borderRadius: barra / 2,
              background: ativo ? `linear-gradient(90deg, ${alfa(estilo.cor_destaque, 0.75)}, ${estilo.cor_destaque})` : `linear-gradient(90deg, ${alfa("#FFFFFF", 0.2)}, ${alfa("#FFFFFF", 0.42)})`,
              boxShadow: ativo ? `0 0 34px ${alfa(estilo.cor_destaque, 0.5)}` : "none",
            }}
          />
        ) : null}
      </div>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? <Rotulo texto={rotulo} t={t} topo={topo} largura={largura} tamanho={tamRot} estilo={estilo} /> : null}
      {Linha(yDe, legDe, de, tamDe, larguraDe * barraDe, false, pDe * lerp(1, 0.55, esmaece), barraDe > 0)}
      {t >= emPara - 0.05 ? (
        <div style={{ position: "absolute", inset: 0, translate: `0px ${lerp(24, 0, pPara)}px` }}>{Linha(yPara, legPara, para, tamPara, wPara, true, pPara, true)}</div>
      ) : null}
    </div>
  );
};
