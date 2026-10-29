# Catálogo de motion

O vídeo fica bom quando a imagem explica o que a fala diz, no momento em que ela diz. Este catálogo tem três partes:
1. como escolher;
2. a lista de gatilhos na fala;
3. as fichas das cenas prontas.

Se o que a fala pede não está nas cenas prontas, escreva uma **cena livre** (veja o final deste arquivo).

## 1. Como escolher

1. Leia a fala que ficou, com os tempos (`.trabalho/plano.json`, campo `palavras`). Marque os momentos que pedem imagem: número, valor, lista, comparação, processo, ferramenta ou tela, lugar, data, conceito novo, erro comum, pedido de ação, palavra de impacto.
2. Para cada momento, ache o gatilho na tabela abaixo e escolha a cena e a **camada**.
3. Monte o ritmo com acentos leves entre as cenas grandes. Deixe trechos só com a pessoa quando ela fala de si, conta uma história ou emociona.

### Camadas (`layout` de cada cena)

| Camada | Como fica | Quando usar | Quantas |
|---|---|---|---|
| `sobre` | destaque pequeno no espaço livre ao redor do rosto, com a pessoa em tela cheia | **acento**: palavra-chave, ícone, número, chips, tarja | a cada 3 a 5 s |
| `atras` | elemento gigante atrás da pessoa, que fica recortada na frente | a palavra mais forte do vídeo (gancho, tese, virada) | 1 ou 2 por vídeo |
| `foco` | a pessoa escurece e desfoca ao fundo; a cena ocupa o centro | número, frase ou oferta que merece parar tudo por 2 a 3 s | 1 ou 2 por minuto |
| `metade` | painel em cima, a pessoa embaixo | explicação visual que leva alguns segundos (gráfico, lista, celular, mapa) | 1 ou 2 por minuto |
| `tela` | painel em tela cheia | o que precisa de espaço: print para ler, título cinético | no máximo 1 por minuto |
| `interage` | elemento que nasce da mão ou fica preso à cabeça e acompanha o movimento | gesto forte (mão aberta, contagem nos dedos), apresentação ("eu", "aqui"), pensamento | de 3 a 5 por vídeo, somando com `profundidade` |
| `profundidade` | elemento que passa por trás da pessoa e volta na frente | momento de virada, lista de ferramentas em volta da cabeça, revelação | idem |

- **Interação com a pessoa:** antes de planejar, leia `.trabalho/gestos.txt`. É a lista de gestos (mão aberta, apontando, contando nos dedos) com o tempo, a altura em relação ao rosto e a fala de cada instante. As melhores interações juntam um gesto e uma frase forte no mesmo instante: a mão aberta levantada em "o mundo todo" vira o globo na mão (`na_mao`), e contar nos dedos vira `contagem`. Sem gesto, use o rosto: `selo_rosto`, ou `orbita`, `sai_de_tras` e `atravessa` em `profundidade`. O script monta a trilha sozinho; `"seguir": "rosto"` ou `"mao"` nos props troca o padrão. Durante uma interação não há ênfase (zoom), porque ela desalinharia o elemento.
- **Área livre:** em `sobre`, o script lê onde está o rosto e põe a cena no espaço livre, acima da cabeça por padrão. Para pedir outro lugar, use `"zona": "acima"`, `"peito"`, `"esquerda"` ou `"direita"`. Se não houver espaço, o script escolhe outra zona e avisa. Destaque no peito faz a legenda descer um pouco.
- **Cenas do catálogo sobre o vídeo:** as cenas feitas para painel também funcionam em `sobre`, com cartão de vidro atrás. As que funcionam bem são `notificacoes`, `comentario`, `seguir_salvar`, `alerta` e `chat` curto. Em `foco`, funcionam bem `numero`, `percentual`, `oferta`, `icone_conceito`, `titulo_cinetico` e `citacao`.

### Ritmo médio (padrão)

- **Frequência:** algo acontece a cada 3 a 5 s. Num vídeo de 60 s, isso dá de 12 a 15 elementos: a maioria acentos `sobre`, 2 ou 3 cenas grandes (`metade`, `tela` ou `foco`), até 2 `atras` e algumas ênfases.
- **Um elemento forte por vez:** nunca duas cenas ao mesmo tempo. Entre uma e outra, pelo menos 0,8 s de respiro.
- **Variedade:**
  - não repita o mesmo tipo seguido;
  - alterne a camada e a zona (acima, lateral);
  - alterne o estilo, com `variante` onde existir.
