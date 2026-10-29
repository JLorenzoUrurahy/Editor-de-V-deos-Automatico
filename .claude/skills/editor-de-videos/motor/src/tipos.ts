// Timeline que os scripts da skill geram (.trabalho/timeline.json) e o motor toca.
// Tudo em quadros do vídeo final; nenhum número é escrito à mão.

export type Estilo = {
  /** família da fonte carregada de `arquivo_fonte` */
  fonte: string;
  arquivo_fonte: string;
  cor_destaque: string;
  cor_texto: string;
  /** fundo dos painéis de cena (gradiente de cor_fundo para cor_fundo2) */
  cor_fundo: string;
  cor_fundo2: string;
  cor_contorno: string;
  caixa_alta: boolean;
};

export type Palavra = { texto: string; ini_f: number; fim_f: number };
export type Pagina = { ini_f: number; fim_f: number; palavras: Palavra[] };

export type TipoLayout = "cheio" | "metade" | "tela";
export type Layout = { tipo: TipoLayout; ini_f: number; fim_f: number };

/** Retângulo em px do quadro 1080x1920. */
export type Caixa = { x: number; y: number; w: number; h: number };

/**
 * Onde a cena aparece:
 * - metade: painel em cima, a pessoa embaixo;
 * - tela: painel em tela cheia;
 * - foco: a pessoa escurece ao fundo e a cena ocupa o centro;
 * - sobre: destaque no espaço livre ao redor do rosto (caixa calculada pelos scripts);
 * - atras: entre o fundo e a pessoa (a pessoa recortada fica na frente);
 * - interage: sobre a pessoa, seguindo o rosto ou a mão (trilha);
 * - profundidade: desenhada duas vezes, atrás e na frente da pessoa recortada
 *   (o que passa por trás some atrás da cabeça e volta na frente).
 */
export type LayoutCena = "metade" | "tela" | "foco" | "sobre" | "atras" | "interage" | "profundidade";

/**
 * Caminho do rosto ou da mão no tempo da cena: uma amostra a cada `passo_f` quadros a
 * partir do início da cena; cada ponto é [x, y, tamanho] em px do quadro 1080x1920
 * (centro e altura da mão, ou centro e largura do rosto), já suavizado. `null` = sem
 * detecção naquela amostra.
 */
export type Trilha = { de: "rosto" | "mao"; passo_f: number; pontos: ([number, number, number] | null)[] };

export type Cena = {
  id: string;
  /** componente do catálogo ("escada_valores", ...) ou "livre/<id>" */
  tipo: string;
  ini_f: number;
  fim_f: number;
  layout: LayoutCena;
  /** área da cena em sobre, atras e foco */
  caixa?: Caixa;
  /** rosto (união no tempo da cena) relativo à caixa da cena */
  rosto?: Caixa;
  /** em atras: vídeo da pessoa recortada (WebM com transparência), só do trecho da cena */
  frente?: string;
  /** em sobre: cartão de vidro escuro atrás da cena (para cenas do catálogo feitas para painel) */
  vidro?: boolean;
  /** ordem da cena no vídeo (as cenas variam a entrada com ela) */
  n?: number;
  /** em interage e profundidade: caminho do rosto ou da mão */
  trilha?: Trilha;
  /** tempos já em segundos locais (0 = início da cena) */
  props: Record<string, unknown>;
  /** todo texto que a cena pode mostrar (conferido contra a fala pelos scripts) */
  textos: string[];
};

export type Titulo = { linhas: string[]; tamanho: number; fim_f: number };

/** Efeito sonoro: nome do arquivo em sons/, quadro e volume (0 a 1). */
export type Som = { f: number; nome: string; volume: number };
/** Zoom curto de ênfase na pessoa, centrado no rosto. */
export type Enfase = { ini_f: number; fim_f: number; escala: number; cx: number; cy: number };

export type Timeline = {
  fps: number;
  duracao_f: number;
  aroll: string;
  /** altura do rosto na gravação, de 0 (topo) a 1 (base); posiciona a pessoa na metade de baixo */
  rosto_y: number;
  transicao_f: number;
  estilo: Estilo;
  titulo: Titulo | null;
  paginas: Pagina[];
  cenas: Cena[];
  layouts: Layout[];
  sons?: Som[];
  enfases?: Enfase[];
  /** trechos em que a legenda desce (um destaque ocupa o peito) */
  legenda_baixa?: { ini_f: number; fim_f: number }[];
};

/** O que todo componente de cena recebe. `t` em segundos desde o início da cena. */
export type PropsCena = {
  readonly t: number;
  readonly dur: number;
  readonly largura: number;
  readonly altura: number;
  readonly estilo: Estilo;
  readonly props: Record<string, unknown>;
  readonly textos: string[];
  /** ordem da cena no vídeo, para variar a entrada entre cenas do mesmo tipo */
  readonly n?: number;
  /** rosto relativo à área da cena (sobre e atras) */
  readonly rosto?: Caixa;
  /** interage e profundidade: caminho do rosto ou da mão (use motor/trilha) */
  readonly trilha?: Trilha;
  /** profundidade: qual passada está sendo desenhada (atrás ou na frente da pessoa) */
  readonly camada?: "atras" | "frente";
};
