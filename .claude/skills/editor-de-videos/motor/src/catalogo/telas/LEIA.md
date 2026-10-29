# Família "telas": dispositivos e interfaces

Cenas para quando a fala é sobre **ferramenta, app, site, tela, conversa com a IA ou resultado chegando**. Regras comuns:

- **Layout:** `metade` para quase tudo. Use `tela` quando a tela da pessoa precisa ser lida (print com texto pequeno, conversa longa).
- **Texto:** todo texto (rótulo, mensagens, linhas, endereço) vem dos props e é conferido contra a fala. Endereço de site e nome de produto que só estão no briefing vão em `textos_extra` no `cortes.json`.
- **Movimento:** os dispositivos giram ou abrem apenas na entrada e depois ficam parados. A rolagem do `navegador` e a digitação do `prompt` e do `terminal` são movimento de conteúdo, dentro dos tempos dados.
- **Mídia da pessoa** (print, gravação de tela) vai em `imagem` ou `video`, com o caminho do arquivo. O `compor.py` copia o arquivo para a pasta pública. Sem mídia, `celular_3d` mostra uma tela de apps só com ícones. Nunca coloque print de terceiros nem imagem da internet.

---

## celular_3d

Um celular entra girando em 3D e para, mostrando o print ou a gravação de tela da pessoa. O rótulo fica ao lado (em `metade`) ou embaixo (em `tela`).

- **Quando usar:** "no meu celular", "gravei com o celular", "o app que eu uso", "abre o aplicativo".
- **Props:**
  - `imagem` ou `video` (caminho): a tela da pessoa;
  - `icones` (string[], nomes de ícone): tela de apps, se não houver mídia;
  - `rotulo` (string);
  - `lado` ("esquerda" ou "direita", padrão direita): onde fica o celular em `metade`;
  - `em` (âncora): quando o rótulo entra.
- **Duração ideal:** de 3 a 5 s.

```json
{"id": "cel", "tipo": "celular_3d", "de": "w96", "ate": "w106", "layout": "metade",
 "props": {"imagem": "print-app.png", "rotulo": "GRAVANDO COM O MEU CELULAR", "em": "w100"}}
```

## notebook_3d

Um notebook sobe, a tampa abre na dobradiça e a tela mostra o print ou a gravação; com `endereco`, ganha a barra de navegador. Rótulo embaixo.

- **Quando usar:** "no computador", "o painel", "a planilha", "o relatório pronto", "a página no ar".
- **Props:** `imagem` ou `video` (caminho), `endereco` (string), `rotulo` (string), `em` (âncora).
- **Duração ideal:** de 3 a 5 s.

```json
{"id": "painel", "tipo": "notebook_3d", "de": "w30", "ate": "w38", "layout": "metade",
 "props": {"imagem": "painel.png", "rotulo": "O PAINEL PRONTO", "em": "w34"}}
```

## navegador

Janela de navegador com o print da página. Entra inclinada e assenta, rola de cima para baixo entre `em_inicio` e `em_fim` e pode destacar uma região (o resto escurece).

- **Quando usar:** "entra no site", "olha a página", "olha esse botão", "desce até aqui".
- **Props:**
  - `imagem` ou `video` (caminho), `endereco` (string), `rotulo` (string);
  - `rolar` (booleano), `em_inicio` e `em_fim` (âncoras);
  - `destaque` ({x, y, w, h} em frações da área visível) e `em_destaque` (âncora).
- **Layout:** `tela` quando o print tem texto para ler.
- **Duração ideal:** de 3 a 6 s.

```json
{"id": "site", "tipo": "navegador", "de": "w12", "ate": "w24", "layout": "tela",
 "props": {"imagem": "pagina.png", "endereco": "seusite.example", "rotulo": "OLHA O BOTÃO",
           "destaque": {"x": 0.05, "y": 0.62, "w": 0.4, "h": 0.1}, "em_destaque": "w20"}}
```

## chat

Conversa em bolhas entre a pessoa (direita, cor de destaque) e a IA (esquerda). Cada mensagem entra no seu `em`; antes da resposta da IA aparecem os três pontos de "digitando". As antigas sobem para abrir espaço.

