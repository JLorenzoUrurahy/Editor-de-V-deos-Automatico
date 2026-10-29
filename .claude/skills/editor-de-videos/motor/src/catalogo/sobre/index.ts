// Família "sobre": acentos leves sobre a pessoa, sem dividir a tela (palavra,
// ícone, número, chips, tarja) e a palavra gigante atrás da pessoa.
// Descrição, gatilhos na fala e props de cada uma: LEIA.md desta pasta.
import type React from "react";
import type { PropsCena } from "../../tipos";
import { Chips } from "./Chips";
import { Destaque } from "./Destaque";
import { IconePop } from "./IconePop";
import { NumeroPop } from "./NumeroPop";
import { PalavraAtras } from "./PalavraAtras";
import { Tarja } from "./Tarja";

export const SOBRE: Record<string, React.FC<PropsCena>> = {
  destaque: Destaque,
  icone_pop: IconePop,
  numero_pop: NumeroPop,
  chips: Chips,
  tarja: Tarja,
  palavra_atras: PalavraAtras,
};
