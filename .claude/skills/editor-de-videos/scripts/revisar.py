#!/usr/bin/env python3
"""Etapa 8 do editor (SKILL.md): revisa o vídeo final antes da entrega.

uso: <python do ambiente> scripts/revisar.py PASTA_DO_PROJETO
     <python do ambiente> scripts/revisar.py PASTA_DO_PROJETO --emendas   (só as emendas, logo depois do editar.py)

Mede (sem opinião) e grava .trabalho/revisao.md e .trabalho/folha.jpg:
- formato: 1080x1920, 30 qps, H.264, número de quadros igual ao planejado;
- volume: -14 LUFS (±1) e pico real até -1 dBTP;
- quadros pretos;
- fidelidade: retranscreve o vídeo final e compara com o texto que devia ficar:
  repetição de frase (erro de gravação que sobrou), grafia dos termos
  informados, fala que não devia estar lá, pontas longas sem fala;
- folha de quadros (um a cada 1,5 s, com a zona segura em amarelo) para o
  agente de IA olhar: legibilidade, texto fora da zona, título sobre o rosto, zoom
  cortando a cabeça.
Código de saída 1 quando há defeito bloqueante.
"""
import argparse
import difflib
import math
import re
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True  # não deixa __pycache__ dentro da pasta da skill
sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import ALTURA, FPS, LARGURA, ZONA, exigir_ambiente, ffmpeg, ler_json, rotular_folha, sondar, tempo  # noqa: E402

N_GRAMA = 5
JANELA_REPETICAO_S = 20.0


def normalizar(t):
    return re.sub(r"[^\w]+", "", t.lower(), flags=re.UNICODE)


def distancia(a, b):
    if abs(len(a) - len(b)) > 2:
        return 3
    ant = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        atual = [i]
        for j, cb in enumerate(b, 1):
            atual.append(min(ant[j] + 1, atual[j - 1] + 1, ant[j - 1] + (ca != cb)))
        ant = atual
    return ant[-1]


def medir_volume(video):
    err = ffmpeg(["-nostats", "-i", str(video), "-af", "ebur128=peak=true", "-f", "null", "-"])
    resumo = err[err.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+) LUFS", resumo)
    pico = re.search(r"True peak:\s+Peak:\s+(-?[\d.]+|-inf) dBFS", resumo)
    return (float(i.group(1)) if i else None), (float(pico.group(1)) if pico and pico.group(1) != "-inf" else None)


def medir_pretos(video):
    err = ffmpeg(["-nostats", "-i", str(video), "-vf", "blackdetect=d=0.05:pix_th=0.10", "-an", "-f", "null", "-"])
    return [(float(a), float(b)) for a, b in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", err)]


def carregar_audio(video):
    import numpy as np
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", str(video), "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True)
    return np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32) / 32768.0


def ouvir(video, termos):
    """Retranscreve o áudio do vídeo final."""
    from transcrever import Transcritor, detectar_silencios, planejar_blocos

    audio = carregar_audio(video)
    dur = len(audio) / 16000
    silencios, _ = detectar_silencios(audio)
    t = Transcritor(termos)
    ouvidas = []
    for a, b in planejar_blocos(silencios, 0.0, dur):
        ouvidas += t(audio, a, b)
    return ouvidas, audio, t


def parecida(a, b):
    return a == b or (len(a) >= 3 and difflib.SequenceMatcher(None, a, b).ratio() >= 0.7)


def ruido_de_numero(x):
    """"R$", ",00", "%": o Whisper formata número de jeitos diferentes em cada
    passada; não é fala sobrando."""
    n = normalizar(x)
    return n == "" or n.isdigit() or n in ("r", "rs", "us")


def plural(a, b):
    """Singular e plural da mesma palavra ("vídeo" e o termo "editor de vídeos") não são erro de grafia."""
    curta, longa = sorted((a, b), key=len)
    return longa in (curta + "s", curta + "es")


