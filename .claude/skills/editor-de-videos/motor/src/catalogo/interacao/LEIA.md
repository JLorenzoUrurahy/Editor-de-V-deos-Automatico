# Família "interacao": cenas que interagem com a pessoa

São as cenas em que o motion **conversa com o corpo**: nasce da mão, acompanha a cabeça, passa por trás dela e volta na frente. São o tempero do vídeo, não o prato principal.

Regras comuns:
- **Quantas:** de 3 a 5 por vídeo de 1 a 2 minutos, nos gestos e frases mais fortes. Com mais do que isso, vira truque.
- **Onde achar os momentos:** leia junto `.trabalho/gestos.txt` (gestos com tempo e a fala do instante) e a transcrição. O melhor momento é quando gesto e fala coincidem: "um app só" com o indicador levantado, "o mundo todo" com a mão aberta no alto.
- **Layouts:**
  - `interage`: a cena é desenhada sobre a pessoa, na tela toda, seguindo o rosto ou a mão;
  - `profundidade`: a cena é desenhada atrás e na frente da pessoa recortada, e o que passa por trás some atrás dela de verdade.
- **Trilha:** o `compor.py` entrega a trilha do rosto (centro e largura) ou da mão (centro e altura), suavizada. Nas cenas de mão, se a mão não aparecer no trecho, a cena usa a cabeça e não quebra.
- **Movimento:** o elemento acompanha a pessoa, sem balançar sozinho. Tudo que assenta fica dentro da zona segura (x de 108 a 918, y de 300 a 1320). A entrada pode passar um pouco da borda.
- **Texto:** só o que foi dito, como em todo o catálogo.

---

## na_mao

Um objeto nasce da palma quando a mão aparece e flutua logo acima dela, acompanhando a mão. O objeto é um ícone num círculo brilhante, com rótulo opcional, ou uma pílula com texto. Quando a mão sai do quadro, ele fica um instante onde estava e vai, suave, para o alto ao lado da cabeça.

- **Quando usar:**
  - gesto "mão aberta" (melhor acima do rosto ou na altura dele) junto de uma fala sobre algo que a pessoa "mostra" ou "tem": "o mundo todo", "o resultado", "a ideia", "esse método";
  - pessoa segurando algo imaginário.
- **Props:**
  - `icone` (nome de ícone);
  - `texto` (string, dito);
  - `em` (âncora): quando o objeto nasce. Normalmente a palavra dita junto do gesto; sem `em`, nasce quando a mão aparece.
- **Layout:** `interage`, com trilha de mão (`"seguir": "mao"`).
- **Duração ideal:** de 2 a 3 s.

```json
{"id": "globo-mao", "tipo": "na_mao", "de": "w62", "ate": "w66", "layout": "interage", "seguir": "mao",
 "props": {"icone": "Globe", "texto": "O MUNDO TODO", "em": "w63"}}
```

## contagem

Selos numerados (1, 2, 3...) com rótulo curto. Cada um sai da mão, ou do alto da cabeça se não houver mão, no instante em que o item é dito, e voa para o seu lugar. Ficam em fileira acima da cabeça ou, sem espaço em cima, em coluna ao lado. O item atual fica aceso.

- **Quando usar:**
  - gesto "contando nos dedos";
  - fala com sequência: "primeiro... segundo... terceiro", "grava, edita e posta", "dentista, médico, financeiro".
- **Props:**
  - `itens` ({texto, em}[]): até 4 em fileira e 3 em coluna; rótulos de 1 ou 2 palavras.
- **Layout:** `interage`, com trilha de mão (sem mão, usa a cabeça).
- **Duração ideal:** do primeiro ao último item, mais 0,8 s.

```json
{"id": "passos", "tipo": "contagem", "de": "w10", "ate": "w18", "layout": "interage", "seguir": "mao",
 "props": {"itens": [{"texto": "GRAVA", "em": "w11"}, {"texto": "EDITA", "em": "w14"}, {"texto": "POSTA", "em": "w17"}]}}
```

## selo_rosto

Um elemento preso à cabeça que acompanha o movimento da pessoa. Vai do lado que tem espaço na zona segura; sem espaço ao lado, vai acima da cabeça.

- **Variantes:**
  - `selo`: etiqueta na cor de destaque, levemente inclinada;
  - `balao`: balão de fala branco, com o rabicho apontando para a cabeça;
  - `circulo`: círculo "feito à mão" em volta da cabeça, contornando o rosto sem cobri-lo, mais uma seta curva do rótulo até o círculo.
- **Quando usar:**
  - quando a pessoa fala de si: "eu", "sou especialista", "foi aí que eu percebi" → `selo`;
  - frase de reação ou pensamento: "é simples!", "pensa comigo" → `balao`;
  - quando a fala aponta para a própria pessoa ("você pode ser o primeiro", "esse aqui sou eu") → `circulo`.
