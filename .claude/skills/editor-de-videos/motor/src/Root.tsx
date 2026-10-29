// Feito com Remotion (https://www.remotion.dev). O uso do Remotion segue a licença dele: https://www.remotion.pro/license
import { Composition } from "remotion";
import { Galeria, metadadosGaleria, type PropsGaleria } from "./Galeria";
import { calcularMetadados, Reel } from "./Reel";
import type { Estilo, Timeline } from "./tipos";

const ESTILO: Estilo = {
  fonte: "Plus Jakarta Sans",
  arquivo_fonte: "fontes/PlusJakartaSans-ExtraBold.ttf",
  cor_destaque: "#FFD60A",
  cor_texto: "#FFFFFF",
  cor_fundo: "#0B0C10",
  cor_fundo2: "#1A1C24",
  cor_contorno: "#111111",
  caixa_alta: true,
};

const VAZIA: Timeline = { fps: 30, duracao_f: 90, aroll: "aroll.mp4", rosto_y: 0.45, transicao_f: 14, estilo: ESTILO, titulo: null, paginas: [], cenas: [], layouts: [] };
const GALERIA: PropsGaleria = { tipo: "escada_valores", layout: "metade", dur_s: 3, props: { itens: [] }, textos: [], estilo: ESTILO };

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Reel" component={Reel} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={VAZIA} calculateMetadata={calcularMetadados} />
    <Composition id="Galeria" component={Galeria} durationInFrames={90} fps={30} width={1080} height={1920} defaultProps={GALERIA} calculateMetadata={metadadosGaleria} />
  </>
);