def conferir_emenda(t, audio, corte, ini_viz, fim_viz, esperadas):
    """Transcreve cada lado do corte sozinho (sem o outro lado, o Whisper não tem
    como fundir uma repetição) e confere se a última palavra antes e a primeira
    depois são as esperadas, sem nada sobrando no meio."""
    from transcrever import eh_hesitacao
    esq_a, dir_b = max(ini_viz, corte - 2.0), min(fim_viz, corte + 2.0)
    esp_esq = [normalizar(w["texto"]) for w in esperadas if esq_a - 0.2 <= w["ini"] and w["fim"] <= corte + 0.1]
    esp_dir = [normalizar(w["texto"]) for w in esperadas if corte - 0.1 <= w["ini"] <= dir_b]
    ouv_esq = [w["texto"] for w in t(audio, esq_a, corte, dica=False)]
    ouv_dir = [w["texto"] for w in t(audio, corte, dir_b, dica=False)]
    problemas = []
    # Palavra comida pelo corte: a última esperada antes (ou a primeira depois) não se
    # ouve. Número e palavra curta ficam de fora: o Whisper escreve de outra forma ou engole.
    def conta(palavra):
        return len(palavra) >= 3 and not ruido_de_numero(palavra)
    if esp_esq and ouv_esq:
        n = [normalizar(x) for x in ouv_esq]
        k = max((i for i, x in enumerate(n) if parecida(x, esp_esq[-1])), default=None)
        sobra = [x for x in ouv_esq[k + 1:] if not ruido_de_numero(x)] if k is not None else []
        if sobra:
            problemas.append(("hesitação" if all(eh_hesitacao(x) for x in sobra) else "fala", "antes", " ".join(sobra)))
        elif k is None and conta(esp_esq[-1]):
            problemas.append(("falta", "antes", esp_esq[-1]))
    if esp_dir and ouv_dir:
        n = [normalizar(x) for x in ouv_dir]
        k = next((i for i, x in enumerate(n) if parecida(x, esp_dir[0])), None)
        sobra = [x for x in ouv_dir[:k] if not ruido_de_numero(x)] if k else []
        if sobra:
            problemas.append(("hesitação" if all(eh_hesitacao(x) for x in sobra) else "fala", "depois", " ".join(sobra)))
        elif k is None and conta(esp_dir[0]):
            problemas.append(("falta", "depois", esp_dir[0]))
    return " ".join(ouv_esq[-4:]), " ".join(ouv_dir[:4]), problemas


def folha(video, trabalho, duracao):
    """Folha de quadros: um a cada 1,5 s, 6 por linha, zona segura em amarelo."""
    passo = 1.5
    n = max(1, math.ceil(duracao / passo - 1e-6))  # quadros que o fps=1/passo tira
    linhas = (n + 5) // 6
    w, h = 240, 427
    sx, sy = w / LARGURA, h / ALTURA
    zona = f"drawbox=x={ZONA['x0'] * sx:.0f}:y={ZONA['y0'] * sy:.0f}:w={(ZONA['x1'] - ZONA['x0']) * sx:.0f}:h={(ZONA['y1'] - ZONA['y0']) * sy:.0f}:color=yellow@0.9:t=2"
    ffmpeg(["-i", str(video), "-vf", f"fps=1/{passo},scale={w}:{h},{zona},tile=6x{linhas}:padding=4:color=white",
            "-frames:v", "1", "-q:v", "3", "folha.jpg"], cwd=trabalho)
    rotular_folha(trabalho / "folha.jpg", 6, n, w, h, passo)
    return trabalho / "folha.jpg"


def conferir_emendas(transcritor, audio, plano, esperadas):
    """Cada emenda ouvida lado a lado: sobra de fala removida, repetição, hesitação ou palavra comida."""
    emendas, bloq, avisos = [], [], []
    segs = plano["segmentos"]
    removidas_meio = [(w["ini"] + w["fim"]) / 2 for w in plano.get("palavras_removidas", [])]
    for k in range(1, len(segs)):
        t = segs[k]["out_ini"]
        a, b = segs[k - 1], segs[k]
        # Corte que só encurtou pausa (nenhuma fala removida entre os dois trechos).
        so_pausa = a["clipe"] == b["clipe"] and not any(a["src_fim"] < m < b["src_ini"] for m in removidas_meio)
        antes, depois, problemas = conferir_emenda(transcritor, audio, t, a["out_ini"], b["out_fim"], esperadas)
        emendas.append(f"- {tempo(t)}  …{antes} ‖ {depois}…" + ("  (pausa encurtada)" if so_pausa else ""))
        for tipo, lado, sobra in problemas:
            if tipo == "falta":
                bloq.append(f"{tempo(t)}: palavra cortada {lado} do corte: \"{sobra}\" não se ouve (o corte caiu dentro dela). "
                            "Se ao ouvir a palavra estiver inteira, é erro de reconhecimento")
                continue
            msg = f"{tempo(t)}: sobra {lado} do corte: \"{sobra}\" (não estava no texto que devia ficar)"
            if tipo == "fala" and not so_pausa:
                bloq.append(msg + "; mova o corte")
            else:
                avisos.append(msg + ("; hesitação, confira" if tipo != "fala" else "; num corte de pausa: provável erro de reconhecimento, confira"))
    return emendas, bloq, avisos


