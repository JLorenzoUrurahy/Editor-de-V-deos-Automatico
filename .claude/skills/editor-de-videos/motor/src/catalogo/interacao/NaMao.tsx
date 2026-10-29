// na_mao: um objeto (ícone num círculo brilhante, ou cartão com texto) nasce da palma
// quando a mão aparece e flutua logo acima dela, acompanhando a mão. Quando a mão
// some, o objeto fica parado um instante onde ela deixou e vai, suave, para o alto
// ao lado da cabeça, até o fim. Sem mão na trilha, nasce do alto da cabeça.
// props: { icone?: string, texto?: string, em?: number }
import type React from "react";
import { lerp, molaLeve, molaSemOvershoot } from "../../motor/molas";
import { caber, caixa, exigirDeclarados, medir } from "../../motor/util";
import type { PropsCena } from "../../tipos";
import { contornoTexto, vidro } from "../sobre/comum";
import { Bolha, cabeca, ladoLivre, misturar, prender, primeiraVista, topoCabeca, ultimaVista } from "./comum";

export const NaMao: React.FC<PropsCena> = ({ t, estilo, props, textos, n, rosto, trilha }) => {
  const icone = props.icone as string | undefined;
  const texto = props.texto as string | undefined;
  const em = props.em as number | undefined;
  exigirDeclarados("na_mao", textos, [texto]);
  const mao = trilha?.de === "mao" ? trilha : undefined;
  const cab = cabeca(trilha?.de === "rosto" ? trilha : undefined, rosto, t);

  const t0 = em ?? primeiraVista(mao, 0) ?? 0.25;
  if (t < t0) return null;

  // Tamanho do objeto: círculo com ícone e, se houver, rótulo em pílula embaixo.
  const d = icone ? 190 : 0;
  const textoCx = texto ? caixa(texto, estilo) : "";
  const tamTexto = texto ? caber(estilo, textoCx, 620, icone ? 52 : 64, 42) : 0;
  const alturaPilula = texto ? tamTexto * 1.65 : 0;
  const w = Math.max(d, texto ? medir(estilo, textoCx, tamTexto) + tamTexto * 1.4 : 0);
  const h = d + (icone && texto ? 14 : 0) + alturaPilula;

  // Onde descansar sem a mão: no alto, do lado livre da cabeça, sem cobrir o rosto.
  const lado = ladoLivre(cab) === "direita" ? 1 : -1;
  const repouso = prender(cab.x + lado * cab.s * 0.42, topoCabeca(cab) - h / 2 - 18, w, h);

  // Onde a mão está (ou esteve) e onde o objeto flutua acima dela.
  const vista = ultimaVista(mao, t);
  const acima = (p: { x: number; y: number; s: number }) => prender(p.x, p.y - p.s * 0.62 - h / 2 + d * 0.15, w, h);
  let alvo = repouso;
  if (vista) {
    const sobreMao = acima(vista.p);
    // Some a mão: fica 0,3 s onde estava e vai para o repouso em 0,6 s.
    alvo = misturar(sobreMao, repouso, molaSemOvershoot(vista.sumiu - 0.3, 0.6));
  }

  // Entrada: nasce da palma (ou do alto da cabeça), cresce e sobe até o lugar.
  const origemMao = ultimaVista(mao, t0);
  const origem = origemMao ? { x: origemMao.p.x, y: origemMao.p.y } : { x: cab.x, y: topoCabeca(cab) + cab.s * 0.2 };
  const sobe = molaSemOvershoot(t - t0, 0.42);
  const pos = misturar(origem, alvo, sobe);
  const cresce = molaLeve(t - t0, 0.45, 0.06);
  const estiloN = (n ?? 0) % 3;
  const giro = estiloN === 1 ? lerp(-140, 0, molaSemOvershoot(t - t0, 0.5)) : 0;
  const escala = estiloN === 2 ? lerp(0.6, 1, cresce) : lerp(0.2, 1, cresce);
  const op = Math.min(1, (t - t0) / 0.1);

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x - w / 2,
        top: pos.y - h / 2,
        width: w,
        height: h,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: icone && texto ? 14 : 0,
        opacity: op,
        transform: `scale(${escala}) rotate(${giro}deg)`,
        transformOrigin: icone ? `50% ${d / 2}px` : "50% 50%",
      }}
    >
      {icone ? <Bolha estilo={estilo} icone={icone} d={d} /> : null}
      {texto ? (
        <div
          style={{
            ...vidro(estilo),
            height: alturaPilula,
            padding: `0 ${tamTexto * 0.7}px`,
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            fontFamily: estilo.fonte,
            fontWeight: 800,
            fontSize: tamTexto,
            color: estilo.cor_texto,
            ...contornoTexto(estilo, tamTexto * 0.5),
          }}
        >
          {textoCx}
        </div>
      ) : null}
    </div>
  );
};
