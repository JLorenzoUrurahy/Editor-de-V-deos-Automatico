// celular_3d: um celular desenhado em CSS entra girando em 3D e para, mostrando o
// print ou a gravação de tela da pessoa (ou, sem mídia, uma tela de apps só com
// ícones). Rótulo opcional ao lado (ou embaixo, no layout tela).
// props: { imagem?: string, video?: string, icones?: string[], rotulo?: string,
//          lado?: "esquerda" | "direita", em?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { Midia } from "../../motor/midia";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caixa, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { quebrar, SombraChao, tamanhoQueCabe } from "./comum";

const PROPORCAO = 0.49; // largura / altura do aparelho (com a moldura)
const APPS = ["MessageCircle", "Camera", "Mail", "Calendar", "Music", "Map", "Wallet", "ChartColumn", "Video", "ShoppingBag", "Bot", "Settings"];
const CORES_APPS = ["#3DD68C", "#5B5BF0", "#3BC9F5", "#FF6B6B", "#FFB547", "#B07CFF"];

/** O aparelho: moldura, tela, ilha e reflexo. `brilho` (0..1) passa o reflexo uma vez na entrada. */
export const Aparelho: React.FC<{ largura: number; altura: number; brilho: number; children: React.ReactNode }> = ({ largura, altura, brilho, children }) => {
  const borda = largura * 0.034;
  return (
    <div
      style={{
        position: "relative",
        width: largura,
        height: altura,
        borderRadius: largura * 0.16,
        padding: borda,
        boxSizing: "border-box",
        background: "linear-gradient(150deg, #4A4D57 0%, #1A1B20 38%, #0B0C0F 100%)",
        boxShadow: `inset 0 0 0 2px ${alfa("#FFFFFF", 0.14)}, -9px 12px 0 -1px #050608, 0 40px 80px rgba(0,0,0,0.5)`,
      }}
    >
      {/* botões laterais */}
      {[0.2, 0.3, 0.38].map((y, i) => (
        <div key={i} style={{ position: "absolute", left: -4, top: altura * y, width: 5, height: altura * (i ? 0.065 : 0.035), borderRadius: 3, backgroundColor: "#2A2C33" }} />
      ))}
      <div style={{ position: "absolute", right: -4, top: altura * 0.27, width: 5, height: altura * 0.1, borderRadius: 3, backgroundColor: "#2A2C33" }} />
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: largura * 0.13, overflow: "hidden", backgroundColor: "#000" }}>
        {children}
        {/* ilha */}
        <div style={{ position: "absolute", left: "50%", top: largura * 0.035, width: largura * 0.3, height: largura * 0.085, marginLeft: -largura * 0.15, borderRadius: largura * 0.05, backgroundColor: "#000" }} />
        {/* reflexo de vidro: fixo e fraco, mais uma faixa que atravessa só durante a entrada */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 35%)" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)",
            backgroundSize: "300% 100%",
            backgroundPosition: `${lerp(100, 0, brilho)}% 0`,
            opacity: brilho < 1 ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
};