def so_emendas(projeto, trabalho, plano):
    """Conferência rápida depois do editar.py: só as emendas, no vídeo cortado, antes do render das animações."""
    from transcrever import Transcritor
    video = trabalho / "publico" / "aroll.mp4"
    if not video.exists():
        video = projeto / "video-final.mp4"
    emendas, bloq, avisos = conferir_emendas(Transcritor(plano.get("termos", [])), carregar_audio(video), plano, plano["palavras"])
    linhas = [f"# Emendas: {'CORRIGIR' if bloq else 'OK'} ({len(bloq)} bloqueante(s), {len(avisos)} aviso(s))", "",
              "## Bloqueantes", *([f"- {x}" for x in bloq] or ["- nenhum"]), "", "## Avisos", *([f"- {x}" for x in avisos] or ["- nenhum"]), "",
              "## Emendas (cada lado ouvido sozinho; ‖ = corte)", *emendas]
    print("\n".join(linhas))
    sys.exit(1 if bloq else 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("projeto")
    ap.add_argument("--emendas", action="store_true", help="só as emendas, no vídeo cortado (rode logo depois do editar.py)")
    args = ap.parse_args()
    exigir_ambiente()
    projeto = Path(args.projeto).expanduser().resolve()
    trabalho = projeto / ".trabalho"
    video = projeto / "video-final.mp4"
    plano = ler_json(trabalho / "plano.json")
    if args.emendas:
        so_emendas(projeto, trabalho, plano)
    bloq, avisos, medidas = [], [], []

    # Formato
    info = sondar(video)
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
                        "stream=nb_read_packets,codec_name,pix_fmt", "-of", "default=nw=1", str(video)], capture_output=True, text=True)
    campos = dict(l.split("=", 1) for l in r.stdout.split() if "=" in l)
    quadros = int(campos.get("nb_read_packets", 0))
    if (info["largura"], info["altura"]) != (LARGURA, ALTURA) or campos.get("codec_name") != "h264" or campos.get("pix_fmt") != "yuv420p":
        bloq.append(f"formato: {info['largura']}x{info['altura']} {campos.get('codec_name')} {campos.get('pix_fmt')} (esperado 1080x1920 h264 yuv420p)")
    if abs(quadros - plano["duracao_q"]) > 1:
        bloq.append(f"formato: {quadros} quadros no arquivo, {plano['duracao_q']} planejados (render incompleto?)")
    medidas.append(f"{LARGURA}x{ALTURA}, {quadros} quadros ({tempo(quadros / FPS)})")

    # Volume
    lufs, pico = medir_volume(video)
    medidas.append(f"volume {lufs} LUFS, pico real {pico} dBTP")
    if lufs is None or abs(lufs + 14) > 1.0:
        bloq.append(f"volume: {lufs} LUFS (alvo -14 ±1)")
    if pico is not None and pico > -1.0:
        bloq.append(f"volume: pico real {pico} dBTP (máximo -1)")

    # Quadros pretos
    for a, b in medir_pretos(video):
        bloq.append(f"{tempo(a)}: quadro preto por {b - a:.2f} s")

    # Fidelidade
    esperadas = plano["palavras"]
    ouvidas, audio, transcritor = ouvir(video, plano.get("termos", []))
    ne = [normalizar(w["texto"]) for w in esperadas]
    no = [normalizar(w["texto"]) for w in ouvidas]
    sm = difflib.SequenceMatcher(None, ne, no, autojunk=False)
    iguais = sum(b.size for b in sm.get_matching_blocks())
    pct = 100 * iguais / max(1, len(ne))
    medidas.append(f"fidelidade: {len(ne)} palavras esperadas, {len(no)} ouvidas, {pct:.1f}% reconhecidas")
    if pct < 90:
        avisos.append(f"só {pct:.0f}% das palavras reconhecidas na retranscrição: confira o áudio nos trechos abaixo")
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "insert" and j2 - j1 >= 3:
            avisos.append(f"{tempo(ouvidas[j1]['ini'])}: fala no vídeo que não estava prevista: \"{' '.join(w['texto'] for w in ouvidas[j1:j2])}\" (sobra de trecho cortado?)")
        elif tag == "replace" and (i2 - i1 >= 3 or j2 - j1 >= 3) and "".join(ne[i1:i2]) != "".join(no[j1:j2]):
            avisos.append(f"{tempo(esperadas[i1]['ini'])}: legenda diz \"{' '.join(w['texto'] for w in esperadas[i1:i2])}\", áudio soa \"{' '.join(w['texto'] for w in ouvidas[j1:j2])}\"")
        elif tag == "delete" and i2 - i1 >= 3:
            avisos.append(f"{tempo(esperadas[i1]['ini'])}: palavras esperadas não ouvidas: \"{' '.join(w['texto'] for w in esperadas[i1:i2])}\" (corte comeu fala?)")

    # Repetição de frase: a mesma sequência de 5 palavras duas vezes em menos de 20 s.
    for lista, origem in ((esperadas, "legenda"), (ouvidas, "áudio")):
        norm = [normalizar(w["texto"]) for w in lista]
        vistos, achou = {}, False
        for i in range(len(norm) - N_GRAMA + 1):
            chave = tuple(norm[i:i + N_GRAMA])
            if not all(chave):
                continue
            if chave in vistos and lista[i]["ini"] - lista[vistos[chave]]["ini"] < JANELA_REPETICAO_S and i - vistos[chave] >= N_GRAMA:
                j = vistos[chave]
                bloq.append(f"{tempo(lista[i]['ini'])}: frase repetida no {origem} (\"{' '.join(w['texto'] for w in lista[i:i + N_GRAMA])}\" já aparece em {tempo(lista[j]['ini'])}): erro de gravação mantido?")
                achou = True
                break
            vistos.setdefault(chave, i)
        if achou:
            break

    # Grafia dos termos informados.
    termos = {normalizar(t) for termo in plano.get("termos", []) for t in termo.split() if len(normalizar(t)) >= 4}
    for w in esperadas:
        n = normalizar(w["texto"])
        if n and n not in termos and len(n) >= 4:
            perto = [t for t in termos if distancia(n, t) <= 2 and n[0] == t[0] and difflib.SequenceMatcher(None, n, t).ratio() >= 0.8
                     and not plural(n, t)]
            if perto:
                bloq.append(f"{tempo(w['ini'])}: legenda escreve \"{w['texto']}\"; o termo informado é \"{perto[0]}\" (grafia?)")

    # Pontas
    if esperadas and esperadas[0]["ini"] > 0.8:
        avisos.append(f"o vídeo começa com {esperadas[0]['ini']:.1f} s sem fala")
    if esperadas and quadros / FPS - esperadas[-1]["fim"] > 1.5:
        avisos.append(f"o vídeo termina com {quadros / FPS - esperadas[-1]['fim']:.1f} s sem fala")
    avisos += [f"montagem: {a}" for a in plano.get("avisos", [])]

    emendas, b_em, a_em = conferir_emendas(transcritor, audio, plano, esperadas)
    bloq += b_em
    avisos += a_em

    # Cenas de motion: o que cada uma mostra e o que está sendo dito no mesmo instante.
    cenas_txt = []
    arq_tl = trabalho / "timeline.json"
    if arq_tl.exists():
        tl = ler_json(arq_tl)
        for c in tl.get("cenas", []):
            a, b = c["ini_f"] / FPS, c["fim_f"] / FPS
            fala = " ".join(w["texto"] for w in esperadas if a <= w["ini"] < b)
            mostra = "; ".join(c.get("textos", [])) or "(sem texto)"
            cenas_txt.append(f"- {tempo(a)}–{tempo(b)}  {c['tipo']} ({c['layout']})  mostra: {mostra}  |  fala: \"{fala}\"")

    arq_folha = folha(video, trabalho, quadros / FPS)
    resultado = "REPROVADO" if bloq else "APROVADO"
    linhas = [f"# Revisão: {resultado} ({len(bloq)} bloqueante(s), {len(avisos)} aviso(s))", "", "## Medidas", *[f"- {m}" for m in medidas], ""]
    linhas += ["## Bloqueantes", *([f"- {b}" for b in bloq] or ["- nenhum"]), "", "## Avisos", *([f"- {a}" for a in avisos] or ["- nenhum"]), ""]
    if emendas:
        linhas += ["## Emendas (cada lado ouvido sozinho; ‖ = corte)", *emendas, ""]
    if cenas_txt:
        linhas += ["## Cenas (confira cada uma na folha: corresponde à fala do instante? nada inventado? cabe e se lê?)", *cenas_txt, ""]
    linhas += [
        "## Agora abra e olhe as imagens",
        f"- {arq_folha.name}: um quadro a cada 1,5 s; a caixa amarela é a zona segura.",
        "- capa.jpg: o primeiro quadro, que vira a capa.",
        "Bloqueia se: texto ilegível; legenda, título ou cena fora da caixa amarela; título cobrindo o rosto; zoom cortando a cabeça ou o queixo; "
        "rosto cortado na metade de baixo; cena que não corresponde à fala do instante ou mostra o que não foi dito; elemento cortado ou sobreposto; "
        "palavra quebrada no meio na legenda; quadro com cor lavada ou estranha.",
    ]
    (trabalho / "revisao.md").write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print("\n".join(linhas))
    sys.exit(1 if bloq else 0)


if __name__ == "__main__":
    main()
