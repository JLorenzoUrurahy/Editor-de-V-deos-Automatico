# Família "dados": números, valores e gráficos

Cenas para quando a fala tem **número, valor, proporção ou comparação**. Regras comuns:

- **Opções de formato** vão em `variante` (vertical, pilha, queda...). Essa chave não é tratada como texto exibido.
- **Texto:** todo texto exibido vem dos props e o `compor.py` confere se foi dito no vídeo (ou declarado em `textos_extra`). Escreva o número como foi dito: "R$ 12.400", "87%", "3 mil", "15 minutos".
- **Layout:** `metade` (810 × 580) serve para quase tudo. Use `tela` (810 × 880) quando o gráfico é o assunto por vários segundos ou tem muitos itens.
- **Número:** a cena lê o valor do próprio texto. Prefixo, sufixo, milhar com ponto e decimal com vírgula vêm do texto dito. Nunca invente valor para "completar" um gráfico. Se a fala não deu números, use as variantes sem número (como `linha` com `variante`).
- **Tempos:** `em` e `em_*` recebem o id da palavra (`wNN`) em que o momento forte acontece, normalmente a palavra do próprio número. A cena começa 0,45 s antes do `de` da cena.

---

## numero

Contador grande que termina exatamente quando o número é dito, com rótulo em cima e uma linha de apoio embaixo.

- **Quando usar:** um número isolado e forte.
  - "faturei **12 mil e 400** em 30 dias"
  - "**87%** dos clientes voltaram"
  - "**10 vezes** mais rápido"
  - "**3 mil** seguidores na primeira semana"
- **Props:**
  - `texto` (string, obrigatório): o número como foi dito, com unidade ("R$ 12.400", "87%", "10x", "3 mil");
  - `rotulo` (string): o assunto, curto, em caixa alta ("FATURAMENTO");
  - `sub` (string): complemento dito ("em 30 dias");
  - `em` (âncora, obrigatório): a palavra do número;
  - `de` (número, padrão 0): de onde a contagem parte;
  - `duracao` (s, padrão 1,2): tempo de contagem.
- **Layout:** `metade`, ou `tela` para número único de impacto (até 300 px).
- **Duração ideal:** de 2,5 a 4 s.

```json
{"id": "fat", "tipo": "numero", "de": "w40", "ate": "w48", "layout": "metade",
 "props": {"texto": "R$ 12.400", "rotulo": "faturamento", "sub": "em 30 dias", "em": "w43"}}
```

## barras

Compara itens ditos. Cada barra cresce quando o item é falado, e o valor conta junto. Um item fica em destaque: o marcado com `destaque: true` ou, sem marcação, o maior.

- **Quando usar:** "vídeo dá **62%**, carrossel **25%** e foto **13%**"; "segunda vendi 12, terça 18... quinta **31**"; ranking ou comparação de 2 a 6 itens.
- **Props:**
  - `rotulo` (string): título da comparação;
  - `variante`: `horizontal` (padrão, aguenta nomes longos) ou `vertical` (colunas; de 2 a 5 itens de nome curto);
  - `itens` (lista, obrigatório): `{ rotulo: string, texto: string, valor?: número, em: âncora, destaque?: bool }`. O `valor` só é necessário quando o texto não tem número, e o `em` vai na palavra do valor.
- **Layout:** horizontal em `metade` (até 4 itens) ou `tela` (até 6); vertical em `tela`.
- **Duração ideal:** 0,6 s por item, mais 1,5 s.

```json
{"id": "formatos", "tipo": "barras", "de": "w60", "ate": "w75", "layout": "metade",
 "props": {"rotulo": "alcance por formato", "itens": [
   {"rotulo": "Vídeo", "texto": "62%", "em": "w63"},
   {"rotulo": "Carrossel", "texto": "25%", "em": "w68"},
   {"rotulo": "Foto", "texto": "13%", "em": "w73"}]}}
```

## linha

Gráfico de linha que se desenha, com área suave embaixo. Cada ponto acende quando a linha passa por ele, e o valor final entra numa etiqueta na cor de destaque.

- **Quando usar:**
  - **com números ditos ao longo do tempo:** "em janeiro **2 mil**, fevereiro **5**, março **9**, abril **18 mil**";
  - **sem números:** "cresceu muito", "despencou", "caiu e depois explodiu". Neste caso use `variante` e só o valor final dito.
