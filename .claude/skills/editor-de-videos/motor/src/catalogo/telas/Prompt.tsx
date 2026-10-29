// prompt: caixa de pedido para a IA. O texto é digitado letra a letra até
// em_enviar; o botão de enviar é pressionado e a caixa brilha uma vez. Opcional:
// um cartão de resultado sobe embaixo, com as linhas aparecendo em sequência.
// props: { texto: string, rotulo?: string, em_inicio?: number, em_enviar?: number,
//          resultado?: string[], em_resultado?: number }
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaSemOvershoot } from "../../motor/molas";
import { alfa, caber, caixa, contraste, exigirDeclarados } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { caracteresEm, digitado, janela, quebrar, tamanhoQueCabe } from "./comum";

export const Prompt: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const texto = props.texto as string;
  const rotulo = props.rotulo as string | undefined;
  const resultado = (props.resultado as string[] | undefined) ?? [];
  const emInicio = (props.em_inicio as number | undefined) ?? 0.4;
  const emEnviar = (props.em_enviar as number | undefined) ?? emInicio + Math.min(2.4, 0.055 * texto.length + 0.4);
  const emResultado = (props.em_resultado as number | undefined) ?? emEnviar + 0.45;
  exigirDeclarados("prompt", textos, [texto, rotulo, ...resultado]);

  const botao = 84;
  const padX = 34;
  const icone = 46;
  const larguraTexto = largura - 2 * padX - botao - icone - 44;
  const tam = tamanhoQueCabe(estilo, texto, larguraTexto, 60, 44, 3);
  const linhas = quebrar(estilo, texto, larguraTexto, tam);
  const caixaH = Math.max(botao + 56, linhas.length * tam * 1.25 + 64);
  const tamRot = rotulo ? caber(estilo, caixa(rotulo, estilo), largura, 52, 44) : 0;
  const rotH = rotulo ? tamRot * 1.25 + 26 : 0;

  const tamRes = resultado.length ? Math.min(50, ...resultado.map((r) => caber(estilo, r, largura - 150, 50, 42))) : 0;
  const linhasRes = resultado.map((r) => quebrar(estilo, r, largura - 150, tamRes));
  const resH = resultado.length ? linhasRes.reduce((s, l) => s + l.length * tamRes * 1.25 + 22, 0) + 50 : 0;
  const gapRes = resultado.length ? 30 : 0;
  const blocoH = rotH + caixaH + gapRes + resH;
  const y0 = Math.max(0, (altura - blocoH) / 2);

  const n = caracteresEm(t, emInicio, emEnviar - 0.15, texto.length);
  const visivel = digitado(linhas, n);
  const digitando = t >= emInicio && t < emEnviar;
  const aperta = t >= emEnviar ? molaSemOvershoot(t - emEnviar, 0.25) : 0;
  const pressao = t >= emEnviar && t < emEnviar + 0.25 ? Math.sin(Math.PI * ((t - emEnviar) / 0.25)) : 0;
  const brilho = t >= emEnviar ? Math.max(0, 1 - (t - emEnviar) / 0.6) : 0;
  const foco = entra(t, emInicio - 0.2, 0.3);
  const e = entra(t, 0, 0.45);
  const res = entra(t, emResultado, 0.45);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {rotulo ? (
        <div style={{ position: "absolute", left: 0, top: y0, width: largura, textAlign: "center", fontSize: tamRot, color: estilo.cor_destaque, letterSpacing: 3, whiteSpace: "nowrap", opacity: e }}>
          {caixa(rotulo, estilo)}
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: y0 + rotH,
          width: largura,
          height: caixaH,
          boxSizing: "border-box",
          borderRadius: 34,
          display: "flex",
          alignItems: "center",
          gap: 22,
          padding: `0 ${22}px 0 ${padX}px`,
          ...janela(),
          border: `2px solid ${alfa(estilo.cor_destaque, 0.25 + 0.55 * foco)}`,
          boxShadow: `0 18px 40px rgba(0,0,0,0.35), 0 0 ${30 + 50 * brilho}px ${alfa(estilo.cor_destaque, 0.2 * foco + 0.5 * brilho)}`,
          opacity: e,
          transform: `translateY(${lerp(30, 0, e)}px) scale(${1 - 0.02 * pressao})`,
        }}
      >
        <Icone nome="Sparkles" tamanho={icone} cor={estilo.cor_destaque} />
        <div style={{ flex: 1, fontSize: tam, lineHeight: 1.25, color: estilo.cor_texto }}>
          {visivel.length === 0 ? <span style={{ display: "inline-block", width: 4, height: tam * 1.05, backgroundColor: estilo.cor_destaque, verticalAlign: "middle", opacity: foco }} /> : null}
          {visivel.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {l}
              {digitando && i === visivel.length - 1 ? (
                <span style={{ display: "inline-block", width: 4, height: tam * 1.05, marginLeft: 6, backgroundColor: estilo.cor_destaque, verticalAlign: "middle" }} />
              ) : null}
            </div>
          ))}
        </div>
        <div
          style={{
            width: botao,
            height: botao,
            flexShrink: 0,
            borderRadius: botao / 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: n >= texto.length ? estilo.cor_destaque : alfa("#FFFFFF", 0.14),
            transform: `scale(${1 - 0.14 * pressao})`,
            boxShadow: aperta > 0 ? `0 0 ${40 * brilho}px ${alfa(estilo.cor_destaque, 0.7)}` : "none",
          }}
        >
          <Icone nome="ArrowUp" tamanho={44} cor={n >= texto.length ? contraste(estilo.cor_destaque) : alfa("#FFFFFF", 0.6)} traco={2.6} />
        </div>
      </div>
      {resultado.length && t >= emResultado ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: y0 + rotH + caixaH + gapRes,
            width: largura,
            height: resH,
            boxSizing: "border-box",
            borderRadius: 30,
            padding: "25px 34px",
            ...janela(),
            opacity: res,
            transform: `translateY(${lerp(40, 0, res)}px)`,
          }}
        >
          {linhasRes.map((ls, i) => {
            const li = entra(t, emResultado + 0.25 + i * 0.22, 0.35);
            return (
              <div key={i} style={{ display: "flex", gap: 18, alignItems: "flex-start", marginBottom: 22, opacity: li, transform: `translateX(${lerp(-16, 0, li)}px)` }}>
                <div style={{ marginTop: tamRes * 0.22 }}>
                  <Icone nome="CircleCheck" tamanho={tamRes * 0.9} cor={estilo.cor_destaque} />
                </div>
                <div style={{ fontSize: tamRes, lineHeight: 1.25, color: estilo.cor_texto }}>
                  {ls.map((l, k) => (
                    <div key={k} style={{ whiteSpace: "nowrap" }}>
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
