// barras: compara itens ditos ("Vídeo 62%, Carrossel 25%, Foto 13%"). Cada barra
// cresce quando o item é falado e o valor conta junto. Um item fica em destaque
// (o marcado com destaque: true; sem marcação, o maior).
// Horizontal (padrão): nome à esquerda, valor à direita, barra embaixo; aguenta nomes longos.
// Vertical: colunas com o nome embaixo; para 2 a 5 itens de nome curto.
// props: { rotulo?: string, variante?: "horizontal" | "vertical",
//          itens: { rotulo: string, texto: string, valor?: number, em: number, destaque?: boolean }[] }
import type React from "react";
import { entra, lerp, molaLeve } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { Estilo, PropsCena } from "../../tipos";
import { alturaRotulo, Rotulo, tamanhoRotulo, textoContando, valorDe } from "./comum";

type Item = { rotulo: string; texto: string; valor?: number; em: number; destaque?: boolean };

const corBarra = (estilo: Estilo, destaque: boolean) =>
  destaque ? `linear-gradient(90deg, ${alfa(estilo.cor_destaque, 0.75)}, ${estilo.cor_destaque})` : `linear-gradient(90deg, ${alfa("#FFFFFF", 0.18)}, ${alfa("#FFFFFF", 0.38)})`;

