// Família "dados": números, valores, gráficos.
import type React from "react";
import type { PropsCena } from "../../tipos";
import { AntesDepois } from "./AntesDepois";
import { Barras } from "./Barras";
import { DePara } from "./DePara";
import { EscadaValores } from "./EscadaValores";
import { Linha } from "./Linha";
import { Numero } from "./Numero";
import { Oferta } from "./Oferta";
import { Percentual } from "./Percentual";

export const DADOS: Record<string, React.FC<PropsCena>> = {
  escada_valores: EscadaValores,
  oferta: Oferta,
  numero: Numero,
  barras: Barras,
  linha: Linha,
  percentual: Percentual,
  antes_depois: AntesDepois,
  de_para: DePara,
};
