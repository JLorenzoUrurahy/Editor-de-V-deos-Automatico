// Catálogo de cenas prontas, por família. Cada família registra as suas em
// catalogo/<familia>/index.ts. Descrição de cada cena e quando usar: catalogo.md da skill.
import type React from "react";
import type { PropsCena } from "../tipos";
import { DADOS } from "./dados";
import { INTERACAO } from "./interacao";
import { OUTRAS } from "./outras";
import { SOBRE } from "./sobre";
import { TELAS } from "./telas";
import { TEXTO } from "./texto";

const FAMILIAS = { DADOS, TELAS, TEXTO, OUTRAS, SOBRE, INTERACAO };

export const CATALOGO: Record<string, React.FC<PropsCena>> = {};
for (const [familia, cenas] of Object.entries(FAMILIAS)) {
  for (const [tipo, C] of Object.entries(cenas)) {
    if (CATALOGO[tipo]) throw new Error(`Tipo "${tipo}" registrado duas vezes (família ${familia})`);
    CATALOGO[tipo] = C;
  }
}
