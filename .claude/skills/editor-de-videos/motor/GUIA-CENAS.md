# Guia de cenas

Vale para as cenas do catálogo (`src/catalogo/`) e para as cenas livres escritas para um vídeo (`.trabalho/cenas/<id>.tsx`). Antes de escrever uma cena, leia também a skill oficial do Remotion, `remotion-best-practices`. O caminho está no SKILL.md, na etapa de motion.

## Contrato

```tsx
import type React from "react";
import type { PropsCena } from "../tipos";            // numa cena livre: "../../tipos"

export const Cena: React.FC<PropsCena> = ({ t, dur, largura, altura, estilo, props, textos }) => { ... };
```

- `t`: segundos desde o início da cena (0 a `dur`). A cena é **função pura de `t`**. Nada de `Math.random`, `Date`, `setTimeout`, `requestAnimationFrame`, `transition` ou `animation` de CSS. Para variar entre itens, use um número derivado do índice.
- Desenhe só dentro de `largura` × `altura`. É a área de conteúdo, já dentro da zona segura:
  - `metade`: 810 × 580;
  - `tela`: 810 × 880.

  O fundo (painel com gradiente) já existe: não pinte fundo de tela inteira.
- **Texto:** só strings vindas de `props`, conferidas com `exigirDeclarados(id, textos, [...])`. O `compor.py` confere se cada texto foi dito no vídeo. A cena nunca escreve texto próprio. Números, rótulos e nomes vêm da fala.
- **Tempos:** chaves `em` ou `em_*` nos props chegam já em segundos locais (no `cortes.json` são ids de palavra). Os momentos fortes da cena caem nesses tempos: o número aparece quando é dito.
- **Saída:** a cena não precisa animar a saída. O tocador faz fade nos últimos 0,25 s.

## Visual

- **Fonte:** `estilo.fonte`, peso 800, a única carregada. Ajuste o tamanho com `caber(estilo, texto, larguraMax, tamanhoMax)`.
- **Tamanhos no quadro de 1080 px:**
  - rótulo, 44 a 58 em caixa alta, com `letterSpacing` de 3 a 4, na cor de destaque;
  - texto principal, 56 a 76;
  - número gigante, 160 a 240;
  - nada abaixo de 40, porque no celular fica ilegível.
- **Cores:**
  - `estilo.cor_destaque` para o que importa agora;
  - `estilo.cor_texto` (branco) para o texto;
  - `alfa("#FFFFFF", 0.7)` para o texto secundário;
  - vermelho `#FF4D4F` só para negativo (riscar, erro, "não").
- **Superfícies (cartões):**
  - `linear-gradient(145deg, alfa("#FFFFFF", 0.14), alfa("#FFFFFF", 0.05))`;
  - borda `1.5px solid alfa("#FFFFFF", 0.18)`, raio de 22 a 28;
  - sombra `0 18px 40px rgba(0,0,0,0.35)`;
  - cartão em destaque: gradiente na cor de destaque com texto `contraste(cor)`.
- **Brilho:** `0 0 40-60px alfa(destaque, 0.45-0.55)` só no elemento principal.
- **Composição:** o conteúdo forma **um bloco centrado** na área, sem buraco vazio. Calcule a altura do bloco e centralize na vertical. A hierarquia é um elemento principal grande e o resto menor.
- **Ícones:** `<Icone nome="Stethoscope" tamanho={..} cor={..} />`. São 1.800+ ícones da biblioteca lucide. Use o nome do ícone, não texto.
- **Mídia da pessoa:** `<Midia src="midia/print.png" largura={..} altura={..} />` serve para imagem e vídeo de tela.
- **Mapa do Brasil:** cena livre que use `catalogo/outras/dados/brasil-uf.json` (malha do IBGE) precisa mostrar "Fonte: IBGE" pequeno no canto, como a cena `mapa`. É a condição de uso dos dados.
- **Nada de logos ou imagens de terceiros:** desenhe com formas, ícones da lucide e a mídia da pessoa.

## Movimento

- **Entradas:** `entra(t, t0, dur)` (mola sem overshoot, de 0,3 a 0,5 s). Em formas e cartões pode usar `molaLeve(t - t0, dur, 0.04-0.06)`; em texto não há overshoot.
- **Escalonamento:** de 0,08 a 0,12 s entre itens.
- **Parado depois de entrar:** sem flutuar, sem pulsar, sem girar sem parar. A câmera 3D só se move na entrada.
- **Uma ideia por cena.** Se a fala muda de assunto, é outra cena.
- **3D:** `perspective` e `transform` de CSS (`rotateX/Y`, `translateZ`, `transformStyle: preserve-3d`) dão celular, notebook, cartões em leque e planos inclinados. É leve e determinístico.

## Utilidades

- `motor/molas`: `entra`, `molaSemOvershoot`, `molaLeve`, `lerp`, `clamp01`, `janela`.
- `motor/util`: `caber`, `medir`, `caixa` (aplica a caixa alta do estilo), `alfa`, `contraste`, `exigirDeclarados`.
- `motor/icones`: `Icone`.
- `motor/midia`: `Midia`, `ehVideo`.

## Conferir

Cada cena do catálogo tem um exemplo em `exemplos/<tipo>.json`, que é a "galeria":

```bash
PY scripts/galeria.py <tipo>
```

O comando gera `~/.editor-de-videos/galeria/<tipo>.jpg`, um quadro a cada 0,4 s. Olhe a folha:
- nada se mexe sozinho depois de entrar?
- tem um bloco só?
- cabe na área?
- dá para ler no tamanho do celular?
- o momento forte cai no `em`?
