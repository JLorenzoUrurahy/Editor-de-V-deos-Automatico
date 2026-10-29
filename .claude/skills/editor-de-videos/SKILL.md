---
name: editor-de-videos
description: Edita gravações da própria pessoa falando para a câmera do celular, na vertical, e entrega o reel pronto para postar, com motion que explica a fala. Corta erros, repetições, hesitações e pausas pela transcrição; lê o que é dito e põe animações no instante certo (valores e gráficos, telas de app em 3D, listas, passos, comparações, mapas, chat com IA, chamadas para ação); legenda palavra por palavra com destaque na cor da marca, título de gancho, voz limpa no volume das redes; e revisa tudo antes de entregar. Roda no computador da pessoa (Claude Code, Cowork ou Codex); o vídeo não é enviado para nenhum serviço. Use quando a pessoa tiver um ou mais vídeos dela falando e pedir para editar, cortar, legendar, animar ou deixar pronto para Reels, TikTok ou Shorts. Não use para criar vídeo a partir de texto, sem gravação.
---

# Editor de Vídeos

Gravar é fácil. O que trava é editar: achar os erros, tirar os "ééé", legendar e, sobretudo, colocar na tela o que você está explicando. Esta skill faz isso a partir da gravação do celular:
1. A IA lê a transcrição com o tempo de cada palavra e decide o que fica.
2. Ela escolhe animações para os momentos que pedem imagem. Você diz "39, 79, 149" e as barras sobem; fala "pede pra IA" e aparece a conversa; fala "no celular" e o celular gira em 3D.
3. Programas no seu computador montam o vídeo.
4. Antes de entregar, a própria skill confere o resultado.

O seu vídeo não é enviado para nenhum serviço: transcrição, corte e render rodam no seu computador. A IA da conversa lê só a transcrição e algumas imagens de conferência.

## Como usar (para o usuário)

1. Grave na vertical, falando para a câmera. Errou? Pare, respire e repita a frase inteira: a skill fica com a última versão.
2. Diga onde está o vídeo (ou os vídeos, na ordem) e os nomes que a legenda precisa acertar: marca, produto, seu nome. Se tiver prints ou gravações de tela do que você mostra, mande junto: eles entram nas telas 3D.
3. Receba o vídeo pronto, a lista do que saiu e a lista de animações. Peça ajustes por frase: "tira o gráfico do começo", "volta a parte do preço", "troca o mapa por um número".

Dicas de gravação para passar na primeira vez:
- Gesticule na frente do corpo, não na borda da tela: as animações nascem da sua mão (a borda direita fica embaixo dos botões do app).
- Errou: 2 segundos de pausa e repete a frase desde o começo.
- Lugar silencioso, celular a no máximo um braço de distância.
- Um segundo de silêncio no começo e no fim.
- Celular na altura dos olhos, rosto no terço de cima da tela, com um palmo de espaço acima da cabeça: é ali que os destaques aparecem.

## Fluxo

### Etapa 1: verificar o ambiente (honesto, antes de prometer)

A edição roda no computador da pessoa e precisa de terminal:

- **Claude Code, Cowork ou Codex:** caminho completo. Siga abaixo. No Codex, leia antes "No Codex", logo depois desta lista.
- **Claude.ai no navegador, app sem terminal ou ChatGPT no navegador (Chat ou Work):** diga com clareza que aqui não dá para editar (o vídeo é grande demais para subir na conversa e a edição usa programas do computador). Explique que funciona no Claude Code, no Cowork ou no Codex. Nunca finja que editou.

