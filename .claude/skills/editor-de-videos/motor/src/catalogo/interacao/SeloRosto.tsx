// selo_rosto: um elemento preso à cabeça que acompanha o movimento da pessoa.
// - selo: etiqueta na cor de destaque, levemente inclinada, ao lado ou acima da cabeça;
// - balao: balão de fala branco com o rabicho apontando para a cabeça;
// - circulo: círculo "feito à mão" em volta da cabeça (contorna o rosto, não cobre)
//   e uma seta curva do rótulo até o círculo.
// Lado automático: o lado com espaço na zona segura; sem espaço, acima da cabeça.
// props: { texto?: string, icone?: string, variante?: "selo" | "balao" | "circulo",
//          lado?: "esquerda" | "direita" | "acima", em?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { clamp01, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { caber, caixa, contraste, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { contornoTexto } from "../sobre/comum";
import { cabeca, ladoLivre, prender, topoCabeca } from "./comum";

export const SeloRosto: React.FC<PropsCena> = ({ t, estilo, props, textos, n, rosto, trilha }) => {
  const texto = props.texto as string | undefined;
  const icone = props.icone as string | undefined;
  const variante = (props.variante as string | undefined) ?? "selo";
  const em = (props.em as number | undefined) ?? 0.2;
  exigirDeclarados("selo_rosto", textos, [texto]);
  const cab = cabeca(trilha, rosto, t);
  const t0 = Math.max(0, em - 0.12);
  if (t < t0) return null;

  const textoCx = texto ? caixa(texto, estilo) : "";
  const tam = texto ? caber(estilo, textoCx, 760, variante === "circulo" ? 80 : 72, 44) : 0;
  const larguraTexto = texto ? medir(estilo, textoCx, tam) : 0;
  const tamIcone = icone ? tam * 1.1 : 0;
  const w = larguraTexto + tamIcone + (icone && texto ? tam * 0.4 : 0) + (variante === "circulo" ? 0 : tam * 1.3);
  const h = Math.max(tam, tamIcone) * (variante === "circulo" ? 1.2 : 1.75);

  // Lado: o pedido, ou o que tem espaço ao lado da cabeça; sem espaço, acima.
  const livre = ladoLivre(cab);
  const espaco = livre === "direita" ? 918 - (cab.x + cab.s / 2) - 30 : cab.x - cab.s / 2 - 30 - 108;
  const lado = (props.lado as string | undefined) ?? (espaco >= w ? livre : "acima");
  const sinal = lado === "esquerda" ? -1 : 1;
  const topo = topoCabeca(cab);

  if (variante === "circulo") {
    // Elipse um pouco irregular em volta da cabeça, desenhada em 0,55 s, passando do ponto de partida.
    const cx = cab.x;
    const cy = cab.y - cab.s * 0.12;
    const rx = cab.s * 0.68;
    const ry = cab.s * 0.88;
    const ini = -Math.PI * 0.62 + ((n ?? 0) % 3) * 0.4;
    const pontos: string[] = [];
    const total = Math.PI * 2 + 0.45;
    for (let k = 0; k <= 64; k++) {
      const a = ini + (total * k) / 64;
      const r = 1 + 0.035 * Math.sin(3 * a + (n ?? 0)) + 0.025 * (k / 64);
      pontos.push(`${k ? "L" : "M"}${(cx + rx * r * Math.cos(a)).toFixed(1)},${(cy + ry * r * Math.sin(a)).toFixed(1)}`);
    }
    const desenho = molaSemOvershoot(t - t0, 0.55);
    // Rótulo: acima da cabeça (ou ao lado), entra depois do círculo, com seta curva até ele.
    const tR = t0 + 0.4;
    const rot = clamp01((t - tR) / 0.12);
    const rp = lado === "acima" ? prender(cx + cab.s * 0.25, cy - ry - h / 2 - 40, w, h) : prender(cx + sinal * (rx + w / 2 + 30), cy - ry * 0.55, w, h);
    const alvoA = lado === "acima" ? -Math.PI / 2 + 0.35 : sinal > 0 ? -0.55 : Math.PI + 0.55;
    const alvo = { x: cx + rx * 1.04 * Math.cos(alvoA), y: cy + ry * 1.04 * Math.sin(alvoA) };
    const saida = lado === "acima" ? { x: rp.x - w * 0.15, y: rp.y + h / 2 + 6 } : { x: rp.x - sinal * (w / 2 + 6), y: rp.y + h * 0.2 };
    const meio = { x: (saida.x + alvo.x) / 2 + sinal * 40, y: (saida.y + alvo.y) / 2 - 30 };
    const seta = molaSemOvershoot(t - tR - 0.05, 0.35);
    const id = `seta-${Math.round(cab.x)}-${n ?? 0}`;
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <marker id={id} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={estilo.cor_destaque} />
            </marker>
          </defs>
          <path d={pontos.join(" ")} fill="none" stroke={estilo.cor_destaque} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - desenho} style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))" }} />
          {texto && t >= tR ? (
            <path d={`M${saida.x},${saida.y} Q${meio.x},${meio.y} ${alvo.x},${alvo.y}`} fill="none" stroke={estilo.cor_destaque} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - seta} markerEnd={seta > 0.95 ? `url(#${id})` : undefined} />
          ) : null}
        </svg>
        {texto ? (
          <div style={{ position: "absolute", left: rp.x - w / 2, top: rp.y - h / 2, width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", gap: tam * 0.4, opacity: rot, transform: `scale(${lerp(0.6, 1, molaLeve(t - tR, 0.4, 0.06))})`, fontFamily: estilo.fonte, fontWeight: 800, fontSize: tam, color: estilo.cor_destaque, whiteSpace: "nowrap", ...contornoTexto(estilo, tam) }}>
            {icone ? <Icone nome={icone} tamanho={tamIcone} cor={estilo.cor_destaque} /> : null}
            {textoCx}
          </div>
        ) : null}
      </div>
    );
  }

  // selo ou balão: preso ao lado da cabeça, na altura da testa, ou acima dela.
  const pos =
    lado === "acima"
      ? prender(cab.x + (variante === "balao" ? cab.s * 0.3 : 0), topo - h / 2 - (variante === "balao" ? 44 : 22), w, h)
      : prender(cab.x + sinal * (cab.s * 0.5 + 30 + w / 2), cab.y - cab.s * 0.42, w, h);
  const p = molaLeve(t - t0, 0.42, 0.06);
  const op = clamp01((t - t0) / 0.1);
  const balao = variante === "balao";
  const fundo = balao ? "#FFFFFF" : estilo.cor_destaque;
  const corTexto = balao ? "#111111" : contraste(estilo.cor_destaque);
  // Rabicho do balão: da borda mais próxima até um ponto na cabeça.
  const ponta = lado === "acima" ? { x: cab.x + cab.s * 0.08, y: topo + cab.s * 0.08 } : { x: cab.x + sinal * cab.s * 0.42, y: cab.y - cab.s * 0.3 };
  const baseRabicho = lado === "acima" ? { x: pos.x - w * 0.18, y: pos.y + h / 2 - 4 } : { x: pos.x - sinal * (w / 2 - 4), y: pos.y + h * 0.15 };
  const meia = 20;
  const giro = balao ? 0 : -3 + ((n ?? 0) % 2) * 6;
  const origemEscala = `${((cab.x - (pos.x - w / 2)) / w) * 100}% ${((cab.y - (pos.y - h / 2)) / h) * 100}%`;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      {balao ? (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: clamp01((t - t0 - 0.12) / 0.12) }}>
          <polygon
            points={`${baseRabicho.x - (lado === "acima" ? meia : 0)},${baseRabicho.y - (lado === "acima" ? 0 : meia)} ${baseRabicho.x + (lado === "acima" ? meia : 0)},${baseRabicho.y + (lado === "acima" ? 0 : meia)} ${lerp(baseRabicho.x, ponta.x, 0.55)},${lerp(baseRabicho.y, ponta.y, 0.55)}`}
            fill="#FFFFFF"
            style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))" }}
          />
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: pos.x - w / 2,
          top: pos.y - h / 2,
          width: w,
          height: h,
          borderRadius: balao ? h * 0.42 : 16,
          background: fundo,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: tam * 0.4,
          fontFamily: estilo.fonte,
          fontWeight: 800,
          fontSize: tam,
          color: corTexto,
          whiteSpace: "nowrap",
          boxShadow: "0 16px 36px rgba(0,0,0,0.42)",
          transform: `scale(${lerp(0.3, 1, p)}) rotate(${giro}deg)`,
          transformOrigin: origemEscala,
        }}
      >
        {icone ? <Icone nome={icone} tamanho={tamIcone} cor={corTexto} /> : null}
        {textoCx}
      </div>
    </div>
  );
};
