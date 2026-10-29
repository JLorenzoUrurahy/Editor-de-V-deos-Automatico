// Família "outras": lugares (mapa, globo), tempo, processo, chamada para ação.
// Descrição, gatilhos na fala e props de cada uma: LEIA.md desta pasta.
import type React from "react";
import type { PropsCena } from "../../tipos";
import { Comentario } from "./Comentario";
import { Funil } from "./Funil";
import { Globo } from "./Globo";
import { LinhaTempo } from "./LinhaTempo";
import { Mapa } from "./Mapa";
import { Rede } from "./Rede";
import { SeguirSalvar } from "./SeguirSalvar";

export const OUTRAS: Record<string, React.FC<PropsCena>> = {
  mapa: Mapa,
  globo: Globo,
  linha_tempo: LinhaTempo,
  funil: Funil,
  rede: Rede,
  comentario: Comentario,
  seguir_salvar: SeguirSalvar,
};
