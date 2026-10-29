// chat: conversa em bolhas entre a pessoa (direita, na cor de destaque) e a IA
// (esquerda, vidro escuro). Cada mensagem entra no seu `em`; antes da resposta da
// IA aparecem os três pontos de "digitando". As mensagens antigas sobem para
// abrir espaço, como num app de conversa. Só textos dos props.
// props: { mensagens: { de: "pessoa" | "ia", texto: string, em: number }[], nome?: string }
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { alfa, contraste, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { janela, quebrar, superficie } from "./comum";

type Mensagem = { de: "pessoa" | "ia"; texto: string; em: number };

const TAM = 48;
const LINHA = 1.22;
const PAD_X = 32;
const PAD_Y = 22;
const GAP = 18;
const DIGITANDO_S = 0.7;

export const Chat: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const mensagens = (props.mensagens as Mensagem[]) ?? [];
  const nome = props.nome as string | undefined;
  exigirDeclarados("chat", textos, [nome, ...mensagens.map((m) => m.texto)]);

  const cabecalho = nome ? 92 : 0;
  const larguraBolha = largura * 0.8 - 2 * PAD_X;
  const bolhas = mensagens.map((m) => {
    const linhas = quebrar(estilo, m.texto, larguraBolha, TAM);
    const w = Math.max(...linhas.map((l) => medir(estilo, l, TAM))) + 2 * PAD_X;
    const h = linhas.length * TAM * LINHA + 2 * PAD_Y;
    return { ...m, linhas, w, h };
  });
  // "Digitando" antes de cada resposta da IA que vem depois de outra mensagem.
  const digitando = bolhas.findIndex((b, i) => b.de === "ia" && i > 0 && t >= b.em - DIGITANDO_S && t < b.em);
  const altDigitando = TAM + 2 * PAD_Y;

  // A janela tem a altura da conversa inteira (um bloco centrado). Se a conversa não
  // couber, a pilha fica ancorada embaixo e as mensagens antigas sobem.
  const totalFinal = bolhas.reduce((s, b) => s + b.h + GAP, 0);
  const janelaH = Math.min(altura, cabecalho + 36 + totalFinal);
  const janelaY = (altura - janelaH) / 2;
  const areaH = janelaH - cabecalho - 24;
  const cabe = totalFinal <= areaH + GAP;
  const ocupacao = (i: number) => molaSemOvershoot(t - bolhas[i].em, 0.35);
  let alturaPilha = 0;
  bolhas.forEach((b, i) => {
    alturaPilha += (b.h + GAP) * ocupacao(i);
  });
  if (digitando >= 0) alturaPilha += (altDigitando + GAP) * molaSemOvershoot(t - (bolhas[digitando].em - DIGITANDO_S), 0.25);

  let y = 0;
  const posicoes = bolhas.map((b, i) => {
    const topo = y;
    y += (b.h + GAP) * ocupacao(i);
    return topo;
  });
  const quadro = entra(t, 0, 0.45);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: janelaY,
        width: largura,
        height: janelaH,
        borderRadius: 30,
        overflow: "hidden",
        ...janela(),
        opacity: quadro,
        transform: `translateY(${lerp(30, 0, quadro)}px)`,
        fontFamily: estilo.fonte,
        fontWeight: 800,
      }}
    >
      {nome ? (
        <div style={{ height: cabecalho, display: "flex", alignItems: "center", gap: 20, padding: "0 28px", borderBottom: `1.5px solid ${alfa("#FFFFFF", 0.1)}`, backgroundColor: alfa("#000000", 0.18) }}>
          <div style={{ width: 58, height: 58, borderRadius: 29, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, ${estilo.cor_destaque}, ${alfa(estilo.cor_destaque, 0.6)})` }}>
            <Icone nome="Sparkles" tamanho={32} cor={contraste(estilo.cor_destaque)} />
          </div>
          <span style={{ fontSize: 42, color: estilo.cor_texto }}>{nome}</span>
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 24, right: 24, top: cabecalho + 12, height: areaH, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: cabe ? 0 : areaH - alturaPilha }}>
          {bolhas.map((b, i) => {
            if (t < b.em) return null;
            const pessoa = b.de === "pessoa";
            const p = molaLeve(t - b.em, 0.4, 0.04);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: posicoes[i],
                  [pessoa ? "right" : "left"]: 0,
                  width: b.w,
                  height: b.h,
                  boxSizing: "border-box",
                  padding: `${PAD_Y}px ${PAD_X}px`,
                  borderRadius: 30,
                  [pessoa ? "borderBottomRightRadius" : "borderBottomLeftRadius"]: 8,
                  ...(pessoa ? { background: `linear-gradient(145deg, ${estilo.cor_destaque}, ${alfa(estilo.cor_destaque, 0.82)})` } : superficie(true)),
                  color: pessoa ? contraste(estilo.cor_destaque) : estilo.cor_texto,
                  fontSize: TAM,
                  lineHeight: LINHA,
                  opacity: Math.min(1, (t - b.em) / 0.1),
                  transformOrigin: pessoa ? "100% 100%" : "0% 100%",
                  transform: `scale(${lerp(0.7, 1, p)})`,
                }}
              >
                {b.linhas.map((l, k) => (
                  <div key={k} style={{ whiteSpace: "nowrap" }}>
                    {l}
                  </div>
                ))}
              </div>
            );
          })}
          {digitando >= 0 ? (
            <div
              style={{
                position: "absolute",
                top: y,
                left: 0,
                height: altDigitando,
                width: 170,
                borderRadius: 30,
                borderBottomLeftRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                ...superficie(true),
                opacity: entra(t, bolhas[digitando].em - DIGITANDO_S, 0.2),
              }}
            >
              {[0, 1, 2].map((k) => {
                // os pontos sobem em sequência só enquanto "digita" (some quando a resposta chega)
                const fase = ((t - (bolhas[digitando].em - DIGITANDO_S)) * 3 - k * 0.33) % 1;
                const pulo = Math.sin(Math.PI * Math.max(0, Math.min(1, fase * 2)));
                return <div key={k} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: alfa("#FFFFFF", 0.5 + 0.4 * pulo), transform: `translateY(${-8 * pulo}px)` }} />;
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
