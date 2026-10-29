// Carrega a fonte da marca (arquivo em .trabalho/fontes, servido como pasta pública).
// Nunca baixa fonte da internet. Nenhuma medição de texto acontece antes da fonte pronta.
import { loadFont } from "@remotion/fonts";
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import type { Estilo } from "../tipos";

const emCurso = new Map<string, Promise<void>>();
const prontas = new Set<string>();

export function useFontePronta(estilo: Estilo): boolean {
  const chave = `${estilo.fonte}|${estilo.arquivo_fonte}`;
  const [pronto, setPronto] = useState(() => prontas.has(chave));
  useEffect(() => {
    if (prontas.has(chave)) {
      setPronto(true);
      return;
    }
    let ativo = true;
    const handle = delayRender(`Fonte ${estilo.fonte}`);
    let promessa = emCurso.get(chave);
    if (!promessa) {
      promessa = loadFont({ family: estilo.fonte, url: staticFile(estilo.arquivo_fonte), weight: "800", format: "truetype", display: "block" }).then(() => {
        prontas.add(chave);
      });
      emCurso.set(chave, promessa);
    }
    promessa
      .then(() => {
        if (ativo) setPronto(true);
      })
      .finally(() => continueRender(handle));
    return () => {
      ativo = false;
    };
  }, [chave, estilo.fonte, estilo.arquivo_fonte]);
  return pronto;
}
