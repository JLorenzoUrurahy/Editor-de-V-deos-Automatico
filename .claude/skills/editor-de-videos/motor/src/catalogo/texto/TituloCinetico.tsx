// titulo_cinetico: frase de impacto em letra grande, em 1 a 3 linhas; cada palavra
// entra no instante em que é dita e a palavra-chave ganha uma tarja na cor de destaque.
// props: { palavras?: { texto: string, em: number, destaque?: boolean }[],
//          texto?: string, em?: number, destaque?: string[], rotulo?: string }
// (com `texto`, as palavras entram em sequência a partir de `em`)
import type React from "react";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { ajustarBloco, ESPACO, larguras } from "./comum";

type Palavra = { texto: string; em: number; destaque?: boolean };

const semPontuacao = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

export const TituloCinetico: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const rotulo = props.rotulo as string | undefined;
  let palavras = props.palavras as Palavra[] | undefined;
  if (!palavras) {
    const texto = (props.texto as string) ?? "";
    exigirDeclarados("titulo_cinetico", textos, [texto]);
    const em = (props.em as number | undefined) ?? 0.3;
    const chaves = new Set(((props.destaque as string[] | undefined) ?? []).map(semPontuacao));
    palavras = texto.split(/\s+/).filter(Boolean).map((p, i) => ({ texto: p, em: em + 0.09 * i, destaque: chaves.has(semPontuacao(p)) }));
  } else {
    exigirDeclarados("titulo_cinetico", textos, palavras.map((p) => p.texto));
  }
  exigirDeclarados("titulo_cinetico", textos, [rotulo]);

  const tamRotulo = rotulo ? caber(estilo, caixa(rotulo, estilo), largura, 52) : 0;
  const reservaRotulo = rotulo ? tamRotulo * 1.7 : 0;
  const tela = altura >= 800;
  const textosP = palavras.map((p) => p.texto);
  const { tamanho, linhas } = ajustarBloco(estilo, textosP, largura * 0.94, altura - reservaRotulo, tela ? 170 : 136, 56, tela ? 5 : 3, 1.18);
  const ws = larguras(estilo, textosP, tamanho);
  const alturaLinha = tamanho * 1.18;
  const alturaBloco = reservaRotulo + linhas.length * alturaLinha;
  const topo = (altura - alturaBloco) / 2;
  const rot = entra(t, 0.05, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: topo, width: largura, textAlign: "center", fontSize: tamRotulo, letterSpacing: 4, color: estilo.cor_destaque, opacity: rot, transform: `translateY(${lerp(14, 0, rot)}px)` }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      {linhas.map((linha, l) => {
        const larguraL = linha.reduce((s, k) => s + ws[k], 0) + ESPACO * tamanho * (linha.length - 1);
        let x = (largura - larguraL) / 2;
        const y = topo + reservaRotulo + l * alturaLinha;
        return linha.map((k) => {
          const p = palavras![k];
          const xp = x;
          x += ws[k] + ESPACO * tamanho;
          if (t < p.em) return null;
          const chega = molaSemOvershoot(t - p.em, 0.38);
          // Pontuação fica fora da tarja ("IA," → tarja só em "IA").
          const [, nucleo, pont] = /^(.*?)([.,;:!?…]*)$/u.exec(caixa(p.texto, estilo)) ?? ["", caixa(p.texto, estilo), ""];
          const wNucleo = p.destaque && pont ? medir(estilo, nucleo, tamanho) : ws[k];
          const tarja = p.destaque ? molaSemOvershoot(t - p.em - 0.08, 0.3) : 0;
          const corte = `inset(0 ${(1 - tarja) * 100}% 0 0)`;
          const linhaTexto = (cor: string, extra?: React.CSSProperties) => (
            <div style={{ position: "absolute", left: 0, top: 0, fontSize: tamanho, lineHeight: `${alturaLinha}px`, color: cor, whiteSpace: "nowrap", ...extra }}>
              {nucleo}
              {/* pontuação depois da folga da tarja */}
              <span style={{ color: estilo.cor_texto, marginLeft: p.destaque && pont ? 0.14 * tamanho : 0 }}>{pont}</span>
            </div>
          );
          return (
            <div key={k} style={{ position: "absolute", left: xp, top: y, width: ws[k], height: alturaLinha, opacity: Math.min(1, (t - p.em) / 0.12), transform: `translateY(${lerp(0.32 * tamanho, 0, chega)}px)` }}>
              {/* texto claro só onde a tarja ainda não passou (acento não fica sobrando acima da tarja) */}
              {linhaTexto(estilo.cor_texto, p.destaque ? { clipPath: `inset(-50% -50% -50% ${tarja * wNucleo}px)` } : undefined)}
              {p.destaque ? (
                <>
                  {/* tarja e texto escuro varrem juntos, da esquerda para a direita */}
                  <div style={{ position: "absolute", left: -0.12 * tamanho, top: alturaLinha * 0.03, width: wNucleo + 0.24 * tamanho, height: alturaLinha * 0.92, borderRadius: 0.14 * tamanho, backgroundColor: estilo.cor_destaque, boxShadow: tarja > 0.98 ? `0 0 50px ${alfa(estilo.cor_destaque, 0.45)}` : "none", clipPath: corte }} />
                  {linhaTexto(contraste(estilo.cor_destaque), { clipPath: `inset(-50% ${(1 - tarja) * 100}% -50% 0)`, width: wNucleo })}
                </>
              ) : null}
            </div>
          );
        });
      })}
    </div>
  );
};