- **Quando usar:** "você pede pra ela...", "pergunta pra IA", "eu falei pra ela...". As mensagens repetem o que foi dito, sem resposta inventada.
- **Props:**
  - `mensagens` ({de: "pessoa" ou "ia", texto, em}[]);
  - `nome` (string): o nome no topo, se foi dito.
- **Layout:** `metade` para 2 ou 3 mensagens curtas; `tela` para mais.
- **Duração ideal:** de 3 a 6 s.

```json
{"id": "pedido", "tipo": "chat", "de": "w110", "ate": "w119", "layout": "metade",
 "props": {"mensagens": [{"de": "pessoa", "texto": "edita esse vídeo pra mim", "em": "w112"}]}}
```

## prompt

Caixa de pedido para a IA: o texto é digitado letra a letra até `em_enviar`, o botão é pressionado e a caixa brilha uma vez. Opcional: um cartão de resultado sobe com as linhas em sequência.

- **Quando usar:** "é só pedir", "você escreve o que quer", "manda o comando".
- **Props:**
  - `texto` (string, obrigatório), `rotulo` (string);
  - `em_inicio` e `em_enviar` (âncoras);
  - `resultado` (string[]) e `em_resultado` (âncora).
- **Duração ideal:** de 3 a 5 s.

```json
{"id": "pedir", "tipo": "prompt", "de": "w110", "ate": "w121", "layout": "metade",
 "props": {"texto": "monta uma proposta para Escritório Boa Prosa", "em_inicio": "w111", "em_enviar": "w121"}}
```

## terminal

Janela de terminal escura. As linhas de comando são digitadas a partir do seu `em` (com "$" na cor de destaque); as saídas aparecem prontas. Sucesso ganha um visto e erro, um x vermelho.

- **Quando usar:** conteúdo técnico: "roda esse comando", "instala", "deu erro".
- **Props:**
  - `linhas` ({texto, em, tipo?: "comando", "saida", "sucesso" ou "erro"}[]);
  - `titulo` (string).
- **Duração ideal:** de 3 a 5 s.

## notificacoes

Notificações de celular empilhando. Cada uma surge no topo no seu `em`, as anteriores descem e a mais nova brilha de leve.

- **Quando usar:** "começou a vender", "chegou mensagem", "pagamento aprovado", "chovendo pedido".
- **Props:**
  - `itens` ({titulo, texto?, icone?, em}[]);
  - `rotulo` (string).
- **Duração ideal:** de 3 a 5 s.

```json
{"id": "vendas", "tipo": "notificacoes", "de": "w60", "ate": "w70", "layout": "metade",
 "props": {"itens": [{"titulo": "Nova venda", "texto": "curso de fotografia", "icone": "ShoppingCart", "em": "w62"}]}}
```

## cards_3d

Grade de cartões com ícones que entra em 3D, do fundo para a frente, em onda. Em seguida, o número e o rótulo aparecem no centro.

- **Quando usar:** volume: "mais de 30 modelos", "dezenas de receitas", "todas essas ferramentas".
- **Props:**
  - `total` (número de cartões, até 40);
  - `destaque` (string, ex. "+30") e `rotulo` (string);
  - `em` (âncora): quando o número aparece;
  - `icones` (string[], opcional).
- **Duração ideal:** de 3 a 4 s.

```json
{"id": "modelos", "tipo": "cards_3d", "de": "w162", "ate": "w172", "layout": "metade",
 "props": {"total": 30, "destaque": "+30", "rotulo": "MODELOS", "em": "w166"}}
```

---

## Outras ideias de motion de telas (para cenas livres)

- **Telas e dispositivos:**
  - tablet com caneta desenhando;
  - relógio inteligente com notificação;
  - vários celulares lado a lado mostrando versões diferentes.
- **Interfaces:**
  - cursor clicando e arrastando num print (demonstração de passo);
  - antes e depois deslizando sobre dois prints;
  - formulário sendo preenchido;
  - barra de busca com o termo digitado e resultados caindo;
  - e-mail sendo escrito e enviado;
  - janela de vídeochamada com quadradinhos;
  - planilha com células se preenchendo e a soma aparecendo.
- **Arquivos e mídia:**
  - arquivo arrastado para dentro de uma pasta;
  - pilha de documentos virando um só (resumo).
