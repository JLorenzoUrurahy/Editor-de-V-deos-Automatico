// Família "interacao": cenas que interagem com a pessoa: nascem da mão, acompanham
// a cabeça, passam por trás dela e voltam na frente.
// Descrição, gatilhos (na fala e nos gestos) e props de cada uma: LEIA.md desta pasta.
import type React from "react";
import type { PropsCena } from "../../tipos";
import { Atravessa } from "./Atravessa";
import { Contagem } from "./Contagem";
import { NaMao } from "./NaMao";
import { Orbita } from "./Orbita";
import { SaiDeTras } from "./SaiDeTras";
import { SeloRosto } from "./SeloRosto";

export const INTERACAO: Record<string, React.FC<PropsCena>> = {
  na_mao: NaMao,
  contagem: Contagem,
  selo_rosto: SeloRosto,
  orbita: Orbita,
  sai_de_tras: SaiDeTras,
  atravessa: Atravessa,
};
