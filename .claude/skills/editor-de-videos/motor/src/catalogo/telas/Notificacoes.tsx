// notificacoes: notificações de celular empilhando. Cada uma surge no topo da pilha
// no seu `em` (cresce e aparece no lugar) enquanto as anteriores descem para abrir
// espaço; a mais nova tem um leve brilho na cor de destaque, que apaga quando chega
// a próxima. A pilha fica centrada; as que não cabem saem por baixo, apagando.
// props: { itens: { titulo: string, texto?: string, icone?: string, em: number }[], rotulo?: string }
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { janela, quebrar } from "./comum";

type Item = { titulo: string; texto?: string; icone?: string; em: number };

const GAP = 20;

export const Notificacoes: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const itens = (props.itens as Item[]) ?? [];
  const rotulo = props.rotulo as string | undefined;
  exigirDeclarados("notificacoes", textos, [rotulo, ...itens.flatMap((i) => [i.titulo, i.texto])]);

  const tamRot = rotulo ? caber(estilo, caixa(rotulo, estilo), largura, 52, 44) : 0;
  const rotH = rotulo ? tamRot * 1.25 + 24 : 0;
  const icone = 104;
  const pad = 28;
  const larguraTexto = largura - icone - 3 * pad;
  const tamTit = Math.min(52, ...itens.map((i) => caber(estilo, i.titulo, larguraTexto, 52, 42)));
  const tamTxt = 44;
  const cartoes = itens.map((i) => {
    const linhas = i.texto ? quebrar(estilo, i.texto, larguraTexto, tamTxt).slice(0, 2) : [];
    const h = Math.max(icone + 2 * pad, pad * 2 + tamTit * 1.2 + linhas.length * tamTxt * 1.22 + (linhas.length ? 6 : 0));
    return { ...i, linhas, h };
  });

  const area = altura - rotH;
  // Pilha centrada pela altura final (limitada à área); a mais nova em cima.
  const finalH = Math.min(area, cartoes.reduce((s, c) => s + c.h + GAP, -GAP));
  const topoPilha = rotH + Math.max(0, (area - finalH) / 2);
  const chegada = (k: number) => molaSemOvershoot(t - cartoes[k].em, 0.45);
  const r = entra(t, 0.1, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: Math.max(0, topoPilha - rotH), width: largura, textAlign: "center", fontSize: tamRot, color: estilo.cor_destaque, letterSpacing: 3, whiteSpace: "nowrap", opacity: r }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      <div style={{ position: "absolute", left: 0, top: topoPilha, width: largura, height: altura - topoPilha, overflow: "hidden" }}>
        {cartoes.map((c, k) => {
          if (t < c.em) return null;
          let topo = 0;
          for (let j = k + 1; j < cartoes.length; j++) {
            if (t >= cartoes[j].em) topo += (cartoes[j].h + GAP) * chegada(j);
          }
          // a nova espera as outras abrirem espaço (0,12 s) antes de crescer no lugar
          const p = molaLeve(t - c.em - 0.12, 0.42, 0.04);
          const proxima = cartoes.findIndex((o, j) => j > k && t >= o.em);
          const brilho = proxima < 0 ? 1 : 1 - chegada(proxima);
          const fora = Math.min(1, Math.max(0, (topo + c.h - finalH) / (c.h * 0.6)));
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: 0,
                top: topo,
                width: largura,
                height: c.h,
                boxSizing: "border-box",
                borderRadius: 36,
                padding: pad,
                display: "flex",
                gap: pad,
                alignItems: "center",
                ...janela(),
                boxShadow: `0 18px 40px rgba(0,0,0,0.35), 0 0 40px ${alfa(estilo.cor_destaque, 0.32 * brilho)}`,
                border: `1.5px solid ${alfa(estilo.cor_destaque, 0.15 + 0.4 * brilho)}`,
                opacity: Math.min(1, Math.max(0, (t - c.em - 0.1) / 0.14)) * (1 - fora),
                transformOrigin: "50% 0%",
                transform: `translateY(${lerp(-24, 0, p)}px) scale(${lerp(0.9, 1, p)})`,
              }}
            >
              <div style={{ width: icone, height: icone, flexShrink: 0, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(145deg, ${estilo.cor_destaque}, ${alfa(estilo.cor_destaque, 0.65)})` }}>
                <Icone nome={c.icone ?? "Bell"} tamanho={56} cor={contraste(estilo.cor_destaque)} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: tamTit, lineHeight: 1.2, color: estilo.cor_texto, whiteSpace: "nowrap" }}>{c.titulo}</div>
                {c.linhas.map((l, i) => (
                  <div key={i} style={{ fontSize: tamTxt, lineHeight: 1.22, color: alfa("#FFFFFF", 0.7), whiteSpace: "nowrap", marginTop: i ? 0 : 6 }}>
                    {l}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
