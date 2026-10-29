# Família texto: texto e ícones

Cenas para quando a fala traz uma frase forte, uma sequência, uma lista, uma escolha ou um conceito. Todo texto mostrado vem dos props e precisa ter sido dito (ou estar em `textos_extra`, vindo do briefing). Os números dos passos e os ícones são desenho, não texto.

Âncoras: no `cortes.json`, `de`/`ate` da cena e toda chave `em`/`em_*` são ids de palavra (`wNN`). O `compor.py` converte para segundos.

Layouts:
- `metade` (área 810 × 580): cena em cima, pessoa embaixo. É o padrão.
- `tela` (810 × 880): a cena cobre a pessoa. Use para frase longa ou lista com 5 ou mais itens.

## titulo_cinetico

Frase de impacto em letra grande. Cada palavra entra quando é dita, e a palavra-chave ganha uma tarja na cor de destaque, que varre da esquerda para a direita.

- **Quando usar:** fechamento, tese, provocação, a frase que a pessoa repetiria. Exemplos: "comece hoje pelo mais simples", "o simples bem feito vence o perfeito parado", "isso muda tudo".
- **Props:**
  - `palavras` (`{ texto, em, destaque? }[]`), de preferência uma por palavra dita, cada uma com o seu `wNN`;
  - ou `texto` (string) com `em` (as palavras entram em sequência a partir dele) e `destaque` (`string[]`, as palavras-chave);
  - `rotulo?` (string): rótulo pequeno acima.
- **Layout:**
  - `tela` para frase longa: até 5 linhas, letra de até 170 px;
  - `metade` para até cerca de 6 palavras: até 3 linhas, letra de até 136 px.
- **Duração:** o tempo da frase mais 0,8 s. Uma ou duas palavras-chave, no máximo.

```json
{"id": "tese", "tipo": "titulo_cinetico", "de": "w223", "ate": "w233", "layout": "metade",
 "props": {"palavras": [{"texto": "Comece", "em": "w229"}, {"texto": "hoje", "em": "w230"}, {"texto": "pelo", "em": "w231"},
                        {"texto": "mais", "em": "w232"}, {"texto": "simples.", "em": "w233", "destaque": true}]}}
```

## passos

Passos numerados (até 5) em cartões que entram quando cada um é dito. O passo atual fica aceso e os anteriores recuam.

- **Quando usar:** "primeiro... depois... no final...", "são 3 passos", tutoriais e processos.
- **Props:**
  - `itens` (`{ texto, em, icone? }[]`), obrigatório: texto curto, de 1 a 4 palavras;
  - `titulo?` (string).
- **Layout:** `metade` até 3 ou 4 passos curtos; `tela` para 5.
- **Duração:** do primeiro ao último passo, mais 1 s.

```json
{"id": "como", "tipo": "passos", "de": "w31", "ate": "w52", "layout": "metade",
 "props": {"itens": [{"texto": "Grave na vertical", "em": "w31", "icone": "Smartphone"},
                     {"texto": "Peça para a IA", "em": "w40", "icone": "Bot"},
                     {"texto": "Poste", "em": "w50", "icone": "Send"}]}}
```

## lista

Checklist com até 6 itens. Cada item ganha o check quando é dito. Item com `negativo: true` ganha um X vermelho e fica riscado.

- **Quando usar:**
  - benefícios ("corta os erros, legenda sozinha, sem mensalidade");
  - requisitos;
  - o que não fazer;
  - "sem X, sem Y, sem Z" (com `negativo`).
- **Props:**
  - `itens` (`{ texto, em, negativo? }[]`), obrigatório;
  - `titulo?` (string);
  - `todos_visiveis?` (boolean): mostra a lista apagada desde o começo e cada item acende no seu `em`. Bom para "sem isso, sem aquilo".
- **Layout:** `metade` até 4 itens; `tela` para 5 ou 6.
- **Duração:** do primeiro ao último item, mais 1 s.

```json
{"id": "beneficios", "tipo": "lista", "de": "w60", "ate": "w78", "layout": "metade",
 "props": {"itens": [{"texto": "Corta os erros", "em": "w61"}, {"texto": "Legenda sozinha", "em": "w66"},
                     {"texto": "Sem mensalidade", "em": "w75"}]}}
```

## comparacao

A contra B em duas colunas, com título (e ícone) de cada lado e itens com ✓ ou ✗. No `em_vencedor`, o lado vencedor acende e o outro recua.