/** Tela de apps sem texto: barra de status, grade de ícones e dock. */
const TelaApps: React.FC<{ largura: number; altura: number; icones: string[]; t: number; estilo: PropsCena["estilo"] }> = ({ largura, altura, icones, t, estilo }) => {
  const cols = 3;
  const lado = largura * 0.2;
  const gap = (largura - cols * lado) / (cols + 1);
  const itens = icones.slice(0, 12);
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(165deg, #343B5C 0%, #1A1D2E 50%, #0E0F16 100%)" }}>
      <div style={{ position: "absolute", left: "-20%", top: "-10%", width: "90%", height: "55%", background: `radial-gradient(closest-side, ${alfa(estilo.cor_destaque, 0.28)}, transparent)` }} />
      {itens.map((nome, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const e = entra(t, 0.55 + i * 0.05, 0.35);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: gap + c * (lado + gap),
              top: altura * 0.13 + r * (lado + gap * 1.15),
              width: lado,
              height: lado,
              borderRadius: lado * 0.26,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(145deg, ${CORES_APPS[i % CORES_APPS.length]}, ${alfa(CORES_APPS[i % CORES_APPS.length], 0.7)})`,
              opacity: e,
              transform: `scale(${lerp(0.6, 1, e)})`,
            }}
          >
            <Icone nome={nome} tamanho={lado * 0.5} cor="#FFFFFF" />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: largura * 0.06, right: largura * 0.06, bottom: largura * 0.06, height: lado * 1.25, borderRadius: lado * 0.4, backgroundColor: alfa("#FFFFFF", 0.14) }} />
    </div>
  );
};

export const Celular3D: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const rotulo = props.rotulo as string | undefined;
  const imagem = (props.imagem ?? props.video) as string | undefined;
  const icones = (props.icones as string[] | undefined) ?? APPS;
  const em = (props.em as number | undefined) ?? 0.7;
  exigirDeclarados("celular_3d", textos, [rotulo]);

  // Lado a lado na metade; empilhado (rótulo embaixo) quando a área é alta.
  const empilhado = Boolean(rotulo) && altura > 700;
  const ladoTexto = props.lado === "esquerda" ? "esquerda" : "direita"; // lado do rótulo
  const sinal = rotulo && !empilhado ? (ladoTexto === "direita" ? 1 : -1) : 0;
  const gap = 48;

  let ph: number;
  let colW = 0;
  let tamRot = 0;
  let linhas: string[] = [];
  if (rotulo && empilhado) {
    tamRot = tamanhoQueCabe(estilo, caixa(rotulo, estilo), largura, 64, 44, 2);
    linhas = quebrar(estilo, caixa(rotulo, estilo), largura, tamRot);
    ph = Math.min(altura - 30 - gap - linhas.length * tamRot * 1.15, largura / PROPORCAO);
  } else {
    ph = altura - 40;
    if (rotulo) {
      colW = largura - ph * PROPORCAO - gap;
      tamRot = tamanhoQueCabe(estilo, caixa(rotulo, estilo), colW, 66, 44, 4);
      linhas = quebrar(estilo, caixa(rotulo, estilo), colW, tamRot);
    }
  }
  const pw = ph * PROPORCAO;
  const larguraTexto = Math.max(0, ...linhas.map((l) => medir(estilo, l, tamRot)));
  const blocoW = rotulo && !empilhado ? pw + gap + larguraTexto : pw;
  // Folga do lado do aparelho: girado em 3D, ele se projeta um pouco além da própria largura.
  const FOLGA = 28;
  const x0 = sinal === 0 ? (largura - blocoW) / 2 : (largura - blocoW - FOLGA) / 2 + (sinal > 0 ? FOLGA : 0);
  const xCel = sinal < 0 ? x0 + larguraTexto + gap : x0;
  const yCel = empilhado ? 10 : (altura - ph) / 2;

  const e = molaSemOvershoot(t - 0.05, 0.95);
  const vira = sinal === 0 ? 1 : sinal; // gira na direção do texto
  const rotY = lerp(-58 * vira, -12 * vira, e);
  const rotX = lerp(14, 6, e);
  const sobe = lerp(170, 0, e);
  const fundo = lerp(-260, 0, e);
  const texto = entra(t, em, 0.4);

  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1700, fontFamily: estilo.fonte, fontWeight: 800 }}>
      <SombraChao x={xCel + pw / 2} y={yCel + ph - 6} largura={pw * 1.1} opacidade={e * 0.9} />
      <div
        style={{
          position: "absolute",
          left: xCel,
          top: yCel,
          width: pw,
          height: ph,
          opacity: Math.min(1, e * 2.5),
          transformStyle: "preserve-3d",
          transform: `translateY(${sobe}px) translateZ(${fundo}px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${-2 * vira * e}deg)`,
        }}
      >
        <Aparelho largura={pw} altura={ph} brilho={molaSemOvershoot(t - 0.25, 1.1)}>
          {imagem ? <Midia src={imagem} largura={pw * 0.932} altura={ph - pw * 0.068} /> : <TelaApps largura={pw * 0.932} altura={ph - pw * 0.068} icones={icones} t={t} estilo={estilo} />}
        </Aparelho>
      </div>
      {rotulo ? (
        <div
          style={{
            position: "absolute",
            left: empilhado ? 0 : sinal > 0 ? x0 + pw + gap : x0,
            top: empilhado ? yCel + ph + gap : 0,
            width: empilhado ? largura : larguraTexto,
            height: empilhado ? undefined : altura,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: empilhado ? "center" : "flex-start",
            opacity: texto,
            transform: `translateX(${empilhado ? 0 : lerp(30 * sinal, 0, texto)}px) translateY(${empilhado ? lerp(20, 0, texto) : 0}px)`,
          }}
        >
          <div style={{ width: 70, height: 8, borderRadius: 4, backgroundColor: estilo.cor_destaque, marginBottom: 22 }} />
          {linhas.map((l, i) => (
            <div key={i} style={{ fontSize: tamRot, lineHeight: 1.12, color: estilo.cor_texto, whiteSpace: "nowrap", textAlign: empilhado ? "center" : "left" }}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
