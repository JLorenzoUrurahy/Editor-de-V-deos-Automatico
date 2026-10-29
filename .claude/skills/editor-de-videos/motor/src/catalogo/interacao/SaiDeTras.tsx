// sai_de_tras: um cartão (ícone + texto) sobe de trás do ombro, ao lado da cabeça,
// escondido pelo corpo enquanto está atrás; quando passa do alto da cabeça, vem para
// a frente com uma leve aproximação e assenta acima da cabeça, do lado escolhido.
// Layout "profundidade": passada de trás até a virada, passada da frente depois.
// props: { texto: string, icone?: string, lado?: "esquerda" | "direita", em?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { clamp01, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { caber, caixa, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { vidro } from "../sobre/comum";
import { cabeca, ladoLivre, prender, topoCabeca } from "./comum";

export const SaiDeTras: React.FC<PropsCena> = ({ t, estilo, props, textos, rosto, trilha, camada }) => {
  const texto = props.texto as string;
  const icone = props.icone as string | undefined;
  const em = (props.em as number | undefined) ?? 0.4;
  exigirDeclarados("sai_de_tras", textos, [texto]);
  const t0 = Math.max(0, em - 0.85);
  if (t < t0) return null;
  const cab = cabeca(trilha, rosto, t);

  const textoCx = caixa(texto, estilo);
  const tam = caber(estilo, textoCx, 680, 68, 44);
  const tamIcone = icone ? tam * 1.15 : 0;
  const w = medir(estilo, textoCx, tam) + tamIcone + (icone ? tam * 0.45 : 0) + tam * 1.4;
  const h = tam * 1.9;
  const lado = (props.lado as string | undefined) ?? ladoLivre(cab);
  const sinal = lado === "esquerda" ? -1 : 1;

  // De trás do ombro (abaixo da linha do ombro, coberto pelo corpo) até acima da cabeça.
  const inicio = { x: cab.x + sinal * cab.s * 0.8, y: cab.y + cab.s * 1.35 };
  const fim = prender(cab.x + sinal * cab.s * 0.32, topoCabeca(cab) - h / 2 - 20, w, h);
  // Subida em S (começa devagar atrás do corpo), para a saída de trás ser vista.
  const u = clamp01((t - t0) / 1.05);
  const sobe = u * u * (3 - 2 * u);
  // Sobe na vertical primeiro e só no fim desliza para o lugar (rente à cabeça).
  const x = lerp(inicio.x, fim.x, molaSemOvershoot(t - t0 - 0.55, 0.5));
  const y = lerp(inicio.y, fim.y, sobe);
  const virada = 0.78;
  const naFrente = sobe >= virada;
  if (camada && naFrente !== (camada === "frente")) return null;
  const aproxima = naFrente ? 1 + 0.12 * Math.max(0, 1 - molaLeve(t - (t0 + 0.84), 0.4, 0.05)) : 0.94;

  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        ...vidro(estilo, h / 2),
        border: `2px solid ${estilo.cor_destaque}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: tam * 0.45,
        fontFamily: estilo.fonte,
        fontWeight: 800,
        fontSize: tam,
        color: estilo.cor_texto,
        whiteSpace: "nowrap",
        opacity: clamp01((t - t0) / 0.1),
        transform: `scale(${aproxima})`,
      }}
    >
      {icone ? <Icone nome={icone} tamanho={tamIcone} cor={estilo.cor_destaque} /> : null}
      {textoCx}
    </div>
  );
};
