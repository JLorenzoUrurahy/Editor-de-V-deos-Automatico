// cards_3d: uma grade de cartões com ícones entra em 3D, do fundo para a frente,
// em onda do centro para as bordas; depois o número e o rótulo aparecem no centro.
// Bom para "mais de 30 modelos", "dezenas de ferramentas", "várias receitas".
// props: { total: number, destaque?: string, rotulo?: string, em?: number, icones?: string[] }
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";

const ICONES = ["Mail", "FileText", "ChartColumn", "Calendar", "Users", "Image", "Video", "MessageSquare", "Search", "Briefcase", "Scale", "Stethoscope", "Wallet", "Sparkles", "Bot", "PenTool", "Globe", "Target", "ClipboardList", "Megaphone", "Camera", "Map", "Calculator", "Database", "Code", "Lightbulb", "Rocket", "Shield", "Clock", "Star", "Presentation", "ChartLine"];

export const Cards3D: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const total = Math.max(1, Math.min(40, Number(props.total ?? 12)));
  const destaque = props.destaque as string | undefined;
  const rotulo = props.rotulo as string | undefined;
  const em = (props.em as number | undefined) ?? 1.0;
  exigirDeclarados("cards_3d", textos, [destaque, rotulo]);

  const cols = total > 20 ? 6 : total > 9 ? 4 : 3;
  const rows = Math.ceil(total / cols);
  const gap = 22;
  const lado = Math.min(150, (largura * 1.15 - gap * (cols - 1)) / cols);
  const gradeW = cols * lado + (cols - 1) * gap;
  const gradeH = rows * lado + (rows - 1) * gap;
  // A câmera só se move na entrada (sem balanço parado): inclina de 58° para 38°.
  const camera = molaSemOvershoot(t, 1.4);
  const inclinacao = lerp(58, 38, camera);
  const foco = t >= em ? molaSemOvershoot(t - em, 0.45) : 0;

  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const tamDest = destaque ? caber(estilo, destaque, largura * 0.8, 210, 80) : 0;
  const tamRot = rotulo ? caber(estilo, caixa(rotulo, estilo), largura * 0.9, 58) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1300, perspectiveOrigin: "50% 30%" }}>
      <div
        style={{
          position: "absolute",
          left: (largura - gradeW) / 2,
          top: (altura - gradeH) / 2 + 20,
          width: gradeW,
          height: gradeH,
          transformStyle: "preserve-3d",
          transform: `rotateX(${inclinacao}deg) rotateZ(${lerp(-10, -6, camera)}deg) scale(${lerp(1.05, 1, camera)})`,
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const dist = Math.hypot(c - cx, r - cy);
          const chega = molaSemOvershoot(t - 0.05 - dist * 0.07, 0.6);
          const icone = (props.icones as string[] | undefined)?.[i % ((props.icones as string[] | undefined)?.length || 1)] ?? ICONES[(i * 7) % ICONES.length];
          const acesa = i % 9 === 4;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: c * (lado + gap),
                top: r * (lado + gap),
                width: lado,
                height: lado,
                borderRadius: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: acesa
                  ? `linear-gradient(145deg, ${estilo.cor_destaque}, ${alfa(estilo.cor_destaque, 0.6)})`
                  : `linear-gradient(145deg, ${alfa("#FFFFFF", 0.16)}, ${alfa("#FFFFFF", 0.05)})`,
                border: `1.5px solid ${alfa("#FFFFFF", acesa ? 0.5 : 0.18)}`,
                boxShadow: `0 18px 40px rgba(0,0,0,0.35)`,
                opacity: chega * lerp(1, 0.35, foco),
                transform: `translateZ(${lerp(-900, 0, chega)}px)`,
              }}
            >
              <Icone nome={icone} tamanho={lado * 0.42} cor={acesa ? "#111111" : alfa("#FFFFFF", 0.88)} />
            </div>
          );
        })}
      </div>
      {foco > 0 ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: estilo.fonte, fontWeight: 800 }}>
          <div style={{ position: "absolute", inset: "10% 5%", background: `radial-gradient(closest-side, ${alfa(estilo.cor_fundo, 0.92)}, transparent)`, opacity: foco }} />
          {destaque ? (
            <div style={{ position: "relative", fontSize: tamDest, lineHeight: 1, color: estilo.cor_destaque, textShadow: `0 0 50px ${alfa(estilo.cor_destaque, 0.55)}`, transform: `scale(${lerp(0.6, 1, foco)})`, opacity: foco }}>
              {destaque}
            </div>
          ) : null}
          {rotulo ? (
            <div style={{ position: "relative", marginTop: 12, fontSize: tamRot, color: estilo.cor_texto, letterSpacing: 3, opacity: entra(t, em + 0.2, 0.3) }}>
              {caixa(rotulo, estilo)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
