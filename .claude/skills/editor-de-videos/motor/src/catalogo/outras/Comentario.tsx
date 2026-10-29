// comentario: campo de comentário com a palavra sendo digitada e enviada; o
// comentário publicado sobe com um coração. Para "comenta X aqui embaixo".
// Fica parado até o fim da cena.
// props: { palavra: string, rotulo?: string, em?: number }
import type React from "react";
import { clamp01, entra, lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { Icone } from "../../motor/icones";
import { alfa, caber, caixa, contraste, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { ESPACO_ROTULO, tamanhoRotulo } from "./texto";

const POR_LETRA = 0.09;

export const Comentario: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const palavra = (props.palavra as string) ?? "";
  const rotulo = props.rotulo as string | undefined;
  const em = (props.em as number | undefined) ?? 0.5;
  exigirDeclarados("comentario", textos, [palavra, rotulo]);
  const texto = caixa(palavra, estilo);

  const tamRotulo = rotulo ? tamanhoRotulo(estilo, rotulo, largura) : 0;
  const alturaCampo = 140;
  const avatar = 92;
  const botao = 106;
  const larguraTexto = largura - avatar - botao - 90;
  const tamTexto = caber(estilo, texto, larguraTexto, 72, 40);
  const alturaPost = 128;
  const bloco = (rotulo ? tamRotulo * 1.6 : 0) + alturaPost + 26 + alturaCampo;
  const y0 = (altura - bloco) / 2;
  const yPost = y0 + (rotulo ? tamRotulo * 1.6 : 0);
  const yCampo = yPost + alturaPost + 26;

  const digitadas = Math.max(0, Math.min(texto.length, Math.floor((t - em) / POR_LETRA) + 1));
  const envio = em + texto.length * POR_LETRA + 0.3;
  const aperto = t >= envio ? 1 - 0.12 * Math.sin(Math.PI * clamp01((t - envio) / 0.22)) : 1;
  const publicado = molaLeve(t - envio - 0.15, 0.45, 0.05);
  const noCampo = t < envio + 0.15 ? texto.slice(0, t >= em ? digitadas : 0) : "";
  const coracao = molaLeve(t - envio - 0.45, 0.35, 0.08);
  const entrada = entra(t, 0, 0.35);
  const superficie = `linear-gradient(145deg, ${alfa("#FFFFFF", 0.14)}, ${alfa("#FFFFFF", 0.05)})`;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: y0, width: largura, textAlign: "center", fontSize: tamRotulo, color: estilo.cor_destaque, letterSpacing: ESPACO_ROTULO, whiteSpace: "nowrap", opacity: entrada, transform: `translateY(${lerp(18, 0, entrada)}px)` }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      {/* comentário publicado */}
      {t >= envio + 0.15 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: yPost,
            width: largura,
            height: alturaPost,
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "0 26px",
            boxSizing: "border-box",
            borderRadius: 30,
            background: superficie,
            border: `1.5px solid ${alfa(estilo.cor_destaque, 0.55)}`,
            boxShadow: `0 0 34px ${alfa(estilo.cor_destaque, 0.25)}, 0 18px 40px rgba(0,0,0,0.35)`,
            opacity: clamp01(publicado * 1.4),
            transform: `translateY(${lerp(alturaPost * 0.9, 0, publicado)}px) scale(${lerp(0.94, 1, publicado)})`,
          }}
        >
          <div style={{ width: 70, height: 70, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: estilo.cor_destaque }}>
            <Icone nome="User" tamanho={40} cor={contraste(estilo.cor_destaque)} />
          </div>
          <div style={{ flex: 1, fontSize: tamTexto, color: estilo.cor_texto, whiteSpace: "nowrap" }}>{texto}</div>
          <div style={{ transform: `scale(${lerp(0.4, 1, coracao)})`, opacity: clamp01(coracao * 2) }}>
            <Icone nome="Heart" tamanho={54} cor={estilo.cor_destaque} traco={2.6} />
          </div>
        </div>
      ) : null}
      {/* campo */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: yCampo,
          width: largura,
          height: alturaCampo,
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: "0 18px",
          boxSizing: "border-box",
          borderRadius: alturaCampo / 2,
          background: superficie,
          border: `1.5px solid ${alfa("#FFFFFF", 0.22)}`,
          boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
          opacity: entrada,
          transform: `translateY(${lerp(24, 0, entrada)}px)`,
        }}
      >
        <div style={{ width: avatar, height: avatar, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: alfa("#FFFFFF", 0.12), border: `1.5px solid ${alfa("#FFFFFF", 0.25)}` }}>
          <Icone nome="User" tamanho={46} cor={alfa("#FFFFFF", 0.85)} />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", fontSize: tamTexto, color: estilo.cor_texto, whiteSpace: "nowrap" }}>
          {noCampo}
          {/* cursor fixo (sem piscar) enquanto o campo está ativo */}
          {t >= em - 0.2 && t < envio + 0.15 ? <span style={{ display: "inline-block", width: 5, height: tamTexto * 0.95, marginLeft: 6, borderRadius: 2, backgroundColor: estilo.cor_destaque }} /> : null}
        </div>
        <div
          style={{
            width: botao,
            height: botao,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: digitadas > 0 && t >= em ? estilo.cor_destaque : alfa("#FFFFFF", 0.14),
            boxShadow: t >= envio ? `0 0 ${lerp(0, 34, molaSemOvershoot(t - envio, 0.3))}px ${alfa(estilo.cor_destaque, 0.6)}` : "none",
            transform: `scale(${aperto})`,
          }}
        >
          <Icone nome="Send" tamanho={46} cor={digitadas > 0 && t >= em ? contraste(estilo.cor_destaque) : alfa("#FFFFFF", 0.7)} traco={2.4} />
        </div>
      </div>
    </div>
  );
};
