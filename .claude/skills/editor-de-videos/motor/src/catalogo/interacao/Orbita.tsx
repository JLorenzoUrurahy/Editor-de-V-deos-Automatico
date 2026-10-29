// orbita: ícones chegam girando em volta da cabeça, na altura da testa, passando por
// trás dela (somem atrás da pessoa) e pela frente; o giro desacelera e eles sobem para
// um arco acima da cabeça, onde param. Rótulo opcional acima do arco.
// Layout "profundidade": cada ícone é desenhado na passada de trás enquanto está atrás
// da cabeça e na da frente no resto do tempo.
// props: { icones: string[] (3 a 6), rotulo?: string, em?: number }
import type React from "react";
import { clamp01, lerp, molaSemOvershoot } from "../../motor/molas";
import { caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { contornoTexto } from "../sobre/comum";
import { Bolha, cabeca, misturar, topoCabeca } from "./comum";

export const Orbita: React.FC<PropsCena> = ({ t, estilo, props, textos, n, rosto, trilha, camada }) => {
  const icones = ((props.icones as string[]) ?? []).slice(0, 6);
  const rotulo = props.rotulo as string | undefined;
  const em = (props.em as number | undefined) ?? 0.2;
  exigirDeclarados("orbita", textos, [rotulo]);
  const N = icones.length;
  if (!N) return null;
  const t0 = Math.max(0, em - 0.35);
  if (t < t0) return null;
  const cab = cabeca(trilha, rosto, t);
  const d = 124;

  // Anel na testa: chega de longe (raio 1,8x) e gira 1,25 volta, desacelerando.
  const chega = molaSemOvershoot(t - t0, 0.6);
  const giro = Math.PI * 2 * 1.25 * (1 - molaSemOvershoot(t - t0, 1.5)) * ((n ?? 0) % 2 ? -1 : 1);
  // Anel na linha do cabelo: na frente, passa pela testa, nunca pelos olhos ou pela boca.
  const centro = { x: cab.x, y: cab.y - cab.s * 0.66 };
  const rx = cab.s * 0.95 * lerp(1.8, 1, chega);
  const ry = cab.s * 0.2;

  // Arco final acima da cabeça (centro mais alto), dentro da zona segura.
  const tamRot = rotulo ? caber(estilo, caixa(rotulo, estilo), 760, 54, 40) : 0;
  const vao = Math.min(150, 760 / Math.max(1, N - 1));
  const baseArco = Math.max(300 + d / 2 + (rotulo ? tamRot * 1.3 + 12 : 0) + 30, topoCabeca(cab) - d / 2 - 22);
  const xMin = 108 + d / 2;
  const xMax = 918 - d / 2;
  const slots = icones.map((_, k) => {
    const u = N > 1 ? (k - (N - 1) / 2) / ((N - 1) / 2) : 0;
    const x = Math.max(xMin, Math.min(xMax, cab.x + (k - (N - 1) / 2) * vao));
    return { x, y: baseArco - 34 * (1 - u * u) };
  });
  const assenta = molaSemOvershoot(t - (t0 + 0.95), 0.6);

  const desenhar = (k: number) => {
    const fi = -Math.PI / 2 + (Math.PI * 2 * k) / N + giro;
    const z = Math.sin(fi);
    const naOrbita = { x: centro.x + rx * Math.cos(fi), y: centro.y + ry * z };
    const pos = misturar(naOrbita, slots[k], assenta);
    const atras = z < 0 && assenta < 0.5;
    const escala = lerp(0.72 + 0.28 * ((z + 1) / 2), 1, assenta);
    return { pos, atras, escala };
  };

  const quais = icones.map((_, k) => k).filter((k) => {
    if (!camada) return true;
    return desenhar(k).atras === (camada === "atras");
  });

  return (
    <div style={{ position: "absolute", inset: 0, opacity: clamp01((t - t0) / 0.15) }}>
      {quais.map((k) => {
        const { pos, atras, escala } = desenhar(k);
        return (
          <div key={k} style={{ position: "absolute", left: pos.x - d / 2, top: pos.y - d / 2, width: d, height: d, transform: `scale(${escala})`, opacity: atras ? 0.9 : 1 }}>
            <Bolha estilo={estilo} icone={icones[k]} d={d} brilho={assenta} apagado={k % 2 === 1} />
          </div>
        );
      })}
      {rotulo && camada !== "atras" && t >= t0 + 1.25 ? (
        <div
          style={{
            position: "absolute",
            left: 108,
            top: baseArco - 34 - d / 2 - 12 - tamRot * 1.2,
            width: 810,
            textAlign: "center",
            fontFamily: estilo.fonte,
            fontWeight: 800,
            fontSize: tamRot,
            lineHeight: 1.1,
            color: estilo.cor_texto,
            letterSpacing: 2,
            opacity: clamp01((t - t0 - 1.25) / 0.15),
            transform: `translateY(${lerp(16, 0, molaSemOvershoot(t - t0 - 1.25, 0.35))}px)`,
            ...contornoTexto(estilo, tamRot),
          }}
        >
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
    </div>
  );
};