- **Props:**
  - `texto` (string);
  - `icone` (opcional);
  - `variante` ("selo", "balao" ou "circulo");
  - `lado` ("esquerda", "direita" ou "acima"; padrão automático);
  - `em` (âncora).
- **Layout:** `interage`, com trilha de rosto.
- **Duração ideal:** de 1,5 a 3 s.

```json
{"id": "primeiro", "tipo": "selo_rosto", "de": "w228", "ate": "w233", "layout": "interage", "seguir": "rosto",
 "props": {"texto": "O PRIMEIRO", "variante": "circulo", "em": "w232"}}
```

## orbita

Ícones chegam girando em volta da cabeça, na linha do cabelo: passam por trás dela (somem atrás da pessoa) e pela frente. O giro desacelera, e eles sobem para um arco acima da cabeça, onde param. O rótulo entra acima do arco.

- **Quando usar:** "tudo conectado", "a IA conversa com seu e-mail, agenda e planilha", "várias ferramentas", "tudo na sua cabeça".
- **Props:**
  - `icones` (de 3 a 6 nomes);
  - `rotulo` (string);
  - `em` (âncora).
- **Layout:** `profundidade`, com trilha de rosto.
- **Duração ideal:** de 2,5 a 3,5 s (o giro leva cerca de 1,4 s).

```json
{"id": "conecta", "tipo": "orbita", "de": "w80", "ate": "w90", "layout": "profundidade", "seguir": "rosto",
 "props": {"icones": ["Mail", "Calendar", "FileSpreadsheet", "MessageCircle", "Bot"], "rotulo": "TUDO CONECTADO", "em": "w82"}}
```

## sai_de_tras

Um cartão (ícone + texto) sobe de trás do ombro, escondido pelo corpo e pela cabeça enquanto está atrás. Quando passa do alto da cabeça, vem para a frente com uma leve aproximação e assenta acima dela, do lado escolhido.

- **Quando usar:** revelação, novidade, bônus: "e tem mais", "você ainda ganha", "+30 modelos", "o segredo é".
- **Props:**
  - `texto` (string);
  - `icone` (opcional);
  - `lado` ("esquerda" ou "direita"; padrão: o lado com mais espaço);
  - `em` (âncora): quando ele chega em cima (a subida começa 0,85 s antes).
- **Layout:** `profundidade`, com trilha de rosto.
- **Duração ideal:** de 2 a 3 s.

```json
{"id": "bonus", "tipo": "sai_de_tras", "de": "w160", "ate": "w168", "layout": "profundidade", "seguir": "rosto",
 "props": {"texto": "+30 MODELOS", "icone": "Sparkles", "em": "w166"}}
```

## atravessa

Uma palavra grande entra de um lado, na altura dos olhos, e passa **por trás** da cabeça. Já do outro lado, vem para a frente e sobe para acima da cabeça, onde para. O lado de entrada alterna com a ordem da cena.

- **Quando usar:** a palavra-chave de uma virada ou de um conceito ("constância", "IA", "liberdade"). É mais leve que a `palavra_atras`, pois não fica gigante atrás da pessoa o tempo todo.
- **Props:**
  - `texto` (1 ou 2 palavras);
  - `em` (âncora): quando ela chega em cima (a travessia começa 0,9 s antes).
- **Layout:** `profundidade`, com trilha de rosto.
- **Duração ideal:** de 2 a 3 s.

```json
{"id": "constancia", "tipo": "atravessa", "de": "w179", "ate": "w183", "layout": "profundidade", "seguir": "rosto",
 "props": {"texto": "CONSTÂNCIA", "em": "w181"}}
```

---

## Do gesto à cena

| Em `gestos.txt` | Cena |
|---|---|
| mão aberta, acima ou na altura do rosto | `na_mao` (o objeto da frase) |
| contando nos dedos (2, 3) | `contagem` |
| apontando, na altura do rosto | `na_mao` com ícone, ou `selo_rosto` do lado para onde aponta |
| sem gesto, falando de si | `selo_rosto` |
| sem gesto, várias coisas ligadas | `orbita` |
| sem gesto, revelação ou bônus | `sai_de_tras` |
| sem gesto, palavra-chave | `atravessa` |

## Limitações

- O recorte da pessoa tem borda macia. Elementos rápidos rente ao cabelo podem mostrar um leve halo; por esse motivo as passagens por trás acontecem com velocidade média.
- `contagem`: em fileira, cada selo ocupa a largura do seu rótulo e o tamanho cai até 40 px para tudo caber nos 810 px. Três rótulos longos (como "DENTISTA, MÉDICO, FINANCEIRO") ficam perto do mínimo; prefira rótulos de uma palavra curta. Em coluna (sem espaço acima da cabeça) cabem até 3 itens.
- Mão na borda direita do quadro (comum em quem segura o celular com a esquerda) fica embaixo dos botões do aplicativo. O objeto é puxado para dentro da zona segura e pode ficar um pouco ao lado da mão, em vez de exatamente em cima.
