// passos: passos numerados em cartões que entram quando cada um é dito; o passo
// atual fica em destaque e os anteriores recuam um pouco.
// props: { titulo?: string, itens: { texto: string, em: number, icone?: string }[] }  (até 5)
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { empilhar, superficie } from "./comum";

type Item = { texto: string; em: number; icone?: string };

export const Passos: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const itens = ((props.itens as Item[]) ?? []).slice(0, 5);
  const titulo = props.titulo as string | undefined;
  exigirDeclarados("passos", textos, [titulo, ...itens.map((i) => i.texto)]);
  const n = itens.length;
  const tamTitulo = titulo ? caber(estilo, caixa(titulo, estilo), largura, 52) : 0;
  const gap = 18;
  const disponivel = altura - (titulo ? tamTitulo * 1.6 : 0);
  const comIcone = itens.some((i) => i.icone);
  // O texto manda: maior tamanho (64 a 40) em que todos cabem; o cartão tem 2,2× a altura do texto.
  const cabeNo = (tam: number) => {
    const h = Math.min(tam * 2.2, (disponivel - gap * (n - 1)) / Math.max(1, n));
    const b = h * 0.62;
    const lt = largura - 28 - b - 24 - (comIcone ? b * 0.8 + 18 : 0) - 28;
    return { h, b, ok: itens.every((i) => medir(estilo, caixa(i.texto, estilo), tam) <= lt) };
  };
  let tamTexto = 64;
  while (tamTexto > 40 && !cabeNo(tamTexto).ok) tamTexto -= 2;
  const { h: alturaCartao, b: badge } = cabeNo(tamTexto);
  const topos = empilhar([...(titulo ? [tamTitulo * 1.6 - gap] : []), ...itens.map(() => alturaCartao)], gap, altura);
  const toposItens = titulo ? topos.slice(1) : topos;
  const tit = entra(t, 0.05, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {titulo ? (
        <div style={{ position: "absolute", left: 0, top: topos[0], width: largura, textAlign: "center", fontSize: tamTitulo, letterSpacing: 4, color: estilo.cor_destaque, opacity: tit, transform: `translateY(${lerp(14, 0, tit)}px)` }}>
          {caixa(titulo, estilo)}
        </div>
      ) : null}
      {itens.map((it, k) => {
        if (t < it.em) return null;
        const chega = entra(t, it.em, 0.42);
        // Aceso do seu `em` até o `em` do passo seguinte (transição suave nas duas pontas).
        const ativo = entra(t, it.em, 0.3) - (k + 1 < n ? entra(t, itens[k + 1].em, 0.3) : 0);
        const recua = k + 1 < n ? entra(t, itens[k + 1].em, 0.3) : 0;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 0,
              top: toposItens[k],
              width: largura,
              height: alturaCartao,
              display: "flex",
              alignItems: "center",
              gap: 24,
              padding: "0 28px",
              boxSizing: "border-box",
              ...superficie(estilo.cor_destaque, ativo),
              opacity: chega * lerp(1, 0.55, recua),
              transform: `translateX(${lerp(-60, 0, chega)}px)`,
            }}
          >
            <div
              style={{
                flex: "none",
                width: badge,
                height: badge,
                borderRadius: badge / 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: badge * 0.52,
                backgroundColor: ativo > 0.5 ? estilo.cor_destaque : alfa("#FFFFFF", 0.12),
                color: ativo > 0.5 ? contraste(estilo.cor_destaque) : estilo.cor_texto,
                border: `2px solid ${alfa(estilo.cor_destaque, 0.6)}`,
              }}
            >
              {k + 1}
            </div>
            {it.icone ? <Icone nome={it.icone} tamanho={badge * 0.8} cor={ativo > 0.5 ? estilo.cor_destaque : alfa("#FFFFFF", 0.85)} /> : comIcone ? <div style={{ width: badge * 0.8 }} /> : null}
            <div style={{ fontSize: tamTexto, color: estilo.cor_texto, whiteSpace: "nowrap", overflow: "hidden" }}>{caixa(it.texto, estilo)}</div>
          </div>
        );
      })}
    </div>
  );
};