- **Gancho:** nos 2 ou 3 primeiros segundos, o título do gancho e o rosto. Uma `palavra_atras` ou uma ênfase logo depois prende bem.
- **Final:** se a pessoa pede uma ação ("comenta", "me segue", "salva"), a cena de chamada para ação (`sobre`, zona acima ou peito) fica até o último quadro.

### Ênfase (zoom curto na pessoa)

Um zoom rápido de 1,10 a 1,15 vezes, centrado no rosto, na palavra mais forte de uma frase. Faça de 2 a 4 por minuto, sem cena em painel, foco ou atrás no mesmo instante.

```json
"enfases": [{"em": "w18", "escala": 1.12, "dur_s": 1.2}]
```

### Sons

São automáticos e baixinhos, sob a voz:
- **whoosh** na entrada de painel e foco;
- **whoosh curto** nos acentos;
- **batida** na palavra atrás;
- **pop** nos acentos e ícones;
- **tique** nos itens de lista;
- **plim** em resultado e oferta;
- **clique** em botões.

`"sons": false` desliga, no vídeo inteiro (no `cortes.json`) ou numa cena. O volume final é conferido novamente depois dos sons.

### Tempo e texto

- `de` é a primeira palavra do assunto; `ate` é a última. Cada momento forte se ancora com `em` na palavra em que é dito.
- **Duração:**
  - acento, de 1,2 a 2,5 s;
  - cena grande, o tempo do assunto;
  - a cena começa um pouco antes de `de` e termina um pouco depois de `ate`.
- **Texto:** só o que foi dito, com conectivos ("de", "no") à vontade. O que vem do briefing (nome de produto, endereço de site) vai em `textos_extra`.

## 2. Gatilhos na fala