export const Barras: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  // Item sem `em` entra escalonado (0,35 s entre um e outro).
  const itens = ((props.itens as Item[]) ?? []).map((it, k) => ({ ...it, em: typeof it.em === "number" ? it.em : 0.4 + 0.35 * k }));
  const rotulo = props.rotulo as string | undefined;
  const vertical = props.variante === "vertical";
  exigirDeclarados("barras", textos, [rotulo, ...itens.flatMap((i) => [i.rotulo, i.texto])]);

  const valores = itens.map(valorDe);
  const vMax = Math.max(...valores, 1e-9);
  const algumMarcado = itens.some((i) => i.destaque);
  const iMax = valores.indexOf(Math.max(...valores));
  const ehDestaque = (k: number) => (algumMarcado ? Boolean(itens[k].destaque) : k === iMax);
  const tamRot = tamanhoRotulo(estilo, rotulo, largura);
  const topoArea = alturaRotulo(tamRot) + (tamRot ? 26 : 0);
  const area = altura - topoArea;
  const n = Math.max(1, itens.length);

  if (vertical) {
    const gap = 34;
    const slot = (largura - gap * (n - 1)) / n;
    const barW = Math.min(150, slot * 0.82);
    const tamNome = Math.max(40, Math.min(48, ...itens.map((i) => caber(estilo, caixa(i.rotulo, estilo), slot + gap * 0.6, 48, 40))));
    const tamValor = Math.max(40, Math.min(60, ...itens.map((i) => caber(estilo, i.texto, slot + gap * 0.6, 60, 40))));
    const base = altura - tamNome * 1.35;
    const hMax = base - topoArea - tamValor * 1.45;
    return (
      <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
        {rotulo ? <Rotulo texto={rotulo} t={t} topo={0} largura={largura} tamanho={tamRot} estilo={estilo} /> : null}
        <div style={{ position: "absolute", left: 0, top: base, width: largura, height: 3, borderRadius: 2, backgroundColor: alfa("#FFFFFF", 0.25), opacity: entra(t, 0.1, 0.4) }} />
        {itens.map((it, k) => {
          if (t < it.em - 0.15) return null;
          const cx = k * (slot + gap) + slot / 2;
          const cresce = molaLeve(t - it.em, 0.55, 0.05);
          const h = Math.max(0.06, valores[k] / vMax) * hMax * cresce;
          const nome = entra(t, it.em - 0.15, 0.3);
          const d = ehDestaque(k);
          return (
            <div key={k}>
              <div style={{ position: "absolute", left: cx - barW / 2, top: base - h, width: barW, height: h, borderRadius: "18px 18px 4px 4px", background: d ? `linear-gradient(180deg, ${estilo.cor_destaque}, ${alfa(estilo.cor_destaque, 0.6)})` : `linear-gradient(180deg, ${alfa("#FFFFFF", 0.34)}, ${alfa("#FFFFFF", 0.1)})`, boxShadow: d ? `0 0 46px ${alfa(estilo.cor_destaque, 0.45)}` : "none" }} />
              <div style={{ position: "absolute", left: cx - (slot + gap) / 2, top: base - h - tamValor * 1.3, width: slot + gap, textAlign: "center", fontSize: tamValor, color: d ? estilo.cor_destaque : estilo.cor_texto, opacity: Math.min(1, cresce * 2), whiteSpace: "nowrap" }}>
                {textoContando(it.texto, Math.min(1, cresce))}
              </div>
              <div style={{ position: "absolute", left: cx - (slot + gap) / 2, top: base + tamNome * 0.25, width: slot + gap, textAlign: "center", fontSize: tamNome, color: alfa("#FFFFFF", d ? 1 : 0.8), opacity: nome, whiteSpace: "nowrap" }}>
                {caixa(it.rotulo, estilo)}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal: linhas de altura fixa, bloco centrado na área que sobra.
  const linhaMax = Math.min(170, area / n);
  const tamNome = Math.max(40, Math.min(52, linhaMax * 0.34));
  const alturaBarra = Math.max(18, Math.min(34, linhaMax * 0.22));
  const gapLinha = Math.max(14, linhaMax - (tamNome * 1.2 + 12 + alturaBarra));
  const alturaLinha = tamNome * 1.2 + 12 + alturaBarra;
  const bloco = n * alturaLinha + (n - 1) * gapLinha;
  const topo = topoArea + Math.max(0, (area - bloco) / 2);
  const tamValor = Math.max(40, Math.min(tamNome * 1.22, ...itens.map((i) => caber(estilo, i.texto, largura * 0.32, 64, 40))));

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? <Rotulo texto={rotulo} t={t} topo={Math.max(0, topo - topoArea)} largura={largura} tamanho={tamRot} estilo={estilo} /> : null}
      {itens.map((it, k) => {
        const y = topo + k * (alturaLinha + gapLinha);
        const nome = entra(t, it.em - 0.15, 0.3);
        const cresce = molaLeve(t - it.em, 0.6, 0.05);
        const d = ehDestaque(k);
        const larguraNome = largura * 0.66;
        const tamN = caber(estilo, caixa(it.rotulo, estilo), larguraNome, tamNome, 40);
        return (
          <div key={k} style={{ opacity: t < it.em - 0.15 ? 0 : 1 }}>
            <div style={{ position: "absolute", left: 0, top: y, width: larguraNome, fontSize: tamN, lineHeight: 1.2, color: alfa("#FFFFFF", d ? 1 : 0.82), opacity: nome, translate: `${lerp(-16, 0, nome)}px 0px`, whiteSpace: "nowrap" }}>
              {caixa(it.rotulo, estilo)}
            </div>
            <div style={{ position: "absolute", right: 0, top: y + (tamNome * 1.2 - tamValor * 1.2) / 2, fontSize: tamValor, lineHeight: 1.2, color: d ? estilo.cor_destaque : estilo.cor_texto, opacity: Math.min(1, cresce * 2), whiteSpace: "nowrap", textShadow: d ? `0 0 30px ${alfa(estilo.cor_destaque, 0.45)}` : "none" }}>
              {textoContando(it.texto, Math.min(1, cresce))}
            </div>
            <div style={{ position: "absolute", left: 0, top: y + tamNome * 1.2 + 12, width: largura, height: alturaBarra, borderRadius: alturaBarra / 2, backgroundColor: alfa("#FFFFFF", 0.08), opacity: nome }} />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: y + tamNome * 1.2 + 12,
                width: Math.max(alturaBarra, (largura * Math.max(0.03, valores[k] / vMax)) * cresce),
                height: alturaBarra,
                borderRadius: alturaBarra / 2,
                background: corBarra(estilo, d),
                boxShadow: d ? `0 0 34px ${alfa(estilo.cor_destaque, 0.45)}` : "none",
                opacity: cresce > 0 ? 1 : 0,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
