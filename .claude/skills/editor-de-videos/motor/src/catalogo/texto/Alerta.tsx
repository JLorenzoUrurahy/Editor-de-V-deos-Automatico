// alerta: aviso em cartão. Negativo ("não faça isso", "cuidado"): vermelho, ícone
// de alerta e um tranco curto na entrada. Positivo ("pode fazer", "isso funciona"):
// cor de destaque e ícone de confirmação.
// props: { texto: string, apoio?: string, tipo?: "negativo" | "positivo", icone?: string, em?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { ajustarBloco, ESPACO, larguras, VERMELHO } from "./comum";

export const Alerta: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const texto = (props.texto as string) ?? "";
  const apoio = props.apoio as string | undefined;
  const positivo = props.tipo === "positivo";
  const icone = (props.icone as string | undefined) ?? (positivo ? "CircleCheckBig" : "TriangleAlert");
  const em = (props.em as number | undefined) ?? 0.35;
  exigirDeclarados("alerta", textos, [texto, apoio]);
  const cor = positivo ? estilo.cor_destaque : VERMELHO;
  const pad = 40;
  const tamIcone = altura >= 800 ? 200 : 128;
  const tamApoio = apoio ? caber(estilo, caixa(apoio, estilo), largura - 2 * pad, 46, 40) : 0;
  const palavras = texto.split(/\s+/).filter(Boolean);
  const dispTexto = altura - 2 * pad - tamIcone - 28 - (apoio ? tamApoio * 1.3 + 14 : 0);
  const { tamanho, linhas } = ajustarBloco(estilo, palavras, largura - 2 * pad, dispTexto, altura >= 800 ? 120 : 84, 44, 3, 1.15);
  const ws = larguras(estilo, palavras, tamanho);
  const alturaLinha = tamanho * 1.15;
  const alturaCartao = 2 * pad + tamIcone + 28 + linhas.length * alturaLinha + (apoio ? 14 + tamApoio * 1.3 : 0);
  const topo = (altura - alturaCartao) / 2;
  const chega = molaSemOvershoot(t - em, 0.32);
  const pop = molaLeve(t - em, 0.45, 0.06);
  // Tranco amortecido só na entrada do negativo (some em ~0,5 s e o cartão fica parado).
  const tranco = !positivo && t >= em ? Math.sin((t - em) * 38) * Math.exp(-(t - em) * 9) * 18 : 0;
  const apo = entra(t, em + 0.3, 0.35);
  if (t < em) return null;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: topo,
          width: largura,
          height: alturaCartao,
          borderRadius: 28,
          background: `linear-gradient(145deg, ${alfa(cor, 0.2)}, ${alfa(cor, 0.06)})`,
          border: `3px solid ${alfa(cor, 0.85)}`,
          boxShadow: `0 18px 40px rgba(0,0,0,0.35), 0 0 60px ${alfa(cor, 0.35)}`,
          opacity: Math.min(1, (t - em) / 0.1),
          transform: `translateX(${tranco}px) scale(${lerp(1.18, 1, chega)})`,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: pad, width: largura, display: "flex", justifyContent: "center", transform: `scale(${lerp(0.5, 1, pop)})`, filter: `drop-shadow(0 0 22px ${alfa(cor, 0.6)})` }}>
          <Icone nome={icone} tamanho={tamIcone} cor={cor} traco={2.2} />
        </div>
        {linhas.map((linha, l) => {
          const larguraL = linha.reduce((s, k) => s + ws[k], 0) + ESPACO * tamanho * (linha.length - 1);
          let x = (largura - larguraL) / 2;
          return linha.map((k) => {
            const xp = x;
            x += ws[k] + ESPACO * tamanho;
            return (
              <span key={k} style={{ position: "absolute", left: xp, top: pad + tamIcone + 28 + l * alturaLinha, fontSize: tamanho, lineHeight: `${alturaLinha}px`, color: estilo.cor_texto, whiteSpace: "nowrap" }}>
                {caixa(palavras[k], estilo)}
              </span>
            );
          });
        })}
        {apoio ? (
          <div style={{ position: "absolute", left: 0, top: alturaCartao - pad - tamApoio * 1.3, width: largura, textAlign: "center", fontSize: tamApoio, color: alfa("#FFFFFF", 0.75), letterSpacing: 2, opacity: apo, whiteSpace: "nowrap" }}>
            {caixa(apoio, estilo)}
          </div>
        ) : null}
      </div>
    </div>
  );
};
