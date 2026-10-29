// lista: checklist em que cada item ganha o "check" quando é dito. Item negativo
// ganha um X vermelho e fica riscado. Com `todos_visiveis`, a lista aparece inteira
// (apagada) no começo e cada item acende no seu `em`.
// props: { titulo?: string, itens: { texto: string, em: number, negativo?: boolean }[], todos_visiveis?: boolean }  (até 6)
import type React from "react";
import { entra, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { empilhar, VERMELHO } from "./comum";

type Item = { texto: string; em: number; negativo?: boolean };

export const Lista: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const itens = ((props.itens as Item[]) ?? []).slice(0, 6);
  const titulo = props.titulo as string | undefined;
  const todos = Boolean(props.todos_visiveis);
  exigirDeclarados("lista", textos, [titulo, ...itens.map((i) => i.texto)]);
  const n = itens.length;
  const tamTitulo = titulo ? caber(estilo, caixa(titulo, estilo), largura, 52) : 0;
  const gap = 16;
  const disponivel = altura - (titulo ? tamTitulo * 1.6 : 0);
  const alturaLinha = Math.min(132, (disponivel - gap * (n - 1)) / Math.max(1, n));
  const caixaW = alturaLinha * 0.64;
  const larguraTexto = largura - caixaW - 28 - 20;
  const tamTexto = Math.max(40, Math.min(72, alturaLinha * 0.52, ...itens.map((i) => caber(estilo, caixa(i.texto, estilo), larguraTexto, 72, 40))));
  const topos = empilhar([...(titulo ? [tamTitulo * 1.6 - gap] : []), ...itens.map(() => alturaLinha)], gap, altura);
  const toposItens = titulo ? topos.slice(1) : topos;
  // Bloco alinhado à esquerda, centrado na horizontal pela linha mais longa.
  const maisLonga = Math.max(0, ...itens.map((i) => medir(estilo, caixa(i.texto, estilo), tamTexto)));
  const esquerda = Math.max(0, (largura - (caixaW + 28 + maisLonga)) / 2);
  const tit = entra(t, 0.05, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {titulo ? (
        <div style={{ position: "absolute", left: 0, top: topos[0], width: largura, textAlign: "center", fontSize: tamTitulo, letterSpacing: 4, color: estilo.cor_destaque, opacity: tit, transform: `translateY(${lerp(14, 0, tit)}px)` }}>
          {caixa(titulo, estilo)}
        </div>
      ) : null}
      {itens.map((it, k) => {
        const aparece = todos ? entra(t, 0.1 + 0.08 * k, 0.35) : entra(t, it.em - 0.15, 0.35);
        if (aparece <= 0) return null;
        const marca = molaSemOvershoot(t - it.em, 0.32);
        const pop = molaLeve(t - it.em, 0.35, 0.08);
        const cor = it.negativo ? VERMELHO : estilo.cor_destaque;
        const aceso = t >= it.em ? 1 : 0;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: esquerda,
              top: toposItens[k],
              width: largura - esquerda,
              height: alturaLinha,
              display: "flex",
              alignItems: "center",
              gap: 28,
              opacity: aparece * (todos ? lerp(0.4, 1, aceso * marca) : 1),
              transform: `translateX(${lerp(-40, 0, aparece)}px)`,
            }}
          >
            <div
              style={{
                flex: "none",
                width: caixaW,
                height: caixaW,
                borderRadius: caixaW * 0.28,
                border: `3px solid ${t >= it.em ? cor : alfa("#FFFFFF", 0.35)}`,
                backgroundColor: alfa(cor, 0.9 * marca),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${t >= it.em ? lerp(0.8, 1, pop) : 1})`,
                boxShadow: marca > 0 ? `0 0 ${30 * marca}px ${alfa(cor, 0.5)}` : "none",
              }}
            >
              <svg width={caixaW * 0.62} height={caixaW * 0.62} viewBox="0 0 24 24" fill="none" stroke={it.negativo ? "#FFFFFF" : contraste(cor)} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
                {it.negativo ? (
                  <>
                    <path d="M6 6 L18 18" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, marca * 2)} />
                    <path d="M18 6 L6 18" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, marca * 2 - 1)} />
                  </>
                ) : (
                  <path d="M4.5 12.5 L9.5 17.5 L19.5 6.5" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - marca} />
                )}
              </svg>
            </div>
            <div style={{ position: "relative", fontSize: tamTexto, color: it.negativo && aceso ? alfa("#FFFFFF", 0.75) : estilo.cor_texto, whiteSpace: "nowrap" }}>
              {caixa(it.texto, estilo)}
              {it.negativo ? (
                <div style={{ position: "absolute", left: -6, top: "54%", height: 6, marginTop: -3, width: `calc(${100 * molaSemOvershoot(t - it.em - 0.15, 0.3)}% + 12px)`, backgroundColor: VERMELHO, borderRadius: 3 }} />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