**Onde já foi testada:** Claude Code e Codex no macOS. Windows, Linux e Cowork estão em teste. Fora do Mac, adapte os comandos ao sistema (no Windows: `py` no lugar de `python3`, caminhos com `\`) e siga as mensagens dos scripts, que mostram o comando certo para cada sistema.

**No Codex:**
- A skill fica em `~/.agents/skills/editor-de-videos` (no Windows, `C:\Users\<usuário>\.agents\skills\editor-de-videos`). Se a pessoa mandar o zip, descompacte nessa pasta (fica fora do projeto, então também pede aprovação). Depois, uma conversa nova enxerga a skill.
- A proteção padrão do terminal do Codex bloqueia duas partes: a leitura do rosto (sem acesso à GPU: "Could not create an NSOpenGLPixelFormat") e o navegador que renderiza as animações ("bootstrap_check_in ... Permission denied"). Rode `verificar.py --instalar`, `editar.py` e `compor.py` fora da proteção: peça a aprovação da pessoa para esses comandos ou para o acesso total na conversa. Explique por que antes de pedir. Sem a aprovação, entregue a reserva (Etapa 7) e diga o motivo.
- O modelo padrão do Codex basta para editar. Os modelos maiores gastam várias vezes mais cota pelo mesmo resultado.

**Comandos longos:** o terminal encerra um comando depois de alguns minutos (no Claude Code, 10). A instalação, o render do vídeo inteiro e, em gravação longa, o corte podem passar disso: rode esses comandos em segundo plano e acompanhe a saída até a última linha. Os demais cabem no limite.

**Espera sem desperdício:** cada conferência da saída relê a conversa inteira e gasta cota da pessoa. Use os tempos previstos de cada etapa (instalação: 5 a 30 minutos; corte: cerca de 1 minuto por minuto de vídeo; render: 4 a 5 minutos por minuto de vídeo) e confira a cada 1 a 2 minutos, com o maior intervalo de espera que a sua ferramenta aceitar. Nunca a cada poucos segundos.

Ache a pasta desta skill (onde está este SKILL.md) e rode, com o caminho entre aspas:

```bash
python3 "<pasta-da-skill>/scripts/verificar.py"            # no Windows: py "<pasta-da-skill>\scripts\verificar.py"
```

- **Última linha FALTA:** siga o que o script imprime. Se faltar ffmpeg, Python (3.10 a 3.12) ou Node.js, ele mostra o comando certo para o sistema da pessoa. Comando que pede senha (Homebrew, `sudo`) a pessoa cola no próprio terminal. Depois de instalar, ela precisa fechar e abrir o terminal de novo.
- **Mac novo:** o primeiro `python3` pode abrir uma janela da Apple pedindo para instalar as "ferramentas de linha de comando". Peça para a pessoa clicar em Instalar, esperar terminar e avisar; depois rode a verificação de novo. Se a verificação disser que falta o Homebrew, ele vem antes de tudo.
- **FALTA processador:** Windows ou Linux em processador ARM não tem a leitura do rosto. Diga isso claramente; não tente contornar.
- **Com tudo ok,** rode `verificar.py --instalar` (em segundo plano). Avise antes: na primeira vez baixa aproximadamente 3,2 GB e leva de 5 a 30 minutos, conforme a internet. Isso inclui o modelo de transcrição, a leitura do rosto e o recorte da pessoa, o motor de animação e o navegador que ele usa para renderizar. Tudo fica em `~/.editor-de-videos` (apagar a pasta desfaz). Se cair no meio, rode de novo: o download continua de onde parou.
- **Sem Node.js:** a instalação prepara só a parte de transcrição e corte, e a linha "SÓ CORTE E LEGENDA" mostra o Python do ambiente. Dá para entregar o vídeo cortado e legendado, sem animação (Etapa 7, reserva). Para as animações, instale o Node.js e rode `--instalar` de novo.
- **Última linha PRONTO:** ela mostra o Python do ambiente. Use esse caminho (chamado de `PY` abaixo) para todos os outros scripts.

**Licença do motor de animação (diga uma vez, na primeira edição):** as animações usam o Remotion. Ele é gratuito para pessoa física, empresa ou equipe de até 3 pessoas e organização sem fins lucrativos. Com 4 pessoas ou mais (contando sócios, funcionários e freelancers), a empresa precisa de uma licença paga do Remotion (remotion.pro/license). Sem o Remotion, a skill ainda corta e legenda, sem animação (Etapa 7, reserva).

### Etapa 2: briefing (uma mensagem, só o que faltar)

1. O arquivo, ou os arquivos e a ordem.
2. Termos que a legenda precisa acertar: marca, produto, nomes próprios, siglas.
3. Prints, gravações de tela, foto do produto ou logo que possam aparecer nas animações.
4. Cor da marca (#RRGGBB). Se a pessoa tiver um arquivo de identidade visual (um `design.json`, por exemplo), use a cor de destaque dele. Sem cor: amarelo `#FFD60A`.
5. Algo que não pode sair (uma frase, o CTA)?

### Etapa 3: transcrever

```bash
PY "<pasta-da-skill>/scripts/transcrever.py" VIDEO [VIDEO2 ...] --termos "Marca, Produto, Nome"
```

Leva cerca de 40 s para 2 minutos de fala num computador recente. Cria a pasta `<video>-editado/` ao lado do vídeo. Leia **inteiro** o `.trabalho/transcricao.txt`: uma linha por frase, com id (`f03`), tempo e as palavras (`w40–w52`). Para cortes finos, `.trabalho/palavras.txt` tem uma palavra por linha e marca `· pausa` onde a fala para.

Marcas na transcrição:
- `«palavra»`: recuperada; o Whisper tinha engolido. Costuma ser exatamente a repetição de um erro.
- No topo, "Prováveis repetições": candidatos a erro de gravação.
- `⟨palavra⟩`: confiança baixa; confira o sentido.
- `«ééé»`: hesitação sem palavra. Sai sozinha.

### Etapa 4: decidir os cortes

Escreva `.trabalho/cortes.json`. Tudo que não estiver em `remover` fica. Pausas longas, silêncio de começo e fim e hesitações saem sozinhos.

Regras de corte:
- **Erro e repetição:** fica a última versão completa da frase. Remova as tentativas anteriores inteiras, inclusive o pedaço solto antes da repetição ("adicionando ela no meu · no meu vídeo": sai o primeiro "no meu"). Confira o sentido: repetição de efeito ("não é só isso que você vai ganhar. Você vai ganhar mais...") não é erro.
- **Fala dirigida à edição** ("isso aqui vai ter que cortar", "de novo", "corta essa parte"): sai inteira.
- **Muleta** ("né", "tipo", "então" sobrando): só sai se estiver isolada entre pausas, nunca no meio de uma frase.
- **Conteúdo:** não corte ideia para encurtar, a menos que a pessoa peça.
- **Corte limpo:** prefira fronteiras onde `palavras.txt` mostra `· pausa`. Corte sem pausa pode comer sílaba.
- **Correção de grafia** (`correcoes`): só quando a transcrição escreveu errado o que foi dito (nome, termo, palavras grudadas: "coiá" → "com a IA"). Nunca troque o que foi dito.
- **Título do gancho:** de 3 a 7 palavras ditas nos primeiros segundos, contíguas, que façam a pessoa parar de rolar. Se não houver frase boa no começo, fica sem título. Não invente.

```json
{
  "remover": [
    {"de": "f02", "motivo": "começo interrompido"},
    {"de": "w37", "ate": "w38", "motivo": "repetição"}
  ],
  "correcoes": {"w21": "com a IA."},
  "titulo": {"de": "w17", "ate": "w21", "duracao_s": 2.5},
  "cor_destaque": "#FFD60A",
  "zoom": true,
  "limpeza_voz": true,
  "caixa_alta": true
}
```

- `de`/`ate`: id de linha (`f03`) ou de palavra (`w40`); faixas inclusivas.
- `zoom`: alterna o enquadramento entre 100% e 110% a cada corte, para o corte seco não parecer um pulo.
- `limpeza_voz`: redução de ruído leve.
- `caixa_alta`: legenda em maiúsculas.
- `rosto_y` (opcional, padrão 0,45): altura do centro do rosto na gravação, de 0 (topo) a 1 (base). Ajuste só se, nas cenas em `metade`, o rosto sair cortado; nesse caso, ponha a altura real (por exemplo, 0,35 se o rosto está mais alto).
- Campos omitidos usam o padrão.

### Etapa 5: cortar a gravação

```bash
PY "<pasta-da-skill>/scripts/editar.py" "<pasta-do-projeto>"
```

Gravação em 4K leva cerca de 1 minuto por minuto de vídeo num computador recente; acima de 8 minutos de gravação, rode em segundo plano. Sai a pessoa cortada, com a voz tratada (`.trabalho/publico/aroll.mp4`), mais o `plano.json` com o tempo de cada palavra no vídeo final, o `legenda.srt` e o `cortes.txt`. Aviso de "corte sem pausa": considere mover a fronteira para a pausa mais próxima.

Antes de animar, confira as emendas (cerca de 1 minuto):

```bash
PY "<pasta-da-skill>/scripts/revisar.py" "<pasta-do-projeto>" --emendas
```

Bloqueante: corrija o `cortes.json` (veja a Etapa 8) e rode o `editar.py` de novo. Corrigir aqui evita refazer o render inteiro.

### Etapa 6: planejar o motion

Leia `catalogo.md` (na pasta da skill): as camadas, o ritmo, a tabela de gatilhos na fala e as fichas de cada cena. Em seguida, leia:
- a fala que ficou, com os tempos, em `.trabalho/plano.json` (campo `palavras`), e marque os momentos que pedem imagem;
- os gestos da pessoa, em `.trabalho/gestos.txt`: os momentos em que um gesto e uma frase forte coincidem viram as interações.

O padrão é o ritmo médio:
- algo acontece a cada 3 a 5 s;
- a maioria são **acentos sobre a pessoa** (`"layout": "sobre"`: palavra, ícone, número, chips, tarja), sem dividir a tela;
- entre eles, 2 ou 3 cenas grandes por minuto (`metade`, `tela` ou `foco`);
- 1 ou 2 palavras gigantes atrás da pessoa (`"layout": "atras"`);
- algumas ênfases (zoom curto no rosto);
- de 3 a 5 **interações com a pessoa** (`interage` e `profundidade`): o objeto nasce na mão, o selo fica preso à cabeça, os ícones passam por trás dela.

Um elemento por vez, sem lotar.

Acrescente ao `cortes.json`:
- `"cenas"`: a lista de animações, com a camada de cada uma.
- `"enfases"`: zoom curto nas palavras mais fortes, por exemplo `[{"em": "w18"}]`.
- `"textos_extra"`: o que veio do briefing e pode aparecer na tela (nome de produto, endereço).

```json
"cenas": [
  {"id": "simples", "tipo": "palavra_atras", "de": "w17", "ate": "w19", "layout": "atras", "props": {"texto": "SIMPLES", "em": "w18"}},
  {"id": "um_app", "tipo": "destaque", "de": "w26", "ate": "w29", "layout": "sobre", "props": {"texto": "UM APP SÓ", "icone": "Smartphone", "em": "w28"}},
  {"id": "precos", "tipo": "escada_valores", "de": "w128", "ate": "w139", "layout": "metade",
   "props": {"rotulo": "PLANOS", "itens": [{"texto": "R$ 39", "valor": 39, "em": "w130"}, {"texto": "R$ 299", "valor": 299, "em": "w139"}]}},
  {"id": "app", "tipo": "celular_3d", "de": "w60", "ate": "w72", "layout": "metade", "props": {"imagem": "print-do-app.png"}},
  {"id": "globo_mao", "tipo": "na_mao", "de": "w62", "ate": "w66", "layout": "interage", "props": {"icone": "Globe", "texto": "O MUNDO TODO", "em": "w63"}}
]
```

- `de`/`ate`: primeira e última palavra do assunto.
- `em`: a palavra em que o momento forte acontece.
- **Posição:** em `sobre`, o script põe a cena no espaço livre ao redor do rosto (lê a posição do rosto sozinho). Use `"zona"` só para pedir um lugar específico.
- **Sons:** automáticos (whoosh, pop, tique, plim). `"sons": false` desliga.
- **Mídia:** imagem e vídeo da pessoa vão pelo caminho do arquivo; o script copia.
- **Cena livre:** se nenhuma cena pronta serve, siga a seção "Cena livre" do `catalogo.md`. Antes de escrever, leia `motor/GUIA-CENAS.md` e a skill oficial de boas práticas do Remotion. O caminho dela aparece na saída do `verificar.py`.

### Etapa 7: compor

```bash
PY "<pasta-da-skill>/scripts/compor.py" "<pasta-do-projeto>" --amostra wNN wMM --escala 0.5   # prévia rápida de um trecho
PY "<pasta-da-skill>/scripts/compor.py" "<pasta-do-projeto>"                                   # vídeo inteiro
```

- **Antes de renderizar:** o script confere âncoras, tipos de cena e textos. Recusa texto com palavra que não foi dita. Corrija o `cortes.json` e rode de novo.
- **Prévia:** com cena livre ou cena nova para a pessoa, faça antes a prévia do trecho e olhe os quadros (`ffmpeg -i amostra.mp4 -vf fps=2,scale=270:-1,tile=6x4 -frames:v 1 folha-amostra.jpg`, que mostra os primeiros 12 s).
- **Vídeo inteiro:** rode em segundo plano. O render leva de 4 a 5 minutos por minuto de vídeo, conforme o computador e o número de cenas. Saem `video-final.mp4` e `capa.jpg`.
- **Reserva sem motor de animação** (Node ou Remotion indisponível): `editar.py --legendado` entrega o vídeo cortado e legendado, sem motion. Diga isso à pessoa. Essa reserva precisa do ffmpeg com legendas (libass); o `verificar.py` avisa se faltar.

### Etapa 8: revisar (antes de mostrar qualquer coisa)

```bash
PY "<pasta-da-skill>/scripts/revisar.py" "<pasta-do-projeto>"
```

Leia `.trabalho/revisao.md`. Ela mede formato, volume (-14 LUFS), quadros pretos, legenda contra o áudio retranscrito, frase repetida, grafia dos termos e cada emenda ouvida lado a lado, e lista as cenas com a fala de cada instante.

- **Bloqueante:** corrija a causa (quase sempre o `cortes.json`), rode as etapas seguintes de novo e revise. No máximo 2 rodadas; depois mostre à pessoa o que sobrou, com franqueza.
- **"palavra cortada antes do corte" ou "depois do corte":** o tempo da palavra veio errado na transcrição e o corte caiu antes dela ou dentro dela. Tire a palavra junto com o trecho cortado, se a frase continuar fazendo sentido, ou mantenha inteiro o trecho vizinho.
- **"sobra depois do corte" ou "sobra antes do corte":** há fala no trecho mantido que não estava no texto. Mova o corte: tire a palavra vizinha ou corte na próxima pausa.
- **Aviso "legenda diz X, áudio soa Y"** em uma ou duas palavras é erro de reconhecimento, normal. Só aja se for nome ou termo.
- Depois, **abra e olhe** `.trabalho/folha.jpg` (um quadro a cada 1,5 s, zona segura em amarelo) e `capa.jpg`. Bloqueia se:
  - o texto estiver ilegível;
  - a legenda, o título ou a cena saírem da caixa amarela;
  - a cena não corresponder ao que está sendo dito naquele instante;
  - a cena mostrar número ou texto que não foi dito;
  - houver elemento cortado ou sobreposto;
  - o rosto ficar cortado nas cenas em `metade` (ajuste `rosto_y` no `cortes.json`);
  - a cor ficar lavada.
- Não altere os limites dos scripts para passar.

### Etapa 9: entregar

Diga:
- onde está o vídeo (caminho completo);
- a duração antes e depois;
- o que saiu, resumindo o `cortes.txt` em 3 a 5 linhas;
- as animações, uma linha por cena com o tempo;
- o título usado;
- que existem `capa.jpg` e `legenda.srt`;
- que dá para ajustar por frase e por cena;
- se usou o `mapa` do Brasil, que a cena traz o crédito "Fonte: IBGE" e ele deve ficar (créditos de tudo o que a skill usa em `CREDITOS.md`).

Ajuste é rápido. Cena: edite as `cenas` e rode compor e revisar. Corte: rode editar, compor e revisar. Não precisa transcrever de novo. Junte os ajustes pedidos numa rodada só: cada render custa tempo e cota.

## O que esta skill não faz (diga se pedirem)

- **Música:** use a biblioteca do próprio app, que é licenciada e entra no volume certo.
- **Vídeo com mais de uma pessoa falando:** fora do escopo.
- **Logos de marcas de terceiros e imagens da internet:** as animações usam só o que foi dito, ícones livres e a mídia que a pessoa mandou.
- **Gravação na horizontal:** funciona, mas as laterais são cortadas para virar vertical; avise.

## Regras

- Nunca diga que editou sem ter rodado os scripts, visto o `video-final.mp4` existir e a revisão aprovar.
- Nada inventado: título, legenda e texto das animações só com palavras ditas (ou do briefing, declaradas em `textos_extra`). Correção é só de grafia.
- O vídeo nunca sai do computador da pessoa: nada de enviar para transcrição, edição ou "melhoria" online.
- Nunca altere nem apague a gravação original. A pasta `-editado/` guarda o projeto. A `.trabalho/` pode ser apagada quando a pessoa estiver satisfeita.
- Não mexa nos limites dos scripts (volume, zona segura, critérios da revisão) para fazer passar.
- Se um script falhar, leia a mensagem e corrija a causa (caminho com espaço sem aspas, ffmpeg ausente, arquivo sem áudio, texto de cena não dito) em vez de repetir o mesmo comando.