| Gatilho na fala | Exemplos | Cena pronta | Ideias para cena livre |
|---|---|---|---|
| Preço, valor em dinheiro | "por R$ 79", "custa 2 mil" | `oferta`, `numero` | etiqueta de preço balançando ao cair, nota de dinheiro |
| Valores em sequência | "39, 79, 149" | `escada_valores` | degraus de escada com os valores |
| Desconto, comparação de preço | "de 199 por 79" | `oferta` | carimbo "de/por" |
| Porcentagem | "80% das empresas" | `percentual` | barra de progresso, pizza |
| Número grande, quantidade | "10 mil alunos", "3 horas" | `numero` | pessoinhas multiplicando, contador de painel |
| Muitos itens, volume | "mais de 50 modelos", "dezenas de receitas" | `cards_3d` | estante, pilha de arquivos |
| Crescimento ou queda no tempo | "triplicou em 6 meses" | `linha` | foguete subindo, gráfico de ações |
| Comparar quantidades | "o dobro de", "metade de" | `barras` | balança pendendo, copos enchendo |
| Antes e depois | "antes eu levava... hoje" | `antes_depois` | divisória deslizando sobre duas imagens |
| Redução de tempo ou esforço | "de 8 horas para 15 minutos" | `de_para` | relógio girando rápido, ampulheta |
| Passo a passo | "primeiro... depois... por fim" | `passos` | trilha com marcos, escada |
| Lista, requisitos | "você precisa de 3 coisas" | `lista` | itens caindo numa caixa |
| A contra B | "planilha ou sistema?", "a diferença entre" | `comparacao` | ringue, cara ou coroa |
| Públicos, profissões, áreas | "seja dentista, médico, financeiro" | `grade_icones` | crachás girando |
| Conceito novo | "isso se chama automação" | `icone_conceito` | definição de dicionário |
| Frase de impacto, tese | "o simples bem feito vence o perfeito parado" | `titulo_cinetico`, `citacao` | palavra-chave gigante atrás da pessoa |
| Erro comum, aviso | "não faça isso", "cuidado com" | `alerta` | placa de pare, sirene |
| App, site, ferramenta | "no meu celular", "abre o site" | `celular_3d`, `notebook_3d`, `navegador` | ícone do app pulando da tela |
| Pedir para a IA, conversar | "você pede pra ela...", "pergunta pra IA" | `chat`, `prompt` | balão de pensamento, cursor piscando |
| Código, comando, técnico | "roda esse comando" | `terminal` | blocos de código se encaixando |
| Resultado chegando | "começou a vender", "chovendo mensagem" | `notificacoes` | sino tocando, contador de vendas |
| Lugar | "aqui em São Paulo", "no Brasil todo", "lá nos Estados Unidos" | `mapa`, `globo` | avião cruzando, pino caindo |
| História, evolução, datas | "em 2020... em 2023..." | `linha_tempo` | calendário folheando |
| Funil, filtragem, venda | "de 1000 visitas, 100 viram leads" | `funil` | peneira |
| Integração, automação, conexão | "conecta com tudo", "trabalha sozinho" | `rede` | engrenagens, linha de montagem |
| Pedido de comentário | "comenta QUERO aqui embaixo" | `comentario` | caixa de presente abrindo |
| Seguir, salvar, compartilhar | "me segue", "salva esse vídeo" | `seguir_salvar` | marcador de página caindo |
| Meta, objetivo | "bater a meta de" | | alvo com flecha, barra de meta |
| Urgência, prazo | "só até sexta", "faltam 3 dias" | | contagem regressiva, calendário marcado |
| Segurança, privacidade | "seus dados ficam com você" | `icone_conceito` | cadeado fechando, escudo |
| Energia, limite, cansaço | "você chega no limite" | | bateria descarregando |
| Carregando, processando | "a IA processa tudo" | | barra de progresso, ondas |
| Ideia, descoberta | "aí eu percebi que" | `icone_conceito` | lâmpada acendendo |
| Dinheiro economizado | "economizei 2 mil por mês" | `numero` | cofrinho enchendo |
| Ranking, melhor de | "as 3 melhores" | `passos` (1, 2, 3) | pódio |
| Voz, áudio, podcast | "grava um áudio" | | ondas de som |
| Gravação, vídeo | "grava no celular" | `celular_3d` | claquete batendo |
| E-mail, mensagem | "manda um e-mail" | `notificacoes`, `chat` | envelope voando |
| Agenda, reunião | "marca a reunião" | `icone_conceito` | calendário com evento entrando |
| Documento, contrato, relatório | "gera o relatório" | `notebook_3d` (com print) | folha sendo impressa |
| Planilha, dados | "joga na planilha" | `navegador` (com print), `barras` | células se preenchendo |
| Equilíbrio, prós e contras | "tem vantagem e desvantagem" | `comparacao` | balança |
| Escolha, caminho | "você tem dois caminhos" | `comparacao` | bifurcação |
| Pergunta ao público | "você sabia que...?" | `titulo_cinetico` | ponto de interrogação grande |

A tabela é um ponto de partida, não uma lista fechada. Leia o sentido da frase: "isso mudou meu jogo" pode ser `antes_depois`, `linha` ou `titulo_cinetico`, dependendo do que vem antes e depois.

## 3. Cenas prontas

As fichas completas, com props, layout, duração e exemplo de `cortes.json`, ficam em `motor/src/catalogo/<familia>/LEIA.md`. Leia a ficha de cada cena antes de usar.

Escreva o texto como foi dito: "15 minutos", e não "15 min"; "três mil" ou "3 mil", como saiu na transcrição. Abreviação e palavra nova são recusadas pela trava de texto. Opções de formato (`variante`, `lado`, `regiao`, siglas de `estado` e `pais`) não são texto e não são conferidas.

**Dados** (`motor/src/catalogo/dados/LEIA.md`)
- `escada_valores`: valores em sequência viram barras que sobem, com seta de tendência.
- `percentual`: anel que enche até a porcentagem, com opção de comparar dois.
- `de_para`: "de 8 horas para 15 minutos", com a barra encolhendo na proporção real.
- `barras`: comparação de itens ditos, horizontal ou vertical.
- `oferta`: preços de referência riscados e o preço da oferta carimbado.
- `linha`: gráfico de linha que se desenha; com números ditos ou só a forma (subida, queda, virada).
- `antes_depois`: dois cartões, antes e depois, lado a lado ou em pilha.
- `numero`: contador grande que termina quando o número é dito.

