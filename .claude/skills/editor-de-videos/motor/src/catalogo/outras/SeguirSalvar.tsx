// seguir_salvar: o botão de seguir, salvar, compartilhar ou curtir é tocado no `em`
// (o dedo chega, aperta, o botão muda de estado e solta uma onda). Para "me segue",
// "salva esse vídeo", "manda para quem precisa".
// props: { variante?: "seguir" | "salvar" | "compartilhar" | "curtir", rotulo?: string, em?: number }
import type React from "react";
import { clamp01, entra, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { Icone } from "../../motor/icones";
import { alfa, caber, caixa, contraste, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";

const ICONES: Record<string, [string, string]> = {
  seguir: ["UserPlus", "UserCheck"],
  salvar: ["Bookmark", "BookmarkCheck"],
  compartilhar: ["Send", "Check"],
  curtir: ["Heart", "Heart"],
};

export const SeguirSalvar: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const variante = (props.variante as string | undefined) ?? "seguir";
  const [antes, depois] = ICONES[variante] ?? ICONES.seguir;
  const rotulo = props.rotulo as string | undefined;
  const em = (props.em as number | undefined) ?? 1.0;
  exigirDeclarados("seguir_salvar", textos, [rotulo]);

  const texto = rotulo ? caixa(rotulo, estilo) : "";
  const tamTexto = rotulo ? caber(estilo, texto, largura - 220, 84, 40) : 0;
  const tamIcone = rotulo ? tamTexto * 1.15 : 120;
  const alturaBotao = rotulo ? Math.max(170, tamTexto * 2.2) : 240;
  const larguraBotao = rotulo ? Math.min(largura, medir(estilo, texto, tamTexto) + tamIcone + 30 + 140) : alturaBotao;
  const cx = largura / 2;
  const cy = altura / 2;
  const x = cx - larguraBotao / 2;
  const y = cy - alturaBotao / 2;

  const tocado = t >= em;
  const aperto = tocado ? 1 - 0.08 * Math.sin(Math.PI * clamp01((t - em) / 0.24)) : 1;
  const troca = molaSemOvershoot(t - em, 0.25);
  const onda = clamp01((t - em) / 0.7);
  const entrada = molaLeve(t, 0.5, 0.05);
  // O dedo chega na entrada, aperta no em e sai.
  const chega = molaSemOvershoot(t - (em - 0.75), 0.65);
  const sai = molaSemOvershoot(t - (em + 0.45), 0.4);
  const dedoX = lerp(cx + larguraBotao / 2 + 140, cx + larguraBotao * 0.18, chega);
  const dedoY = lerp(cy + alturaBotao / 2 + 220, cy + alturaBotao * 0.12, chega) + lerp(0, 160, sai);
  const corFundo = tocado ? estilo.cor_destaque : alfa("#FFFFFF", 0.12);
  const corTexto = tocado ? contraste(estilo.cor_destaque) : estilo.cor_texto;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {onda > 0 && onda < 1 ? (
        <div
          style={{
            position: "absolute",
            left: cx - (larguraBotao / 2) * lerp(1, 1.35, onda),
            top: cy - (alturaBotao / 2) * lerp(1, 1.9, onda),
            width: larguraBotao * lerp(1, 1.35, onda),
            height: alturaBotao * lerp(1, 1.9, onda),
            borderRadius: alturaBotao,
            border: `4px solid ${estilo.cor_destaque}`,
            opacity: 1 - onda,
          }}
        />
      ) : null}
      {/* faíscas: uma vez, no toque */}
      {onda > 0 && onda < 1
        ? Array.from({ length: 10 }, (_, i) => {
            const ang = (Math.PI * 2 * i) / 10 + 0.3;
            const r0 = lerp(alturaBotao * 0.55, alturaBotao * 0.95, onda) + larguraBotao * 0.25 * Math.abs(Math.cos(ang));
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: cx + Math.cos(ang) * r0 - 4,
                  top: cy + Math.sin(ang) * r0 * 0.75 - 12,
                  width: 8,
                  height: 24,
                  borderRadius: 4,
                  backgroundColor: estilo.cor_destaque,
                  opacity: 1 - onda,
                  transform: `rotate(${(ang * 180) / Math.PI + 90}deg)`,
                }}
              />
            );
          })
        : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: larguraBotao,
          height: alturaBotao,
          borderRadius: alturaBotao / 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          backgroundColor: corFundo,
          border: `2px solid ${tocado ? alfa("#FFFFFF", 0.5) : alfa("#FFFFFF", 0.28)}`,
          boxShadow: tocado ? `0 0 50px ${alfa(estilo.cor_destaque, 0.55)}, 0 18px 40px rgba(0,0,0,0.35)` : "0 18px 40px rgba(0,0,0,0.35)",
          opacity: clamp01(entrada * 1.5),
          transform: `scale(${lerp(0.85, 1, entrada) * aperto})`,
        }}
      >
        <div style={{ position: "relative", width: tamIcone, height: tamIcone }}>
          <div style={{ position: "absolute", inset: 0, opacity: 1 - troca }}>
            <Icone nome={antes} tamanho={tamIcone} cor={corTexto} traco={2.4} />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: troca, transform: `scale(${lerp(0.6, 1, troca)})` }}>
            <Icone nome={depois} tamanho={tamIcone} cor={corTexto} traco={2.6} />
          </div>
        </div>
        {rotulo ? <div style={{ fontSize: tamTexto, color: corTexto, whiteSpace: "nowrap" }}>{texto}</div> : null}
      </div>
      {t >= em - 0.75 && sai < 1 ? (
        <div style={{ position: "absolute", left: dedoX, top: dedoY, opacity: entra(t, em - 0.75, 0.2) * (1 - sai), filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.6))", transform: `scale(${tocado && t < em + 0.24 ? 0.9 : 1})` }}>
          <Icone nome="Pointer" tamanho={130} cor="#FFFFFF" traco={2.2} />
        </div>
      ) : null}
    </div>
  );
};
