// atravessa: uma palavra entra de um lado na altura dos olhos, passa POR TRÁS da
// cabeça (some atrás da pessoa) e, já do outro lado, vem para a frente e sobe para
// acima da cabeça, onde para. O lado de entrada alterna com a ordem da cena.
// Layout "profundidade": passada de trás durante a travessia, da frente depois.
// props: { texto: string, em?: number }
import type React from "react";
import { clamp01, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { caber, caixa, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { contornoTexto } from "../sobre/comum";
import { cabeca, prender, topoCabeca } from "./comum";

export const Atravessa: React.FC<PropsCena> = ({ t, estilo, props, textos, n, rosto, trilha, camada }) => {
  const texto = props.texto as string;
  const em = (props.em as number | undefined) ?? 0.9;
  exigirDeclarados("atravessa", textos, [texto]);
  const t0 = Math.max(0, em - 0.9);
  if (t < t0) return null;
  const cab = cabeca(trilha, rosto, t);
  const textoCx = caixa(texto, estilo);
  const tam = caber(estilo, textoCx, 800, 130, 60);
  const w = medir(estilo, textoCx, tam);
  const h = tam * 1.1;
  const dir = (n ?? 0) % 2 ? -1 : 1;

  // Travessia por trás, na altura dos olhos: de fora do quadro até o outro lado da cabeça.
  const yCabeca = cab.y - cab.s * 0.15;
  const xIni = dir > 0 ? -w / 2 - 20 : 1080 + w / 2 + 20;
  const xOutro = cab.x + dir * (cab.s * 0.5 + w / 2 + 10);
  const passa = molaSemOvershoot(t - t0, 0.95);
  // Depois, na frente: sobe para acima da cabeça e cresce um pouco.
  const fim = prender(cab.x, topoCabeca(cab) - h / 2 - 16, w, h);
  const sobe = molaSemOvershoot(t - (t0 + 0.85), 0.5);
  const naFrente = t >= t0 + 0.85;
  if (camada && naFrente !== (camada === "frente")) return null;
  const x = naFrente ? lerp(xOutro, fim.x, sobe) : lerp(xIni, xOutro, passa);
  const y = naFrente ? lerp(yCabeca, fim.y, sobe) : yCabeca;
  const escala = naFrente ? lerp(0.9, 1, molaLeve(t - (t0 + 0.85), 0.5, 0.06)) : 0.9;

  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        fontFamily: estilo.fonte,
        fontWeight: 800,
        fontSize: tam,
        lineHeight: 1.1,
        color: estilo.cor_destaque,
        whiteSpace: "nowrap",
        opacity: clamp01((t - t0) / 0.1),
        transform: `scale(${escala})`,
        ...contornoTexto(estilo, tam),
      }}
    >
      {textoCx}
    </div>
  );
};
