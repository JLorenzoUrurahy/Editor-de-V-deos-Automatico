// citacao: uma frase dita, em destaque num cartão de citação com aspas grandes.
// As linhas entram em sequência; as palavras-chave ficam na cor de destaque.
// props: { texto: string, destaque?: string[], autor?: string, em?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { ajustarBloco, ESPACO, larguras, superficie } from "./comum";

const semPontuacao = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

export const Citacao: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const texto = (props.texto as string) ?? "";
  const autor = props.autor as string | undefined;
  const em = (props.em as number | undefined) ?? 0.3;
  exigirDeclarados("citacao", textos, [texto, autor]);
  const chaves = new Set(((props.destaque as string[] | undefined) ?? []).flatMap((d) => d.split(/\s+/)).map(semPontuacao));
  const palavras = texto.split(/\s+/).filter(Boolean);
  const pad = 44;
  const aspas = altura >= 800 ? 110 : 84;
  const tamAutor = autor ? caber(estilo, caixa(autor, estilo), largura - 2 * pad, 44, 40) : 0;
  const reservaAutor = autor ? tamAutor * 1.3 + 22 : 0;
  const dispTexto = altura - 2 * pad - aspas * 0.7 - reservaAutor;
  const { tamanho, linhas } = ajustarBloco(estilo, palavras, largura - 2 * pad, dispTexto, altura >= 800 ? 96 : 78, 42, 5, 1.2);
  const ws = larguras(estilo, palavras, tamanho);
  const alturaLinha = tamanho * 1.2;
  const alturaCartao = 2 * pad + aspas * 0.7 + linhas.length * alturaLinha + reservaAutor;
  const topo = (altura - alturaCartao) / 2;
  const cartao = entra(t, em - 0.2, 0.45);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      <div style={{ position: "absolute", left: 0, top: topo, width: largura, height: alturaCartao, boxSizing: "border-box", ...superficie(), opacity: cartao, transform: `translateY(${lerp(30, 0, cartao)}px)` }}>
        <div style={{ position: "absolute", left: pad - 8, top: pad - 18, opacity: entra(t, em - 0.05, 0.3) }}>
          <Icone nome="Quote" tamanho={aspas} cor={estilo.cor_destaque} traco={2.4} />
        </div>
        {linhas.map((linha, l) => {
          const v = entra(t, em + 0.12 * l, 0.36);
          let x = pad;
          return (
            <div key={l} style={{ position: "absolute", left: 0, top: pad + aspas * 0.7 + l * alturaLinha, width: largura, height: alturaLinha, opacity: v, transform: `translateY(${lerp(18, 0, v)}px)` }}>
              {linha.map((k) => {
                const xp = x;
                x += ws[k] + ESPACO * tamanho;
                const chave = chaves.has(semPontuacao(palavras[k]));
                return (
                  <span key={k} style={{ position: "absolute", left: xp, fontSize: tamanho, lineHeight: `${alturaLinha}px`, color: chave ? estilo.cor_destaque : estilo.cor_texto, whiteSpace: "nowrap" }}>
                    {caixa(palavras[k], estilo)}
                  </span>
                );
              })}
            </div>
          );
        })}
        {autor ? (
          <div style={{ position: "absolute", left: pad, top: alturaCartao - pad - tamAutor * 1.3, fontSize: tamAutor, color: alfa("#FFFFFF", 0.7), letterSpacing: 2, opacity: entra(t, em + 0.12 * linhas.length + 0.1, 0.35), whiteSpace: "nowrap" }}>
            {caixa(autor, estilo)}
          </div>
        ) : null}
      </div>
    </div>
  );
};