- **Props:**
  - `rotulo` (string): título;
  - `pontos` (lista): `{ texto?: string, valor?: número, rotulo?: string (eixo, ex. "jan"), em?: âncora }`. Com `em` em todos, a linha chega a cada ponto no seu tempo;
  - `variante` (sem `pontos`): `subida`, `subida_forte`, `queda` ou `virada`;
  - `final` (string): texto da etiqueta final (padrão: o `texto` do último ponto);
  - `em` (âncora): fim do desenho, quando não há `em` nos pontos.
- **Layout:** `metade`.
- **Duração ideal:** de 3 a 5 s.

```json
{"id": "cresc", "tipo": "linha", "de": "w90", "ate": "w112", "layout": "metade",
 "props": {"rotulo": "faturamento", "pontos": [
   {"texto": "R$ 2 mil", "rotulo": "jan", "em": "w93"}, {"texto": "R$ 5 mil", "rotulo": "fev", "em": "w98"},
   {"texto": "R$ 9 mil", "rotulo": "mar", "em": "w103"}, {"texto": "R$ 18 mil", "rotulo": "abr", "em": "w110"}]}}
```
```json
{"id": "custo", "tipo": "linha", "de": "w30", "ate": "w38", "layout": "metade",
 "props": {"rotulo": "custo por cliente", "variante": "queda", "final": "-40%", "em": "w36"}}
```

## percentual

Anel que enche até a porcentagem dita, com o número contando no centro. Com `comparar`, são dois anéis lado a lado, e o principal fica em destaque.

- **Quando usar:**
  - "**73%** das tarefas dá para automatizar";
  - "acerto de **41%** sem IA contra **92%** com IA";
  - "só **8%** chegam ao fim".
- **Props:**
  - `texto` (string "NN%", obrigatório);
  - `rotulo` (string, em cima);
  - `legenda` (string, embaixo do anel);
  - `em` (âncora, obrigatório): o anel termina de encher aqui;
  - `duracao` (s, padrão 1,1);
  - `comparar`: `{ texto, legenda?, em? }`, o anel de referência (neutro, à esquerda).
- **Layout:** `metade`; comparação também em `tela`.
- **Duração ideal:** de 2,5 a 4 s.

```json
{"id": "acerto", "tipo": "percentual", "de": "w120", "ate": "w134", "layout": "metade",
 "props": {"texto": "92%", "legenda": "com IA", "em": "w132", "comparar": {"texto": "41%", "legenda": "sem IA", "em": "w125"}}}
```

## antes_depois

Dois cartões ligados por uma seta. O "antes" entra neutro; no `em`, o "depois" entra em destaque e o "antes" esmaece.

- **Quando usar:**
  - "antes eu levava **8 horas**, hoje faço em **15 minutos**";
  - "era tudo **manual**, agora é **automático**";
  - qualquer virada de estado.
- **Props:**
  - `antes` e `depois` (obrigatórios): `{ texto: string, titulo?: string, icone?: string, itens?: string[] }`. Use `titulo` ("antes", "depois") **só se foi dito**; sem ele, a seta conta a história. Os `itens` são de 1 a 3 detalhes ditos;
  - `em` (âncora): a palavra do "depois";
  - `variante`: `lado` (padrão, textos curtos) ou `pilha` (um em cima do outro: textos longos, itens, ou layout `tela`).
- **Layout:** `lado` em `metade`, `pilha` em `tela`.
- **Duração ideal:** de 3 a 4,5 s.

```json
{"id": "virada", "tipo": "antes_depois", "de": "w200", "ate": "w214", "layout": "metade",
 "props": {"antes": {"texto": "8 horas", "icone": "Clock"}, "depois": {"texto": "15 minutos", "icone": "Zap"}, "em": "w211"}}
```

## de_para

"De X para Y" com o tamanho visível. O valor de antes entra com uma barra cheia; no `em_para`, o valor novo entra em destaque e a barra dele encolhe (ou cresce) até a proporção real. Converte unidades de tempo (segundos a anos) e "mil" ou "milhões".

- **Quando usar:**
  - "de **8 horas** para **15 minutos**";
  - "de **2** para **20 clientes** por semana";
  - "o custo caiu de **R$ 900** para **R$ 446**".
