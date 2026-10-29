// tarja: faixa de vidro escuro com título e subtítulo, presa à esquerda da caixa,
// que se revela da esquerda para a direita depois que a barra fina na cor de
// destaque cresce na borda. Para apresentar alguém, um nome, um tema ("o que é",
// "quem sou eu"). Fica parada depois de entrar.
// props: { titulo: string, sub?: string, em?: number }
import type React from "react";
import { clamp01, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { entradaDe } from "./comum";

export const Tarja: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos, n }) => {
  const titulo = props.titulo as string;
  const sub = props.sub as string | undefined;
  const em = (props.em as number | undefined) ?? 0.15;
  exigirDeclarados("tarja", textos, [titulo, sub]);
  const t0 = Math.max(0, em - 0.12);
  const textoTit = caixa(titulo, estilo);
  const textoSub = sub ? caixa(sub, estilo) : "";
  const barra = 10;
  const folga = 34;
  const larguraTexto = largura - barra - folga * 2;
  const tamTit = caber(estilo, textoTit, larguraTexto, Math.min(72, altura / (sub ? 2.4 : 1.6)), 40);
  const tamSub = sub ? caber(estilo, textoSub, larguraTexto, Math.min(46, tamTit * 0.7), 40) : 0;
  const alturaFaixa = Math.min(altura, tamTit * 1.15 + (sub ? tamSub * 1.25 + 6 : 0) + 44);

  // Duas variações pela ordem da cena: revelar da esquerda ou subir com a barra.
  const revela = entradaDe(n) !== "subir";
  const pBarra = molaSemOvershoot(t - t0, 0.22);
  const pCorpo = molaSemOvershoot(t - t0 - 0.12, 0.42);
  const pSub = molaSemOvershoot(t - t0 - 0.3, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
      <div style={{ position: "relative", height: alturaFaixa, display: "flex", translate: revela ? "0px 0px" : `0px ${lerp(30, 0, pCorpo)}px` }}>
        <div style={{ width: barra, height: alturaFaixa * pBarra, alignSelf: "center", backgroundColor: estilo.cor_destaque, borderRadius: 3, boxShadow: `0 0 20px ${alfa(estilo.cor_destaque, 0.55)}` }} />
        <div
          style={{
            marginLeft: 6,
            backgroundColor: alfa(estilo.cor_fundo, 0.7),
            backdropFilter: "blur(14px)",
            borderRadius: "0 18px 18px 0",
            border: `1.5px solid ${alfa("#FFFFFF", 0.14)}`,
            borderLeft: "none",
            boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
            padding: `0 ${folga}px`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            fontFamily: estilo.fonte,
            fontWeight: 800,
            whiteSpace: "nowrap",
            clipPath: revela ? `inset(0 ${100 * (1 - pCorpo)}% 0 0)` : undefined,
            opacity: revela ? 1 : clamp01((t - t0 - 0.12) / 0.15),
          }}
        >
          <div style={{ fontSize: tamTit, lineHeight: 1.15, color: estilo.cor_texto }}>{textoTit}</div>
          {sub ? (
            <div style={{ fontSize: tamSub, lineHeight: 1.25, marginTop: 6, color: estilo.cor_destaque, letterSpacing: 2, opacity: pSub, translate: `${lerp(-16, 0, pSub)}px 0px` }}>
              {textoSub}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