- **Quando usar:** "antes eu... agora...", "na mão contra com IA", "do jeito antigo ou do jeito novo", "o caro e o barato".
- **Props:**
  - `a` e `b` (`{ titulo, icone?, em?, itens?: { texto, ok?, em? }[] }`), obrigatórios. `ok: false` desenha ✗. Sem `em` no item, os itens entram em sequência depois do título do lado;
  - `vencedor?` (`"a"` ou `"b"`);
  - `em_vencedor?` (âncora).
- **Layout:** `metade`, com títulos de até cerca de 10 letras e itens de 1 a 2 palavras.
- **Duração:** de 3 a 5 s.

```json
{"id": "mao-x-ia", "tipo": "comparacao", "de": "w206", "ate": "w222", "layout": "metade",
 "props": {"a": {"titulo": "Na mão", "icone": "User", "em": "w213", "itens": [{"texto": "Dias", "ok": false}]},
           "b": {"titulo": "IA", "icone": "Bot", "em": "w218", "itens": [{"texto": "Minutos", "ok": true}]},
           "vencedor": "b", "em_vencedor": "w220"}}
```

## grade_icones

Ícones com rótulo (até 9). Cada um entra quando é dito, e o último a entrar fica aceso. A cena escolhe automaticamente o desenho em que todos os rótulos ficam legíveis: cartões, "chips" em 2 colunas ou chips em 1 coluna.

- **Quando usar:** enumeração de públicos, profissões, ferramentas ou setores. Exemplos: "seja você dentista, médico, trabalha no setor financeiro", "funciona no Instagram, no TikTok e no YouTube".
- **Props:**
  - `itens` (`{ icone, texto, em }[]`), obrigatório;
  - `titulo?` (string).
- **Layout:** `metade` até 6 itens; `tela` de 7 a 9. Com palavras longas ("imobiliária"), a cena prefere chips.
- **Duração:** do primeiro ao último item, mais 1 s.

```json
{"id": "publicos", "tipo": "grade_icones", "de": "w77", "ate": "w87", "layout": "metade",
 "props": {"itens": [{"icone": "Toothbrush", "texto": "Dentista", "em": "w79"},
                     {"icone": "Stethoscope", "texto": "Médico", "em": "w80"},
                     {"icone": "Landmark", "texto": "Financeiro", "em": "w85"}]}}
```

## icone_conceito

Um conceito em destaque: um anel na cor de destaque se desenha, o ícone entra no centro e o nome aparece embaixo, grande.

- **Quando usar:** quando a fala apresenta ou nomeia uma ideia. Exemplos: "isso se chama automação", "o segredo é contexto", "segurança".
- **Props:**
  - `icone` (string), obrigatório;
  - `rotulo` (string), obrigatório: de 1 a 2 palavras;
  - `apoio?` (string): linha menor embaixo;
  - `em?` (âncora): quando o conceito é dito. O anel e o ícone chegam cerca de 0,35 s antes.
- **Layout:** `metade`.
- **Duração:** de 2 a 3 s.

```json
{"id": "automacao", "tipo": "icone_conceito", "de": "w64", "ate": "w70", "layout": "metade",
 "props": {"icone": "Workflow", "rotulo": "Automação", "em": "w66"}}
```

## citacao

Uma frase dita, num cartão de citação com aspas grandes. As linhas entram em sequência e as palavras-chave ficam na cor de destaque.

- **Quando usar:** frase de efeito, lição, "como eu sempre digo", frase de outra pessoa citada na fala (o nome também precisa ser dito).
- **Props:**
  - `texto` (string), obrigatório: a frase como foi dita;
  - `destaque?` (`string[]`): palavras-chave;
  - `autor?` (string);
  - `em?` (âncora): início da frase.
- **Layout:** `metade` até cerca de 12 palavras; `tela` até cerca de 20.
- **Duração:** o tempo da frase mais 1 s.

```json
{"id": "frase", "tipo": "citacao", "de": "w216", "ate": "w222", "layout": "metade",
 "props": {"texto": "Quem grava toda semana aprende mais rápido.", "destaque": ["semana"], "em": "w217"}}
```

## alerta

Aviso em cartão:
- **negativo:** vermelho, ícone de alerta e um tranco curto só na entrada;
- **positivo:** cor de destaque e ícone de confirmação.

- **Quando usar:**
  - negativo: "não faça isso", "cuidado", "o erro mais comum", "pare de...";
  - positivo: "isso funciona", "pode fazer", "o certo é".
- **Props:**
  - `texto` (string), obrigatório: até cerca de 6 palavras;
  - `apoio?` (string);
  - `tipo?` (`"negativo"`, o padrão, ou `"positivo"`);
  - `icone?` (string; padrão `TriangleAlert` ou `CircleCheckBig`);
  - `em?` (âncora).
