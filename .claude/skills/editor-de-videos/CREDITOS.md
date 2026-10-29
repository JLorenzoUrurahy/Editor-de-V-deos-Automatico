# Créditos e licenças

Os scripts, o motor de animação, as cenas do catálogo, os exemplos, as imagens de exemplo e os textos desta skill são originais. Eles usam os componentes de terceiros abaixo, cada um com a sua licença.

## Vão junto na pasta da skill

| O quê | Onde | De quem | Licença |
|---|---|---|---|
| Fonte Plus Jakarta Sans ExtraBold | `fontes/` | The Plus Jakarta Sans Project Authors (Tokotype) | SIL Open Font License 1.1 (`fontes/OFL.txt`) |
| Mapa dos estados do Brasil (malha simplificada) | `motor/src/catalogo/outras/dados/brasil-uf.json` | IBGE, API de malhas e de localidades | Uso livre com citação da fonte: a cena `mapa` mostra "Fonte: IBGE"; cena livre que use este arquivo também precisa mostrar |
| Mapa dos países | `motor/src/catalogo/outras/dados/mundo.json` | Natural Earth, escala 1:110m | Domínio público |

Os efeitos sonoros (whoosh, pop, tique, plim, clique, batida) são sintetizados pelo `scripts/sons.py`. Não há arquivo de som de terceiros.

## Baixados na instalação, da fonte oficial de cada um

| O quê | Para quê | Licença |
|---|---|---|
| Remotion 4 (`remotion`, `@remotion/cli`) | desenhar e renderizar as animações | Remotion License: grátis para pessoa física, empresa ou equipe de até 3 pessoas e organização sem fins lucrativos. Com 4 pessoas ou mais (contando sócios, funcionários e freelancers), a empresa precisa de uma licença paga do Remotion (https://www.remotion.pro/license) |
| `@remotion/fonts` e `@remotion/layout-utils` | carregar a fonte e medir o texto | MIT |
| Ferramentas que o Remotion baixa sozinho: Chrome Headless Shell (navegador de render) e o FFmpeg dele | gerar os quadros e o vídeo | Chromium (BSD e avisos de terceiros) e FFmpeg (compilação GPL), da fonte oficial; nenhum dos dois é copiado para esta skill |
| Boas práticas do Remotion (`remotion-dev/skills`, versão fixa) | referência para escrever cena livre | material do Remotion; o repositório não publica licença própria. É baixado pela pessoa na instalação, do repositório oficial, e não é copiado para esta skill |
| React e React DOM 19 | base do motor | MIT |
| d3-geo 3 | projeção dos mapas e do globo | ISC |
| Lucide (`lucide-react`) | ícones das cenas | ISC; parte dos ícones vem do Feather (MIT) |
| TypeScript | conferência do código do motor | Apache 2.0 |
| faster-whisper e CTranslate2 | transcrição com o tempo de cada palavra | MIT |
| Modelo Whisper large-v3-turbo (OpenAI), convertido para CTranslate2 (`mobiuslabsgmbh/faster-whisper-large-v3-turbo`) | transcrição | MIT |
| MediaPipe 0.10.21 | leitura do rosto, das mãos e recorte da pessoa | Apache 2.0 |
| Modelos do MediaPipe: BlazeFace (rosto), Selfie Segmenter (recorte) e Hand Landmarker (mãos) | idem | Apache 2.0 |
| Pillow | imagens de conferência | MIT-CMU (HPND) |
| NumPy | cálculos de áudio e de imagem | BSD-3-Clause |
| OpenCV (`opencv-contrib-python`, vem com o MediaPipe) | suavizar a borda do recorte da pessoa | Apache 2.0 |
| Demais bibliotecas instaladas pelo pip e pelo npm (PyAV, ONNX Runtime, Hugging Face Hub e outras) | dependências das de cima | cada uma com a sua licença (MIT, BSD, Apache 2.0, MPL 2.0); PyAV e OpenCV trazem FFmpeg (LGPL ou GPL) |

## Do computador da pessoa

ffmpeg, Python e Node.js são instalados pela própria pessoa, com as licenças de cada um (o ffmpeg é LGPL ou GPL, conforme a compilação).

## O que a skill não usa

Logos de marcas, imagens da internet, músicas e fontes de terceiros além da listada acima. As animações mostram só o que a pessoa disse, os ícones do Lucide e a mídia que a própria pessoa enviar.
