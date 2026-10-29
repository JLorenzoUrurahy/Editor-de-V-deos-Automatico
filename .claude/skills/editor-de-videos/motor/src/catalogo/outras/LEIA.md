# Família "outras": lugares, tempo, processo e chamada para ação

Regras comuns:

- **Nomes em tela:** os nomes de estado, país e cidade exibidos vêm dos props (`rotulo` dos pinos e títulos) e são conferidos contra a fala. As siglas usadas para achar a região (`estado: "SP"`, `pais: "BR"`) não aparecem na tela e não são conferidas.
- **Câmera:** o mapa e o globo se movem apenas na entrada (aproximação e giro até o alvo) e depois param.
- **Layout:** `metade` para quase tudo. Use `tela` para mapa com vários pontos, linha do tempo longa e rede com muitos nós.

## Dados geográficos

- **Mundo (`dados/mundo.json`):** países do Natural Earth, escala 1:110m (domínio público), simplificados.
- **Brasil por estado (`dados/brasil-uf.json`):** malha da API pública de malhas do IBGE (servicodados.ibge.gov.br), qualidade mínima. O IBGE permite usar a informação citando a fonte: "Fonte: IBGE".
- **Como regenerar:** `dados/gerar_dados.py`.
- **Durante o render, nada é buscado na internet.**

---

## mapa

Mapa desenhado do Brasil (estados) ou do mundo (países). Na entrada, a câmera aproxima do foco e para; as regiões acendem na cor de destaque no seu `em`, os pinos caem com rótulo e uma rota opcional se desenha entre pontos.

- **Quando usar:** "aqui em São Paulo", "no Nordeste", "no Brasil todo", "do Brasil para Portugal", "atendo clientes em 3 estados".
- **Props:**
  - `regiao` ("brasil" ou "mundo", padrão brasil);
  - `rotulo` (string);
  - `foco` (siglas ou nomes para enquadrar);
  - `destaques` ({estado ou pais, em}[]);
  - `pinos` ({estado, pais ou lon/lat, rotulo, em}[]);
  - `rota` (pontos) e `em_rota` (âncora);
  - `em` (âncora padrão).
- **Crédito:** o mapa do Brasil usa a malha de estados do IBGE e mostra "Fonte: IBGE" pequeno no canto. Não tire: é a condição de uso dos dados.
- **Duração ideal:** de 3 a 5 s.

```json
{"id": "onde", "tipo": "mapa", "de": "w20", "ate": "w30", "layout": "metade",
 "props": {"rotulo": "ONDE ESTÃO OS ALUNOS", "destaques": [{"estado": "SP", "em": "w24"}, {"estado": "MG", "em": "w27"}],
           "pinos": [{"estado": "SP", "rotulo": "SÃO PAULO", "em": "w24"}]}}
```

## globo

Globo em projeção ortográfica que gira até o país (ou ponto) alvo na entrada e para. O alvo acende e recebe pino com rótulo.

- **Quando usar:** fala sobre o mundo ou outro país: "vendo para fora", "lá no Japão", "o mundo todo usa", "clientes em vários países".
- **Props:**
  - `pais` (sigla) ou `lon`/`lat`: o alvo;
  - `rotulo` (string);
  - `destaques` ({pais, em}[]) e `pinos` ({pais ou lon/lat, rotulo, em}[]);
  - `em` (âncora).
- **Duração ideal:** de 3 a 4 s.

```json
{"id": "mundo", "tipo": "globo", "de": "w60", "ate": "w64", "layout": "metade",
 "props": {"pais": "BR", "pinos": [{"pais": "BR", "rotulo": "BRASIL", "em": "w62"}]}}
```

## linha_tempo

Marcos numa linha vertical que se desenha; cada marco (quando + texto) entra no seu `em`, e o mais recente fica em destaque.

- **Quando usar:** "em 2019... em 2021... hoje", "na segunda gravo, na terça edito", história, evolução.
- **Props:**
  - `rotulo` (string);
  - `marcos` ({quando, texto?, em}[]): até 5 em `metade` e 7 em `tela`.
- **Duração ideal:** de 4 a 6 s.

## funil

Etapas que afinam de cima para baixo, cada uma no seu `em`; a última (o resultado) fica na cor de destaque. Com valores, o funil vai para a esquerda e os valores ficam numa coluna à direita.

- **Quando usar:** "de mil visitas, cem viram contatos e dez compram", processo de venda, filtragem.
- **Props:**
  - `rotulo` (string);
  - `etapas` ({texto, valor?, em}[]): de 3 a 5.
- **Duração ideal:** de 3 a 5 s.

## rede

Um centro ligado a vários nós com ícones. Cada ligação se desenha do centro para o nó no `em` dele, e o nó acende. Sem rótulos, os nós ficam em anel; com rótulos, em leque (centro à esquerda e pílulas à direita).

- **Quando usar:** "conecta com tudo", "a IA conversa com seu e-mail, agenda, planilha", integração, automação.
- **Props:**
  - `rotulo` (string);
  - `centro` ({icone, rotulo?}) e `em_centro` (âncora);
  - `nos` ({icone, rotulo?, em}[]): de 3 a 8; com rótulo, até 5 em `metade`.
- **Duração ideal:** de 3 a 5 s.

```json
{"id": "conecta", "tipo": "rede", "de": "w80", "ate": "w92", "layout": "metade",
 "props": {"centro": {"icone": "Bot", "rotulo": "SUA IA"}, "nos": [
   {"icone": "Mail", "rotulo": "E-MAIL", "em": "w84"}, {"icone": "Calendar", "rotulo": "AGENDA", "em": "w86"}]}}
```

## comentario

Campo de comentário com a palavra sendo digitada e enviada; o comentário publicado sobe com um coração. Fica parado até o fim da cena.

- **Quando usar:** "comenta QUERO aqui embaixo", "escreve EU QUERO nos comentários".
- **Props:** `palavra` (string, obrigatório), `rotulo` (string), `em` (âncora).
- **Duração ideal:** do pedido até o final do vídeo.

```json
{"id": "cta", "tipo": "comentario", "de": "w240", "ate": "w248", "layout": "metade",
 "props": {"palavra": "QUERO", "rotulo": "COMENTA AQUI", "em": "w245"}}
```

## seguir_salvar

O botão de seguir, salvar, compartilhar ou curtir é tocado no `em`: o dedo chega, aperta, o botão muda de estado e solta uma onda.

- **Quando usar:** "me segue", "salva esse vídeo", "manda para quem precisa", "deixa o like".
- **Props:**
  - `variante` ("seguir", "salvar", "compartilhar" ou "curtir");
  - `rotulo` (string, o que foi dito, ex. "ME SEGUE");
  - `em` (âncora).
- **Duração ideal:** de 2 a 3 s, no fim.

---

## Outras ideias de motion (para cenas livres)

- **Tempo:**
  - contagem regressiva com urgência;
  - calendário folheando até a data dita;
  - relógio com os ponteiros girando rápido;
  - ampulheta.
- **Lugar:**
  - avião cruzando uma rota;
  - pino caindo numa cidade com ondas;
  - prédios surgindo (cidade grande).
- **Processo:**
  - engrenagens encaixando;
  - linha de montagem com itens passando;
  - peneira separando;
  - ciclo em roda (círculo com setas).
- **Meta e conquista:**
  - alvo com flecha;
  - barra de meta enchendo;
  - pódio;
  - troféu subindo.
- **Chamada para ação:**
  - seta grande apontando para a legenda do post;
  - link na bio piscando uma vez;
  - presente abrindo.
