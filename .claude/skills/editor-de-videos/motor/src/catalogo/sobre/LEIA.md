# Família "sobre": acentos sobre a pessoa

São acentos leves que aparecem **sobre o vídeo da pessoa, sem dividir a tela**: a palavra-chave que salta, um ícone, um número, chips, uma tarja. Inclui também a palavra gigante **atrás** da pessoa. Eles dão fluidez entre as cenas grandes (painel em `metade`, `tela`, `foco`) sem tirar a pessoa do quadro.

## Regras comuns

- **Layout:**
  - `"sobre"` para todos, menos `palavra_atras`, que é `"atras"`.
  - A **caixa** (área livre ao redor do rosto) é calculada pelos scripts a partir da posição do rosto: acima da cabeça, na lateral ou no peito. A cena desenha apenas dentro dela e **nunca cobre o rosto**.
  - Caixa larga (acima da cabeça): texto em linha. Caixa estreita e alta (lateral): palavras empilhadas, só para palavras curtas.
- **Ritmo:**
  - um acento por vez;
  - um a cada 3 a 5 s de fala, entre as cenas grandes;
  - nunca dois acentos seguidos do mesmo tipo;
  - `palavra_atras` no máximo uma ou duas vezes por vídeo, no momento mais forte.
- **Duração:** de 1 a 2,5 s. É acento, não cena: entra na palavra dita, fica o tempo de ser lido e sai.
- **Movimento:** entrada curta (0,25 a 0,45 s), que varia com a ordem da cena (`n`): salto, subida ou deslize. Em seguida fica parado, sem flutuar nem pulsar. A saída é do tocador.
- **Legibilidade:** texto solto sempre com contorno escuro e sombra (o fundo é o vídeo). Nada abaixo de 40 px.
- **Texto:** só o que foi dito, como foi dito (o `compor.py` confere). Opções (`variante`, `icone`) não são texto.
- **Tempo:** `em` é o id da palavra (`wNN`) em que o acento acontece. O acento aparece um instante antes, para estar legível quando a palavra soa.

---

## destaque

De 1 a 3 palavras-chave que saltam no espaço livre, quando são ditas.

- **Quando usar:** a palavra que resume a frase.
  - "é **simples**"
  - "o segredo é **consistência**"
  - "**um app só**"
  - "**sem esforço**"
  - "**o mundo todo**"
- **Props:**
  - `texto` (string, obrigatório): de 1 a 3 palavras ditas;
  - `variante`:
    - `"palavra"` (padrão): texto grande na cor de destaque, sem caixa;
    - `"pilula"`: pílula de vidro escuro, com ícone opcional;
    - `"selo"`: tarja inclinada na cor de destaque, para o que é "carimbo";
  - `icone` (nome de ícone, opcional);
  - `em` (âncora).
- **Caixa:** acima da cabeça (melhor) ou lateral (só palavras curtas, até umas 6 letras).
- **Duração ideal:** de 1,2 a 2 s.

```json
{"id": "simples", "tipo": "destaque", "de": "w17", "ate": "w19", "layout": "sobre",
 "props": {"texto": "SIMPLES", "em": "w18"}}
```

## icone_pop

Um ícone num círculo na cor de destaque salta com brilho; o rótulo entra em seguida (ao lado na caixa larga, embaixo na estreita).

- **Quando usar:** objeto ou ideia concreta: "uma **ideia**", "no **celular**", "**dinheiro** entrando", "**tempo**", "**segurança**". Veja a tabela conceito → ícone em `../texto/LEIA.md`.
- **Props:** `icone` (obrigatório), `rotulo` (string, dita), `em` (âncora).
- **Duração ideal:** de 1,2 a 2 s.

```json
{"id": "celular", "tipo": "icone_pop", "de": "w104", "ate": "w107", "layout": "sobre",
 "props": {"icone": "Smartphone", "rotulo": "CELULAR", "em": "w106"}}
```

## numero_pop

Número dito que conta rápido e chega ao valor exato no instante em que é falado, com um único toque de escala; rótulo pequeno embaixo.

- **Quando usar:** número rápido no meio da fala, que não pede uma cena inteira: "por **R$ 79**", "**+30** modelos", "**87%**", "em **3 dias**". Para número que é o assunto por vários segundos, use `numero` (família dados) em `metade` ou `foco`.
- **Props:**
  - `texto` (string, obrigatório): o número como foi dito ("R$ 79", "+30", "87%", "3 mil");
  - `rotulo` (string, dita);
  - `em` (âncora, obrigatório): a palavra do número.
