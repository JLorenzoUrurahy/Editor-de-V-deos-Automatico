// oferta: preços de referência aparecem e são riscados um a um; o preço da oferta
// entra "carimbado" na cor de destaque, com o rótulo embaixo. Tudo centrado como bloco.
// props: { de?: string[], por: string, rotulo?: string, em_por: number, em_rotulo?: number }
import type React from "react";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";

const VERMELHO = "#FF4D4F";
const CARIMBO = 1.15; // escala de entrada do preço: o tamanho já desconta, para não sair da área nem no primeiro quadro

export const Oferta: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const de = (props.de as string[] | undefined) ?? [];
  const por = props.por as string;
  const rotulo = props.rotulo as string | undefined;
  const emPor = (props.em_por as number) ?? 0.6;
  const emRotulo = (props.em_rotulo as number | undefined) ?? emPor + 0.3;
  exigirDeclarados("oferta", textos, [...de, por, rotulo]);

  const colunas = de.length > 2 ? 2 : Math.max(1, de.length);
  const linhas = Math.ceil(de.length / colunas);
  const larguraTag = (largura - 24 * (colunas - 1)) / colunas;
  const tamTag = Math.min(58, ...de.map((d) => caber(estilo, d, larguraTag - 60, 58)));
  const alturaTag = tamTag * 1.55;
  const blocoTags = de.length ? linhas * alturaTag + (linhas - 1) * 16 : 0;
  const tamPor = caber(estilo, por, (largura - 48) / CARIMBO, 240, 90);
  const tamRotulo = rotulo ? caber(estilo, caixa(rotulo, estilo), largura - 16, 50) : 0;
  const alturaBloco = blocoTags + (de.length ? 36 : 0) + tamPor * 1.05 + (rotulo ? 14 + tamRotulo * 1.2 : 0);
  const topo = Math.max(0, (altura - alturaBloco) / 2);
  const yPor = topo + blocoTags + (de.length ? 36 : 0);
  const inicioRisco = Math.max(0.35, emPor - 0.3 - 0.14 * de.length);
  const carimbo = molaSemOvershoot(t - emPor, 0.32);
  const recua = molaSemOvershoot(t - emPor, 0.4);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {de.map((d, i) => {
        const c = i % colunas;
        const r = Math.floor(i / colunas);
        const aparece = entra(t, 0.12 + 0.1 * i, 0.32);
        const risco = molaSemOvershoot(t - (inicioRisco + 0.14 * i), 0.22);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c * (larguraTag + 24),
              top: topo + r * (alturaTag + 16),
              width: larguraTag,
              height: alturaTag,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              border: `2px solid ${alfa("#FFFFFF", 0.25)}`,
              backgroundColor: alfa("#FFFFFF", 0.06),
              color: estilo.cor_texto,
              fontSize: tamTag,
              opacity: aparece * lerp(1, 0.45, risco),
              transform: `translateY(${lerp(20, 0, aparece)}px) scale(${lerp(1, 0.94, recua)})`,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ position: "relative" }}>
              {d}
              <span style={{ position: "absolute", left: "-6%", top: "52%", width: `${112 * risco}%`, height: 7, marginTop: -3.5, backgroundColor: VERMELHO, borderRadius: 4, transform: "rotate(-8deg)", transformOrigin: "left center" }} />
            </span>
          </div>
        );
      })}
      {t >= emPor ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: yPor,
            width: largura,
            textAlign: "center",
            fontSize: tamPor,
            lineHeight: 1.05,
            color: estilo.cor_destaque,
            textShadow: `0 0 60px ${alfa(estilo.cor_destaque, 0.55)}`,
            transform: `scale(${lerp(CARIMBO, 1, carimbo)})`,
            opacity: Math.min(1, (t - emPor) / 0.06),
            whiteSpace: "nowrap",
          }}
        >
          {por}
        </div>
      ) : null}
      {rotulo && t >= emRotulo ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: yPor + tamPor * 1.05 + 14,
            width: largura,
            textAlign: "center",
            fontSize: tamRotulo,
            color: estilo.cor_texto,
            letterSpacing: 3,
            opacity: entra(t, emRotulo, 0.3),
            transform: `translateY(${lerp(16, 0, entra(t, emRotulo, 0.3))}px)`,
            whiteSpace: "nowrap",
          }}
        >
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
    </div>
  );
};