- **Props:**
  - `de` e `para` (strings, obrigatórias);
  - `legenda_de` e `legenda_para` (strings ditas, ex. "planilha" e "com IA");
  - `rotulo` (string);
  - `em_de` (âncora, padrão 0,25 s);
  - `em_para` (âncora, obrigatório);
  - `variante` (`reduz` ou `aumenta`): só quando as unidades não se comparam.
- **Layout:** `metade`.
- **Duração ideal:** de 3 a 4 s.

```json
{"id": "tempo", "tipo": "de_para", "de": "w300", "ate": "w312", "layout": "metade",
 "props": {"de": "8 horas", "para": "15 minutos", "legenda_de": "planilha", "legenda_para": "com IA", "em_de": "w303", "em_para": "w310"}}
```

## escada_valores

Valores ditos em sequência viram barras que sobem, cada uma no instante em que é falada, ligadas por uma seta de tendência. O valor mais recente fica em destaque.

- **Quando usar:** preços ou números em escalada ("planos de **39**, **79**, **149**... até **299**"); "primeiro **10**, depois **50**, depois **200**".
- **Props:**
  - `rotulo` (string);
  - `itens` (lista, obrigatório): `{ texto: string, valor: número, em: âncora }`. O `valor` define a altura e precisa bater com o texto.
- **Layout:** `metade`.
- **Duração ideal:** 0,8 s por valor, mais 1 s.

```json
{"id": "precos", "tipo": "escada_valores", "de": "w128", "ate": "w139", "layout": "metade",
 "props": {"rotulo": "planos", "itens": [
   {"texto": "R$ 39", "valor": 39, "em": "w130"}, {"texto": "R$ 79", "valor": 79, "em": "w131"},
   {"texto": "R$ 149", "valor": 149, "em": "w132"}, {"texto": "R$ 299", "valor": 299, "em": "w139"}]}}
```

## oferta

Preços de referência aparecem e são riscados um a um; o preço da oferta entra "carimbado" na cor de destaque, com o rótulo embaixo.

- **Quando usar:** anúncio de preço, desconto, condição ("por **R$ 79**", "de 199 por **79**", "**preço de lançamento**").
- **Props:**
  - `por` (string, obrigatório);
  - `de` (lista de strings): preços riscados;
  - `rotulo` (string);
  - `em_por` (âncora, obrigatório): a palavra do preço;
  - `em_rotulo` (âncora, padrão `em_por` + 0,3 s).
- **Layout:** `metade`.
- **Duração ideal:** de 3 a 4 s, começando de 1 a 1,5 s antes do preço (os riscos precisam desse tempo).

```json
{"id": "oferta", "tipo": "oferta", "de": "w146", "ate": "w152", "layout": "metade",
 "props": {"de": ["R$ 129", "R$ 179", "R$ 229", "R$ 299"], "por": "R$ 79", "rotulo": "preço de lançamento", "em_por": "w151"}}
```

---

## Outras ideias de motion de dados (cenas livres)

- **Termômetro ou medidor (gauge):** ponteiro que gira até o valor dito ("nível de risco **alto**", "nota **9,2**").
- **Pilha de moedas ou notas** crescendo até o valor ("guardei **R$ 10 mil**").
- **Calendário que vira páginas** até a data ou duração dita ("em **90 dias**").
- **Relógio com ponteiros girando rápido:** tempo economizado ("**20 horas** por mês").
- **Grade de pessoas (100 ícones)** com N acesos: "**8 em cada 10**" ou "**1 a cada 4**".
- **Funil com números em cada etapa:** "1.000 visitas, 100 leads, 10 vendas".
- **Pizza que se monta fatia a fatia** (divisão de orçamento, de tempo).
- **Placar ou ranking que reordena:** item sobe de posição.
- **Contador regressivo:** "faltam **3 dias**".
- **Mapa de calor ou calendário de contribuições** acendendo dias (consistência, "postei **30 dias** seguidos").
- **Balança** pendendo para um lado (custo contra benefício, com valores ditos).
- **Barra de progresso de meta:** "já bati **70%** da meta".
- **Multiplicador:** bloco que se duplica N vezes ("**10x** mais").
- **Comparativo de planos** em colunas com preço riscado e o recomendado em destaque.
- **Gráfico de dispersão:** ponto destacado fora da curva ("o único que...").