- **Duração ideal:** de 1,5 a 2,5 s.

```json
{"id": "preco", "tipo": "numero_pop", "de": "w150", "ate": "w153", "layout": "sobre",
 "props": {"texto": "R$ 79", "rotulo": "POR MÊS", "em": "w151"}}
```

## chips

Itens (ícone + texto) que entram um a um quando são ditos; o mais recente fica aceso. Na caixa larga ficam em linha (quebram em duas se necessário); na estreita, em coluna. Até 4.

- **Quando usar:** enumeração curta na fala: "seja **dentista**, **médico**, do **financeiro**", "com **e-mail**, **agenda** e **planilha**".
- **Props:** `itens` ({texto, icone?, em}[]), de 2 a 4.
- **Caixa:** acima da cabeça. Na lateral estreita, os textos não cabem em 40 px e apenas os ícones aparecem.
- **Duração ideal:** do primeiro item dito até o último + 0,8 s.

```json
{"id": "publicos", "tipo": "chips", "de": "w78", "ate": "w86", "layout": "sobre",
 "props": {"itens": [{"texto": "DENTISTA", "icone": "Toothbrush", "em": "w80"},
                     {"texto": "MÉDICO", "icone": "Stethoscope", "em": "w81"},
                     {"texto": "FINANCEIRO", "icone": "Landmark", "em": "w85"}]}}
```

## tarja

Faixa de vidro escuro com título e subtítulo, presa à esquerda, que se revela (ou sobe) depois que a barra fina na cor de destaque cresce.

- **Quando usar:** apresentar alguém, um nome ou o tema do vídeo: "eu sou **Isadora Prado**", "hoje o assunto é **X**", "isso se chama **Y**".
- **Props:** `titulo` (string, obrigatório), `sub` (string), `em` (âncora).
- **Caixa:** no peito (abaixo do queixo) ou acima da cabeça.
- **Duração ideal:** de 2 a 3 s.

```json
{"id": "quem", "tipo": "tarja", "de": "w3", "ate": "w9", "layout": "sobre",
 "props": {"titulo": "SEU NOME", "sub": "SUA ÁREA", "em": "w5"}}
```

## palavra_atras

Palavra gigante **atrás da pessoa** (layout `"atras"`): a pessoa recortada fica na frente e cobre parte das letras. A caixa é uma faixa de largura total na altura da cabeça. A segunda linha opcional, menor, fica em cima, porque embaixo a cabeça a cobriria.

- **Quando usar:** a palavra mais forte do vídeo, uma ou duas vezes: o gancho ("é **simples**"), a virada ("comece **hoje**"), o tema ("**IA**").
- **Props:**
  - `texto` (uma palavra, obrigatório);
  - `linha2` (string, dita);
  - `variante`: `"destaque"` (padrão, cor da marca), `"branco"` (branco translúcido) ou `"contorno"` (só o traço; melhor em palavra curta como "IA");
  - `em` (âncora).
- **Entrada:** três jeitos, pela ordem da cena: cresce com desfoque, sobe de trás de uma linha ou entra letra a letra.
- **Duração ideal:** de 1,5 a 3 s. O título do gancho no quadro 0 e a `palavra_atras` na mesma palavra brigam; use um ou outro.

```json
{"id": "hoje", "tipo": "palavra_atras", "de": "w229", "ate": "w233", "layout": "atras",
 "props": {"texto": "HOJE", "linha2": "COMECE", "variante": "branco", "em": "w233"}}
```

---

## Outras ideias de acentos (para cenas livres)

- **Anotações:**
  - seta desenhada apontando para algo na mão da pessoa;
  - círculo riscado em volta de um objeto;
  - sublinhado que se desenha sob a legenda.
- **Reação:**
  - ícone de "certo" ou "errado" carimbado;
  - estrelas de avaliação acendendo;
  - pequenos raios em volta da cabeça (surpresa);
  - interrogação flutuando ao lado (pergunta).
- **Dados rápidos:**
  - mini gráfico de barras ao lado do rosto;
  - termômetro enchendo.
- **Moldura:** cantos de mira (visor de câmera) em volta do rosto num momento de ênfase.