**Telas** (`motor/src/catalogo/telas/LEIA.md`)
- `cards_3d`: grade de cartões em 3D com o número no centro ("+30 modelos").
- `navegador`: janela de navegador que rola e destaca uma região.
- `chat`: conversa com a IA em bolhas, com "digitando".
- `notebook_3d`: notebook abrindo com a tela da pessoa.
- `terminal`: comandos digitados e saídas.
- `notificacoes`: notificações empilhando ("nova venda").
- `prompt`: pedido digitado letra a letra e enviado, com resultado opcional.
- `celular_3d`: celular girando em 3D com o print ou a gravação da pessoa.

**Texto e ícones** (`motor/src/catalogo/texto/LEIA.md`, com a tabela conceito → ícone)
- `icone_conceito`: um conceito grande com ícone.
- `citacao`: frase dita em cartão de citação.
- `titulo_cinetico`: frase de impacto, palavra por palavra, com destaque.
- `alerta`: aviso negativo ("não faça isso") ou positivo.
- `comparacao`: A contra B em duas colunas, com vencedor.
- `passos`: passos numerados entrando quando são ditos.
- `lista`: checklist com check (ou X) em cada item.
- `grade_icones`: ícones com rótulo ("dentista, médico, financeiro").

**Acentos sobre a pessoa e atrás dela** (`motor/src/catalogo/sobre/LEIA.md`)
- `palavra_atras`: palavra gigante atrás da pessoa (layout `atras`).
- `numero_pop`: número contando rápido até o valor dito.
- `tarja`: faixa com título e subtítulo deslizando ("lower third").
- `destaque`: 1 a 3 palavras-chave saltando acima da cabeça (palavra, pílula ou selo).
- `icone_pop`: ícone num círculo com brilho, com rótulo opcional.
- `chips`: itens com ícone entrando um a um.

**Interação com a pessoa** (`motor/src/catalogo/interacao/LEIA.md`)
- `selo_rosto`: selo, balão ou círculo preso à cabeça, acompanhando o movimento.
- `contagem`: selos 1, 2, 3 que aparecem ao lado da mão ou da cabeça, um em cada `em`.
- `na_mao`: objeto que surge acima da palma e acompanha a mão (layout `interage`).
- `sai_de_tras`: cartão que sobe de trás do ombro e vem para a frente (layout `profundidade`).
- `orbita`: ícones girando em volta da cabeça, passando por trás e pela frente (layout `profundidade`).
- `atravessa`: palavra que passa por trás da cabeça e sai do outro lado na frente (layout `profundidade`).

**Lugares, tempo, processo e chamada para ação** (`motor/src/catalogo/outras/LEIA.md`)
- `comentario`: campo de comentário digitando a palavra pedida.
- `funil`: etapas afinando até o resultado.
- `mapa`: Brasil por estado ou mundo, com regiões acesas, pinos e rota.
- `rede`: centro ligado a nós com ícones (integrações, automação).
- `globo`: globo girando até o país e parando.
- `linha_tempo`: marcos numa linha que se desenha.
- `seguir_salvar`: botão de seguir, salvar, compartilhar ou curtir sendo tocado.

Para conferir o desenho de uma cena isolada: `PY scripts/galeria.py <tipo>` gera uma folha de quadros em `~/.editor-de-videos/galeria/`.

## Cena livre

Use quando nenhuma cena pronta serve. Antes de escrever:
1. Leia `motor/GUIA-CENAS.md` (o contrato, o visual e o movimento).
2. Leia a skill oficial de boas práticas do Remotion. O `verificar.py` mostra o caminho; fica em `~/.editor-de-videos/remotion-skills/skills/remotion-best-practices/SKILL.md`. Leia também as regras que ela aponta para o que você vai fazer: 3D, SVG, texto, imagens.

Depois:
1. Escreva `.trabalho/cenas/<id>.tsx` exportando `export const Cena: React.FC<PropsCena>`, com imports relativos a `src/cenas/video/` (`"../../motor/molas"`, `"../../tipos"`).
2. No `cortes.json`: `{"id": "<id>", "tipo": "livre", "de": "wNN", "ate": "wMM", "layout": "metade", "props": {...}}`. Os textos vão nos props, como nas cenas prontas.
3. Confira com `compor.py --amostra wNN wMM --escala 0.5` e olhe os quadros antes do render final.
