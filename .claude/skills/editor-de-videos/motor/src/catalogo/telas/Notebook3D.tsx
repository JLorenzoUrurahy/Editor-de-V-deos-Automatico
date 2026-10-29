// notebook_3d: um notebook em CSS 3D sobe, a tampa abre na dobradiça e a tela
// mostra o print ou a gravação de tela da pessoa (com barra de navegador opcional,
// se vier `endereco`). Rótulo opcional embaixo. Depois de aberto, fica parado.
// props: { imagem?: string, video?: string, endereco?: string, rotulo?: string, em?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { Midia } from "../../motor/midia";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { SombraChao } from "./comum";

const RAZAO_TAMPA = 0.66; // altura / largura da tampa (tela 16:10 + moldura)

export const Notebook3D: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const imagem = (props.imagem ?? props.video) as string | undefined;
  const endereco = props.endereco as string | undefined;
  const rotulo = props.rotulo as string | undefined;
  const em = (props.em as number | undefined) ?? 1.1;
  exigirDeclarados("notebook_3d", textos, [endereco, rotulo]);

  const tamRot = rotulo ? caber(estilo, caixa(rotulo, estilo), largura, 60, 44) : 0;
  const espacoRot = rotulo ? tamRot * 1.2 + 34 : 0;
  // A tampa ocupa a altura que sobra; a base em perspectiva aparece abaixo dela (~BASE da largura).
  const BASE = 0.27;
  const lw = Math.min(largura * 0.86, (altura - espacoRot - 16) / (RAZAO_TAMPA + BASE));
  const lh = lw * RAZAO_TAMPA;
  const alturaBloco = lh + lw * BASE + espacoRot;
  const x = (largura - lw) / 2;
  const y = Math.max(0, (altura - alturaBloco) / 2);

  const sobe = molaSemOvershoot(t, 0.7);
  const abre = molaSemOvershoot(t - 0.25, 0.85);
  const tampa = lerp(-86, 8, abre); // graus na dobradiça: fechado (-86) → aberto, levemente para trás (8)
  const giro = lerp(26, 12, sobe);
  const tela = entra(t, 0.75, 0.35);
  const borda = lw * 0.025;
  const barra = endereco ? Math.max(58, lw * 0.095) : 0;
  const tamEnd = endereco ? caber(estilo, endereco, lw * 0.6, 46, 44) : 0;
  const texto = entra(t, em, 0.4);

  return (
    <div style={{ position: "absolute", inset: 0, perspective: 2200, perspectiveOrigin: "50% 20%", fontFamily: estilo.fonte, fontWeight: 800 }}>
      <SombraChao x={largura / 2} y={y + lh + lw * 0.1} largura={lw * 1.25} opacidade={sobe * 0.8} />
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: lw,
          height: lh,
          transformStyle: "preserve-3d",
          opacity: Math.min(1, sobe * 3),
          transform: `translateY(${lerp(120, 0, sobe)}px) rotateX(-14deg) rotateY(${-giro}deg)`,
        }}
      >
        {/* base: deitada a partir da dobradiça, vindo na direção de quem olha */}
        <div
          style={{
            position: "absolute",
            left: -lw * 0.05,
            top: lh,
            width: lw * 1.1,
            height: lw * 0.6,
            transformOrigin: "50% 0%",
            transform: "rotateX(90deg)",
            borderRadius: lw * 0.03,
            background: "linear-gradient(180deg, #3B3E46, #23252B)",
            boxShadow: `inset 0 0 0 2px ${alfa("#FFFFFF", 0.1)}`,
            overflow: "hidden",
          }}
        >
          {/* teclado e touchpad */}
          {Array.from({ length: 5 }, (_, r) => (
            <div key={r} style={{ position: "absolute", left: lw * 0.08, top: lw * (0.05 + r * 0.055), width: lw * 0.94, height: lw * 0.042, display: "flex", gap: lw * 0.008 }}>
              {Array.from({ length: 14 }, (_, k) => (
                <div key={k} style={{ flex: 1, borderRadius: lw * 0.006, backgroundColor: "#15161A" }} />
              ))}
            </div>
          ))}
          <div style={{ position: "absolute", left: lw * 0.37, top: lw * 0.36, width: lw * 0.36, height: lw * 0.23, borderRadius: lw * 0.02, backgroundColor: alfa("#FFFFFF", 0.06), border: `1.5px solid ${alfa("#FFFFFF", 0.08)}` }} />
        </div>
        {/* tampa: duas faces na dobradiça (tela na frente, alumínio atrás) */}
        <div style={{ position: "absolute", left: 0, top: 0, width: lw, height: lh, transformOrigin: "50% 100%", transformStyle: "preserve-3d", transform: `rotateX(${tampa}deg)` }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: lw * 0.028,
              padding: borda,
              boxSizing: "border-box",
              background: "linear-gradient(160deg, #2A2C33, #0B0C0F)",
              boxShadow: `inset 0 0 0 2px ${alfa("#FFFFFF", 0.12)}`,
              backfaceVisibility: "hidden",
            }}
          >
            <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: lw * 0.012, overflow: "hidden", backgroundColor: "#05060A" }}>
              <div style={{ position: "absolute", inset: 0, opacity: tela }}>
                {endereco ? (
                  <div style={{ height: barra, display: "flex", alignItems: "center", gap: barra * 0.2, padding: `0 ${barra * 0.3}px`, background: "#24272F" }}>
                    {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                      <div key={c} style={{ width: barra * 0.26, height: barra * 0.26, borderRadius: barra, backgroundColor: c }} />
                    ))}
                    <div style={{ flex: 1, marginLeft: barra * 0.3, height: barra * 0.68, borderRadius: barra, backgroundColor: "#15171D", display: "flex", alignItems: "center", gap: 10, padding: `0 ${barra * 0.3}px`, overflow: "hidden" }}>
                      <Icone nome="Lock" tamanho={tamEnd * 0.7} cor={alfa("#FFFFFF", 0.6)} />
                      <span style={{ fontSize: tamEnd, color: alfa("#FFFFFF", 0.85), whiteSpace: "nowrap" }}>{endereco}</span>
                    </div>
                  </div>
                ) : null}
                {imagem ? (
                  <Midia src={imagem} largura={lw - 2 * borda} altura={lh - 2 * borda - barra} />
                ) : (
                  <div style={{ width: "100%", height: lh - 2 * borda - barra, background: `radial-gradient(circle at 30% 30%, ${alfa(estilo.cor_destaque, 0.35)}, #11131B 60%)` }} />
                )}
              </div>
              {/* reflexo fixo e fraco */}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 40%)" }} />
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: lw * 0.028,
              background: "linear-gradient(160deg, #6A6E78, #3A3D45)",
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              boxShadow: `inset 0 0 0 2px ${alfa("#FFFFFF", 0.15)}`,
            }}
          />
        </div>
      </div>
      {rotulo ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: y + alturaBloco - tamRot * 1.2,
            width: largura,
            textAlign: "center",
            fontSize: tamRot,
            lineHeight: 1.2,
            color: estilo.cor_texto,
            whiteSpace: "nowrap",
            opacity: texto,
            transform: `translateY(${lerp(20, 0, texto)}px)`,
          }}
        >
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
    </div>
  );
};
