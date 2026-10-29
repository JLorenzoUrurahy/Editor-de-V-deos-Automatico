// Família "texto": texto cinético, listas, passos, comparações e ícones.
import type React from "react";
import type { PropsCena } from "../../tipos";
import { Alerta } from "./Alerta";
import { Citacao } from "./Citacao";
import { Comparacao } from "./Comparacao";
import { GradeIcones } from "./GradeIcones";
import { IconeConceito } from "./IconeConceito";
import { Lista } from "./Lista";
import { Passos } from "./Passos";
import { TituloCinetico } from "./TituloCinetico";

export const TEXTO: Record<string, React.FC<PropsCena>> = {
  titulo_cinetico: TituloCinetico,
  passos: Passos,
  lista: Lista,
  comparacao: Comparacao,
  grade_icones: GradeIcones,
  icone_conceito: IconeConceito,
  citacao: Citacao,
  alerta: Alerta,
};