- **Layout:** `metade`, ou `tela` quando é o ponto central do vídeo.
- **Duração:** de 2 a 3 s.

```json
{"id": "erro", "tipo": "alerta", "de": "w101", "ate": "w106", "layout": "metade",
 "props": {"texto": "Não peça só um texto", "apoio": "Dê o contexto", "tipo": "negativo", "em": "w101"}}
```

## Conceito → ícone

Nomes conferidos na biblioteca instalada (lucide). Lista completa: https://lucide.dev/icons. Nome que não existe faz o render falhar com o nome no erro.

| Conceito | Ícone | Conceito | Ícone |
|---|---|---|---|
| dentista | `Toothbrush` | IA, robô | `Bot` |
| médico | `Stethoscope` | cérebro, inteligência | `BrainCircuit` |
| saúde | `HeartPulse` | automação, fluxo | `Workflow` |
| hospital | `Hospital` | rapidez, energia | `Zap` |
| remédio | `Pill` | tempo | `Clock` |
| advogado, justiça | `Scale` | prazo | `Hourglass` |
| jurídico, decisão | `Gavel` | agenda | `CalendarCheck` |
| financeiro, banco | `Landmark` | e-mail | `Mail` |
| dinheiro | `Banknote` | mensagem, WhatsApp | `MessageCircle` |
| economia, poupar | `PiggyBank` | conversa, chat | `MessagesSquare` |
| carteira | `Wallet` | vídeo | `Video` |
| pagamento, cartão | `CreditCard` | câmera, foto | `Camera` |
| vendas, gráfico | `ChartColumn` | celular | `Smartphone` |
| crescimento | `TrendingUp` | computador | `Laptop` |
| queda | `TrendingDown` | código | `Code` |
| lucro | `CircleDollarSign` | dados | `Database` |
| imobiliária, casa | `House` | nuvem | `Cloud` |
| loja | `Store` | segurança | `ShieldCheck` |
| empresa | `Building` | senha, privado | `Lock` |
| escritório, trabalho | `Briefcase` | alerta | `TriangleAlert` |
| educação | `GraduationCap` | erro | `CircleX` |
| curso, livro | `BookOpen` | certo | `CircleCheckBig` |
| ideia | `Lightbulb` | meta, foco | `Target` |
| resultado, prêmio | `Trophy` | lançamento | `Rocket` |
| clientes, equipe | `Users` | pessoa | `User` |
| parceria | `Handshake` | marketing, anúncio | `Megaphone` |
| conteúdo, escrita | `PenTool` | design | `Palette` |
| busca | `Search` | documento | `FileText` |
| planilha | `Sheet` | contrato, assinatura | `FilePen` |
| presente, bônus | `Gift` | favorito | `Star` |
| amor, curtir | `Heart` | mundo | `Globe` |
| lugar | `MapPin` | carro | `Car` |
| viagem | `Plane` | comida, restaurante | `Utensils` |
| academia | `Dumbbell` | ferramenta | `Wrench` |
| configurar | `Settings` | repetir | `Repeat` |
| funil | `Funnel` | mágica, IA criando | `WandSparkles` |
| brilho, novidade | `Sparkles` | | |

Não existem na biblioteca: logos de marcas (Instagram, YouTube e outras), "dente" (use `Toothbrush`), `Home` (use `House`), `AlertTriangle` (use `TriangleAlert`).

## Outras ideias de motion de texto (para cenas livres)

- **Palavra gigante atrás da pessoa:** uma palavra só, imensa e vazada, só com contorno, ocupando o painel quando a fala bate no conceito.
- **Riscar e trocar:** a palavra dita errada é riscada e a certa entra por cima ("não é custo, é investimento").
- **Contagem regressiva de motivos:** "3 motivos", com o número grande trocando 3 → 2 → 1 a cada motivo.
- **Pergunta e resposta:** a pergunta entra em cima, uma pausa, e a resposta "carimba" embaixo.
- **Máquina de escrever:** a frase digitada letra a letra no ritmo da fala, com cursor piscando só enquanto digita.
- **Destaque com sublinhado desenhado:** a frase inteira aparece e um traço se desenha embaixo da palavra-chave no instante em que é dita.
- **Nuvem de palavras ditas:** as palavras de uma enumeração aparecem espalhadas, e a mais importante cresce no centro.
- **Antes e depois em texto:** a frase antiga apagada e riscada, e a nova acesa por cima.
- **Linha com ícones em sequência:** "grava → corta → legenda → posta", com setas que se desenham entre os ícones.
- **Selo:** um carimbo circular girando só na entrada ("feito à mão", "sem mensalidade"), se a frase foi dita.
