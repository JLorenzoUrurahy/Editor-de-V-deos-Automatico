// terminal: janela de terminal escura. Linhas de comando são digitadas a partir
// do seu `em` (com "$" na cor de destaque); saídas aparecem prontas; sucesso ganha
// um visto e erro um x vermelho. Só textos dos props.
// props: { linhas: { texto: string, em: number, tipo?: "comando" | "saida" | "sucesso" | "erro" }[], titulo?: string }
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { BarraJanela, caracteresEm, digitado, quebrar } from "./comum";

type Linha = { texto: string; em: number; tipo?: "comando" | "saida" | "sucesso" | "erro" };

const VERDE = "#3DD68C";
const VERMELHO = "#FF4D4F";
const VELOCIDADE = 24; // caracteres por segundo nos comandos

export const Terminal: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const linhas = (props.linhas as Linha[]) ?? [];
  const titulo = props.titulo as string | undefined;
  exigirDeclarados("terminal", textos, [titulo, ...linhas.map((l) => l.texto)]);

  const barra = 66;
  const pad = 34;
  const tam = 46;
  const prefixo = medir(estilo, "$ ", tam);
  const util = largura - 2 * pad - prefixo - 10;
  const blocos = linhas.map((l) => ({ ...l, partes: quebrar(estilo, l.texto, util, tam) }));
  const altLinha = tam * 1.3;
  const totalFinal = blocos.reduce((s, b) => s + b.partes.length * altLinha + 10, 0);
  const janelaH = Math.min(altura, barra + 2 * pad + totalFinal);
  const janelaY = (altura - janelaH) / 2;
  const area = janelaH - barra - 2 * pad;

  // Rolagem: quando o texto passa da área, as linhas antigas sobem (só quando entra linha nova).
  let usado = 0;
  for (const b of blocos) {
    if (t >= b.em) usado += b.partes.length * altLinha * molaSemOvershoot(t - b.em, 0.2) + 10;
  }
  const sobe = Math.max(0, usado - area);
  const e = entra(t, 0, 0.45);

  let y = 0;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: janelaY,
        width: largura,
        height: janelaH,
        borderRadius: 26,
        overflow: "hidden",
        backgroundColor: "#0B0D12",
        border: `1.5px solid ${alfa("#FFFFFF", 0.14)}`,
        boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
        opacity: Math.min(1, e * 2),
        transform: `translateY(${lerp(40, 0, e)}px) scale(${lerp(0.95, 1, e)})`,
        fontFamily: estilo.fonte,
        fontWeight: 800,
      }}
    >
      <BarraJanela altura={barra} escura>
        {titulo ? <span style={{ marginLeft: 16, fontSize: 42, color: alfa("#FFFFFF", 0.6), whiteSpace: "nowrap" }}>{titulo}</span> : null}
      </BarraJanela>
      <div style={{ position: "absolute", left: pad, right: pad, top: barra + pad, height: area, overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: -sobe }}>
          {blocos.map((b, i) => {
            if (t < b.em) return null;
            const comando = (b.tipo ?? "comando") === "comando";
            const n = comando ? caracteresEm(t, b.em, b.em + b.texto.length / VELOCIDADE, b.texto.length) : b.texto.length;
            const visivel = digitado(b.partes, n);
            const digitando = comando && n < b.texto.length;
            const cor = b.tipo === "sucesso" ? VERDE : b.tipo === "erro" ? VERMELHO : comando ? estilo.cor_texto : alfa("#FFFFFF", 0.62);
            const topo = y;
            y += b.partes.length * altLinha + 10;
            return (
              <div key={i} style={{ position: "absolute", left: 0, right: 0, top: topo, display: "flex", fontSize: tam, lineHeight: 1.3, opacity: comando ? 1 : Math.min(1, (t - b.em) / 0.12) }}>
                <div style={{ width: prefixo + 10, flexShrink: 0, color: estilo.cor_destaque, display: "flex", alignItems: "center", height: altLinha }}>
                  {comando ? "$" : b.tipo === "sucesso" ? <Icone nome="Check" tamanho={tam * 0.85} cor={VERDE} traco={3} /> : b.tipo === "erro" ? <Icone nome="X" tamanho={tam * 0.85} cor={VERMELHO} traco={3} /> : null}
                </div>
                <div style={{ color: cor }}>
                  {visivel.map((l, k) => (
                    <div key={k} style={{ whiteSpace: "nowrap" }}>
                      {l}
                      {digitando && k === visivel.length - 1 ? <span style={{ display: "inline-block", width: tam * 0.55, height: tam * 1.0, marginLeft: 4, backgroundColor: estilo.cor_destaque, verticalAlign: "middle" }} /> : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
