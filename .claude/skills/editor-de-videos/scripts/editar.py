#!/usr/bin/env python3
"""Etapa 5 do editor (SKILL.md): aplica os cortes decididos ao vídeo da câmera.

uso: <python do ambiente> scripts/editar.py PASTA_DO_PROJETO [--legendado]

Lê .trabalho/transcricao.json e .trabalho/cortes.json (escrito a partir da
transcrição; formato no SKILL.md) e grava:
  .trabalho/publico/aroll.mp4  a pessoa cortada, 1080x1920, 30 qps, voz em -14 LUFS
                               (sem legenda: o compor.py desenha legenda, título e cenas)
  .trabalho/plano.json         mapa de tempo: trechos, palavras e páginas de legenda no vídeo final
  legenda.srt                  legenda em arquivo, para quem quiser subir separada
  cortes.txt                   o que saiu, em texto, para conferir e pedir ajuste
Com --legendado (reserva, sem motor de animação): grava legenda e título com o
ffmpeg e entrega direto video-final.mp4 e capa.jpg.

Como corta:
- Tudo que não foi removido fica. Cada corte cai dentro de uma pausa da fala.
- Pausas longas dentro do que ficou viram pausas curtas.
- Um passe só de ffmpeg para tudo (cortar em pedaços e emendar gera estalo e
  tira a sincronia).
- Zoom alternado a cada corte (1,0 e 1,1), para o corte seco virar mudança de
  enquadramento em vez de pulo.
"""
import argparse
import difflib
import json
import re
import subprocess
import sys
import time
from pathlib import Path

sys.dont_write_bytecode = True  # não deixa __pycache__ dentro da pasta da skill
sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import (  # noqa: E402
    ALTURA, CENTRO_X, FONTE, FONTE_NOME, FPS, LARGURA, PASTA_FONTES, ZONA,
    cover, exigir_ambiente, ffmpeg, filtros_disponiveis, gravar_json, ler_json, tempo,
)

PAUSA_MAX_S = 0.7      # pausa maior que isso dentro do que ficou é encurtada
PAUSA_ALVO_S = 0.35    # para este tamanho
AR_ANTES_S = 0.25      # respiro antes da primeira palavra de um trecho
AR_DEPOIS_S = 0.35     # e depois da última
FOLGA_S = 0.6          # o tempo de palavra do Whisper erra até ~0,5 s nas bordas
CAUDA_S = 0.08         # depois do fim da última palavra antes de uma pausa cortada
CAUDA_MAX_S = 0.45     # mas no máximo isso dentro da pausa detectada
MIN_SEGMENTO_S = 0.4
FADE_S = 0.008
ZOOM = 1.10
SEG_MIN_ZOOM_S = 0.8   # segmento mais curto que isso não troca o zoom

LEGENDA = {"tamanho": 92, "contorno": 6, "sombra": 2, "y": 1300, "max_palavras": 3, "max_dur_s": 1.3}
TITULO = {"tamanho": 92, "minimo": 64, "caixa": 22, "y": {"topo": 470, "meio": 1010}, "max_linhas": 3}
COR_DESTAQUE = "#FFD60A"
COR_TEXTO = "#FFFFFF"
COR_CONTORNO = "#111111"

# Palavra curta sem pontuação não fecha página de legenda: vai junto da próxima.
LIGA = {"o", "a", "os", "as", "e", "é", "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas", "um", "uma",
        "que", "se", "por", "pra", "para", "com", "ao", "à", "te", "me", "eu", "ou", "mas", "seu", "sua", "meu", "minha"}


# ---------------------------------------------------------------- cortes

def compacto(t):
    """Só letras e números, minúsculas, sem acento: "coiá" ≈ "com a IA"."""
    import unicodedata
    t = unicodedata.normalize("NFD", t.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in t if unicodedata.category(c) != "Mn"))


def expandir(cortes, palavras, linhas):
    """Índices das palavras removidas. Aceita linhas (f03), faixas de linhas
    (f03–f05) e faixas de palavras (w10–w14)."""
    idx = {p["id"]: i for i, p in enumerate(palavras)}
    lin = {l["id"]: l for l in linhas}
    removidas, erros = {}, []
    for r in cortes.get("remover", []):
        de, ate = r.get("de"), r.get("ate", r.get("de"))
        if de in lin and ate in lin:
            a, b = idx[lin[de]["de"]], idx[lin[ate]["ate"]]
        elif de in idx and ate in idx:
            a, b = idx[de], idx[ate]
        else:
            erros.append(f"id desconhecido em remover: {r}")
            continue
        if b < a:
            a, b = b, a
        for i in range(a, b + 1):
            removidas[i] = r.get("motivo", "")
    return removidas, erros


def compilar(palavras, silencios, clipes, removidas):
    avisos = []
    n = len(palavras)

    def mesmo_clipe(i, j):
        return 0 <= j < n and palavras[j]["clipe"] == palavras[i]["clipe"]

    # O tempo de palavra do Whisper erra nas bordas (o fim costuma vir esticado até
    # a palavra seguinte). Por isso o corte se ancora pela ordem: a pausa certa é a
    # que fica entre a palavra mantida e a vizinha, sem nenhuma outra palavra no meio.
    meios = [(w["ini"] + w["fim"]) / 2 for w in palavras]

    def sem_palavra_entre(a, b, exceto):
        return not any(a < m < b for j, m in enumerate(meios) if j != exceto)

    def ancora_ini(i):
        p = palavras[i]
        ant = palavras[i - 1] if mesmo_clipe(i, i - 1) else None
        lo = clipes[p["clipe"]]["inicio"]
        # Início da palavra dentro de uma pausa: o Whisper adiantou; a fala começa no fim dela.
        dentro = next((s for s in silencios if s["inicio"] <= p["ini"] < s["fim"] and s["fim"] - p["ini"] <= 1.5), None)
        if dentro:
            return max(lo, dentro["inicio"] + 0.05, dentro["fim"] - AR_ANTES_S)
        cands = [s for s in silencios if s["inicio"] < p["ini"] - 0.05 and s["fim"] <= p["ini"] + 0.4 and sem_palavra_entre(s["fim"], p["ini"], i)]
        # Micropausa (< 0,15 s) pode ser a oclusão de um "t" no meio da palavra anterior.
        cands = [s for s in cands if s["dur"] >= 0.15] or cands
        if cands:
            s = cands[-1]
            return max(lo, s["inicio"] + 0.05, s["fim"] - AR_ANTES_S)
        avisos.append(f"corte sem pausa antes de {p['id']} ({tempo(p['ini'])})")
        return max(lo, min(p["ini"] - 0.02, (ant["fim"] + p["ini"]) / 2) if ant else p["ini"] - 0.05)

    def fim_da_fala(fim_whisper, s):
        """O fim de frase cai de volume ("certo", "explicar") e fica abaixo do limiar: a
        pausa detectada começa no meio da palavra. Vale o fim do Whisper, até
        CAUDA_MAX_S dentro da pausa (além disso, o fim veio esticado)."""
        return min(fim_whisper + CAUDA_S, s["inicio"] + CAUDA_MAX_S)

    def ancora_fim(i):
        p = palavras[i]
        prox = palavras[i + 1] if mesmo_clipe(i, i + 1) else None
        c = clipes[p["clipe"]]
        hi = c["inicio"] + c["duracao"]
        cands = [s for s in silencios if s["inicio"] > p["ini"] and s["inicio"] <= p["fim"] + 1.5 and sem_palavra_entre(p["ini"], s["inicio"], i)]
        cands = [s for s in cands if s["dur"] >= 0.15] or cands
        if cands:
            s = cands[0]
            return min(hi, s["fim"] - 0.05, max(s["inicio"] + AR_DEPOIS_S, fim_da_fala(p["fim"], s)))
        avisos.append(f"corte sem pausa depois de {p['id']} ({tempo(p['fim'])}): escolha outra fronteira, se der")
        return min(hi, max(p["fim"], prox["ini"] - 0.02) if prox else p["fim"] + 0.05)

    # Faixas de palavras mantidas: contíguas e no mesmo vídeo.
    faixas, atual = [], []
    for i in range(n):
        if i in removidas:
            if atual:
                faixas.append(atual)
            atual = []
            continue
        if atual and palavras[i]["clipe"] != palavras[atual[-1]]["clipe"]:
            faixas.append(atual)
            atual = []
        atual.append(i)
    if atual:
        faixas.append(atual)

    brutos = []
    for f in faixas:
        ini, fim = ancora_ini(f[0]), ancora_fim(f[-1])
        if fim <= ini:
            avisos.append(f"trecho vazio {palavras[f[0]]['id']}–{palavras[f[-1]]['id']}")
            continue
        clipe = palavras[f[0]]["clipe"]
        internas = [s for s in silencios if s["inicio"] > ini + 0.2 and s["fim"] < fim - 0.2 and s["dur"] > PAUSA_MAX_S]
        cursor = ini
        for s in internas:
            antes = [palavras[j]["fim"] for j in f if palavras[j]["ini"] < s["inicio"]]
            corte = max(s["inicio"] + PAUSA_ALVO_S / 2, fim_da_fala(antes[-1], s) if antes else 0)
            volta = s["fim"] - PAUSA_ALVO_S / 2
            if volta - corte < 0.1:
                continue  # a cauda da palavra ocupa a pausa: fica inteira
            brutos.append({"ini": cursor, "fim": corte, "clipe": clipe, "tipo": "pausa"})
            cursor = volta
        brutos.append({"ini": cursor, "fim": fim, "clipe": clipe, "tipo": "trecho"})

    # Quadros (no tempo de cada vídeo), fusão de contíguos, descarte de curtos.
    segs = []
    for s in brutos:
        c = clipes[s["clipe"]]
        a = round((s["ini"] - c["inicio"]) * FPS)
        b = min(round((s["fim"] - c["inicio"]) * FPS), int(round(c["duracao"] * FPS)))
        u = segs[-1] if segs else None
        if u and u["clipe"] == s["clipe"] and abs(a - u["b"]) <= 1:
            u["b"] = b
            continue
        if b - a < MIN_SEGMENTO_S * FPS:
            avisos.append(f"trecho curto descartado em {tempo(s['ini'])} ({(b - a) / FPS:.2f} s)")
            continue
        segs.append({"clipe": s["clipe"], "a": a, "b": b})
    saida = 0
    for k, s in enumerate(segs):
        c = clipes[s["clipe"]]
        s["id"] = k
        s["src_ini"] = c["inicio"] + s["a"] / FPS
        s["src_fim"] = c["inicio"] + s["b"] / FPS
        s["out_ini"] = saida / FPS
        saida += s["b"] - s["a"]
        s["out_fim"] = saida / FPS
    return segs, saida, avisos


def zooms(segs, ligado):
    z, atual = [], 1.0
    for k, s in enumerate(segs):
        if k > 0 and ligado and (s["b"] - s["a"]) / FPS >= SEG_MIN_ZOOM_S:
            atual = ZOOM if atual == 1.0 else 1.0
        z.append(atual)
    return z


def palavras_na_saida(palavras, removidas, segs, correcoes):
    """Tempo de cada palavra mantida no vídeo final."""
    saida = []
    for i, p in enumerate(palavras):
        if i in removidas:
            continue
        # O trecho com mais sobreposição; sem sobreposição (o Whisper pôs a palavra
        # dentro de uma pausa encurtada), o trecho mais próximo do mesmo vídeo.
        def sobre(s):
            return min(p["fim"], s["src_fim"]) - max(p["ini"], s["src_ini"])
        candidatos = [s for s in segs if s["clipe"] == p["clipe"]]
        if not candidatos:
            continue
        s = max(candidatos, key=sobre)
        if sobre(s) <= 0:
            meio = (p["ini"] + p["fim"]) / 2
            s = min(candidatos, key=lambda s: min(abs(meio - s["src_ini"]), abs(meio - s["src_fim"])))
            if min(abs(meio - s["src_ini"]), abs(meio - s["src_fim"])) > 1.0:
                continue
        def mapa(t):
            return round(s["out_ini"] + min(max(t, s["src_ini"]), s["src_fim"]) - s["src_ini"], 3)
        saida.append({"id": p["id"], "texto": correcoes.get(p["id"], p["texto"]), "ini": mapa(p["ini"]), "fim": mapa(p["fim"]), "seg": s["id"]})
    return saida


# ---------------------------------------------------------------- legenda

class Medidor:
    def __init__(self):
        from PIL import ImageFont
        self.ImageFont = ImageFont
        self.cache = {}

    def __call__(self, texto, tamanho):
        if tamanho not in self.cache:
            self.cache[tamanho] = self.ImageFont.truetype(str(PASTA_FONTES / FONTE), tamanho)
        return self.cache[tamanho].getlength(texto)


def limpar(texto, caixa_alta):
    t = re.sub(r"[,.;:…]+$", "", texto.replace("{", "(").replace("}", ")").replace("\\", ""))
    return t.upper() if caixa_alta else t


def paginar(pal, medir, caixa_alta):
    largura_max = ZONA["x1"] - ZONA["x0"] - 2 * LEGENDA["contorno"]
    tam = LEGENDA["tamanho"]

    def larg(lista):
        return medir(" ".join(limpar(w["texto"], caixa_alta) for w in lista), tam)

    def curta(w):
        return w["texto"].lower() in LIGA and not re.search(r"[,.;:!?…]$", w["texto"])

    paginas, atual = [], []
    for p in pal:
        if atual:
            ult = atual[-1]
            fim_frase = re.search(r"[.!?…]$", ult["texto"])
            pausa = re.search(r"[,;:]$", ult["texto"]) or p["ini"] - ult["fim"] > 0.6 or p["seg"] != ult["seg"]
            lotada = len(atual) >= LEGENDA["max_palavras"] or p["fim"] - atual[0]["ini"] > LEGENDA["max_dur_s"]
            comprida = larg(atual + [p]) > largura_max
            if fim_frase or pausa:
                paginas.append(atual)
                atual = []
            elif lotada or comprida:
                k = 0
                while k < len(atual) and curta(atual[len(atual) - 1 - k]):
                    k += 1
                resto = len(atual) - k
                leva = atual[-k:] if k and (resto >= 2 or (resto == 1 and len(atual[0]["texto"]) >= 6)) else []
                if leva and len(leva) + 1 <= LEGENDA["max_palavras"] and larg(leva + [p]) <= largura_max:
                    paginas.append(atual[:-k])
                    atual = list(leva)
                else:
                    paginas.append(atual)
                    atual = []
        atual.append(p)
    if atual:
        paginas.append(atual)

    saida = []
    for i, pg in enumerate(paginas):
        prox = paginas[i + 1][0]["ini"] if i + 1 < len(paginas) else float("inf")
        fim = max(pg[-1]["fim"], min(pg[-1]["fim"] + 0.4, prox))
        w = larg(pg)
        saida.append({"ini": pg[0]["ini"], "fim": round(fim, 3), "palavras": pg,
                      "tamanho": tam if w <= largura_max else int(tam * largura_max / w)})
    return saida


def cor_ass(hexa, alfa=0):
    h = hexa.lstrip("#")
    r, g, b = h[0:2], h[2:4], h[4:6]
    return f"&H{alfa:02X}{b}{g}{r}".upper()


def t_ass(s):
    cs = int(round(s * 100))
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    seg, cs = divmod(cs, 100)
    return f"{h}:{m:02d}:{seg:02d}.{cs:02d}"


def quebrar_titulo(texto, medir):
    """Título em até 3 linhas equilibradas, dentro da zona segura."""
    palavras = texto.split()
    largura_max = ZONA["x1"] - ZONA["x0"] - 2 * TITULO["caixa"]
    # Menos linhas primeiro (letra um pouco menor em 2 linhas fica melhor que 3 linhas).
    for n in range(1, TITULO["max_linhas"] + 1):
        if n > len(palavras):
            break
        for tam in range(TITULO["tamanho"], TITULO["minimo"] - 1, -4):
            alvo = medir(texto, tam) / n
            linhas, atual = [], []
            for w in palavras:
                if atual and medir(" ".join(atual + [w]), tam) > alvo * 1.15 and len(linhas) < n - 1:
                    linhas.append(atual)
                    atual = []
                atual.append(w)
            linhas.append(atual)
            if all(medir(" ".join(l), tam) <= largura_max for l in linhas):
                return [" ".join(l) for l in linhas], tam
    tam = TITULO["minimo"]
    linhas, atual = [], []
    for w in palavras:
        if atual and medir(" ".join(atual + [w]), tam) > largura_max:
            linhas.append(" ".join(atual))
            atual = []
        atual.append(w)
    linhas.append(" ".join(atual))
    return linhas, tam


def escrever_ass(caminho, paginas, titulo, cor_destaque, caixa_alta, medir):
    destaque = cor_ass(cor_destaque)
    branco = cor_ass(COR_TEXTO)
    estilos = [
        f"Style: Legenda,{FONTE_NOME},{LEGENDA['tamanho']},{branco},{branco},{cor_ass(COR_CONTORNO)},{cor_ass('#000000', 0x80)},"
        f"0,0,0,0,100,100,0,0,1,{LEGENDA['contorno']},{LEGENDA['sombra']},5,0,0,0,1",
    ]
    eventos = []
    if titulo:
        r, g, b = (int(cor_destaque.lstrip("#")[k:k + 2], 16) / 255 for k in (0, 2, 4))
        clara = 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55
        texto_cor = cor_ass("#111111" if clara else "#FFFFFF")
        caixa = cor_ass(cor_destaque)
        estilos.append(f"Style: Titulo,{FONTE_NOME},{titulo['tamanho']},{texto_cor},{texto_cor},{caixa},{caixa},"
                       f"0,0,0,0,100,100,0,0,3,{TITULO['caixa']},0,5,0,0,0,1")
        texto = "\\N".join(titulo["linhas"])
        eventos.append(f"Dialogue: 1,{t_ass(0)},{t_ass(titulo['fim'])},Titulo,,0,0,0,,{{\\pos({CENTRO_X},{titulo['y']})\\fad(0,250)}}{texto}")
    for pg in paginas:
        ws = pg["palavras"]
        tam = f"\\fs{pg['tamanho']}" if pg["tamanho"] != LEGENDA["tamanho"] else ""
        for k, w in enumerate(ws):
            ini = pg["ini"] if k == 0 else w["ini"]
            fim = pg["fim"] if k == len(ws) - 1 else ws[k + 1]["ini"]
            if fim - ini < 0.01:
                continue
            partes = []
            for j, x in enumerate(ws):
                t = limpar(x["texto"], caixa_alta)
                partes.append(f"{{\\c{destaque}}}{t}{{\\c{branco}}}" if j == k else t)
            eventos.append(f"Dialogue: 0,{t_ass(ini)},{t_ass(fim)},Legenda,,0,0,0,,{{\\pos({CENTRO_X},{LEGENDA['y']}){tam}}}{' '.join(partes)}")
    conteudo = "\n".join([
        "[Script Info]", "ScriptType: v4.00+", f"PlayResX: {LARGURA}", f"PlayResY: {ALTURA}", "WrapStyle: 2",
        "ScaledBorderAndShadow: yes", "YCbCr Matrix: TV.709", "",
        "[V4+ Styles]",
        "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, "
        "ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
        *estilos, "",
        "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text", *eventos, "",
    ])
    Path(caminho).write_text(conteudo, encoding="utf-8")


def escrever_srt(caminho, paginas):
    def t(s):
        ms = int(round(s * 1000))
        h, ms = divmod(ms, 3600000)
        m, ms = divmod(ms, 60000)
        seg, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{seg:02d},{ms:03d}"
    blocos = [f"{i}\n{t(pg['ini'])} --> {t(pg['fim'])}\n{' '.join(w['texto'] for w in pg['palavras'])}\n" for i, pg in enumerate(paginas, 1)]
    Path(caminho).write_text("\n".join(blocos), encoding="utf-8")


# ---------------------------------------------------------------- render

ZSCALE = {"arib-std-b67": "arib-std-b67", "smpte2084": "smpte2084", "bt2020": "2020", "bt2020nc": "2020_ncl", "bt2020c": "2020_cl"}


def filtro_video(k, s, clipe, z, tonemap=True):
    """Corte, enquadramento e cor de um trecho. HDR vira SDR com zscale + tonemap; sem
    esses filtros no ffmpeg (tonemap=False), o trecho segue sem conversão (cor lavada)."""
    info = clipe["info"]
    ws, hs, x, y = cover(info["largura"], info["altura"], z)
    a, b = (s["a"] - 0.5) / FPS, (s["b"] - 0.5) / FPS
    cadeia = f"[{s['clipe']}:v]fps={FPS},trim=start={max(0, a):.6f}:end={b:.6f},setpts=PTS-STARTPTS,"
    if info["hdr"] and tonemap:
        tin = ZSCALE.get(info["transferencia"], "arib-std-b67")
        pin = ZSCALE.get(info["primarias"], "2020")
        mi = ZSCALE.get(info["matriz"], "2020_ncl")
        cadeia += (f"scale={ws}:{hs}:flags=lanczos,crop={LARGURA}:{ALTURA}:{x}:{y},"
                   f"zscale=tin={tin}:pin={pin}:min={mi}:rin=tv:t=linear:npl=100,format=gbrpf32le,zscale=p=709,"
                   f"tonemap=tonemap=hable:desat=0,zscale=t=709:m=709:r=tv,format=yuv420p")
    else:
        cadeia += (f"scale={ws}:{hs}:flags=lanczos:in_color_matrix=auto:out_color_matrix=bt709,"
                   f"crop={LARGURA}:{ALTURA}:{x}:{y},format=yuv420p")
    return cadeia + f",setsar=1[v{k}]"


def filtro_audio(k, s):
    a, b = s["a"] / FPS, s["b"] / FPS
    d = b - a
    return (f"[{s['clipe']}:a]aresample=48000:async=1:first_pts=0,atrim=start={a:.6f}:end={b:.6f},asetpts=PTS-STARTPTS,"
            f"aformat=sample_fmts=fltp:channel_layouts=mono,apad=whole_dur={d:.6f},atrim=duration={d:.6f},"
            f"afade=t=in:d={FADE_S},afade=t=out:st={d - FADE_S:.6f}:d={FADE_S}[a{k}]")


def voz(limpeza):
    base = "highpass=f=80"
    if limpeza:
        base += ",afftdn=nr=10:nf=-50:tn=1"
    return base + ",acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120"


def versao_ffmpeg():
    r = subprocess.run(["ffmpeg", "-hide_banner", "-version"], capture_output=True, text=True)
    m = re.search(r"version n?(\d+)", r.stdout)
    return int(m.group(1)) if m else 0


def opcao_grafo(arquivo):
    return ["-/filter_complex", str(arquivo)] if versao_ffmpeg() >= 7 else ["-filter_complex_script", str(arquivo)]


def renderizar(clipes, segs, zs, trabalho, saida, limpeza, legenda_ass):
    entradas = [x for c in clipes for x in ("-i", c["arquivo"])]
    usados = sorted({s["clipe"] for s in segs})
    del usados
    fa = [filtro_audio(k, s) for k, s in enumerate(segs)]
    concat_a = "".join(f"[a{k}]" for k in range(len(segs))) + f"concat=n={len(segs)}:v=0:a=1"

    # Passe 1 (apenas áudio, rápido): mede o volume para a normalização em dois passes.
    medir = trabalho / "grafo-medida.txt"
    medir.write_text(";".join(fa) + f";{concat_a},{voz(limpeza)},pan=stereo|c0=c0|c1=c0,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json[aout]", encoding="utf-8")
    err = ffmpeg([*entradas, *opcao_grafo(medir), "-map", "[aout]", "-f", "null", "-"], cwd=trabalho)
    m = json.loads(err[err.rindex("{"): err.rindex("}") + 1])
    loud = (f"loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}")

    tonemap = not any(c["info"]["hdr"] for c in clipes) or {"zscale", "tonemap"} <= filtros_disponiveis()
    if not tonemap:
        print("aviso: gravação em HDR e ffmpeg sem 'zscale': o vídeo sai com a cor lavada. Instale a versão completa do ffmpeg e rode de novo.")
    fv = [filtro_video(k, s, clipes[s["clipe"]], zs[k], tonemap) for k, s in enumerate(segs)]
    concat_v = "".join(f"[v{k}]" for k in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=0"
    legenda = f",subtitles={legenda_ass}:fontsdir=fontes" if legenda_ass else ""
    grafo = trabalho / "grafo.txt"
    grafo.write_text(";".join(fv + fa) + f";{concat_v}{legenda},format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv[vout];"
                     f"{concat_a},{voz(limpeza)},pan=stereo|c0=c0|c1=c0,{loud},aresample=48000[aout]", encoding="utf-8")
    ffmpeg([
        *entradas, *opcao_grafo(grafo), "-map", "[vout]", "-map", "[aout]",
        "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(saida),
    ], cwd=trabalho)


# ---------------------------------------------------------------- principal

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("projeto")
    ap.add_argument("--legendado", action="store_true", help="reserva sem motor de animação: grava legenda e título com o ffmpeg e entrega o vídeo final")
    args = ap.parse_args()
    exigir_ambiente()
    projeto = Path(args.projeto).expanduser().resolve()
    trabalho = projeto / ".trabalho"
    tr = ler_json(trabalho / "transcricao.json")
    arq_cortes = trabalho / "cortes.json"
    if not arq_cortes.exists():
        sys.exit(f"Falta {arq_cortes}: escreva os cortes a partir de transcricao.txt (formato no SKILL.md).")
    cortes = ler_json(arq_cortes)
    palavras, linhas, clipes, silencios = tr["palavras"], tr["linhas"], tr["clipes"], tr["silencios"]
    por_id = {p["id"]: p for p in palavras}

    removidas, erros = expandir(cortes, palavras, linhas)
    for i, p in enumerate(palavras):
        if p.get("hesitacao") and not cortes.get("manter_hesitacoes"):
            removidas.setdefault(i, "hesitação (automático)")
    correcoes = {k: v for k, v in cortes.get("correcoes", {}).items()}
    for wid, novo in correcoes.items():
        if wid not in por_id:
            erros.append(f"correção para id desconhecido: {wid}")
        elif len(novo.split()) > 3 or (difflib.SequenceMatcher(None, compacto(por_id[wid]["texto"]), compacto(novo)).ratio() < 0.5 and novo not in tr["termos"]):
            erros.append(f"correção de {wid} muda a palavra ('{por_id[wid]['texto']}' → '{novo}'): correção é só de grafia")
    if erros:
        sys.exit("Problemas em cortes.json:\n  " + "\n  ".join(erros))

    segs, total_q, avisos = compilar(palavras, silencios, clipes, removidas)
    if not segs:
        sys.exit("Nada sobrou depois dos cortes.")
    zs = zooms(segs, cortes.get("zoom", True))
    pal_out = palavras_na_saida(palavras, removidas, segs, correcoes)
    caixa_alta = cortes.get("caixa_alta", True)
    cor = cortes.get("cor_destaque", COR_DESTAQUE)
    if not re.fullmatch(r"#[0-9A-Fa-f]{6}", cor):
        sys.exit(f"cor_destaque inválida: {cor} (use #RRGGBB)")
    medir = Medidor()

    paginas = paginar(pal_out, medir, caixa_alta) if cortes.get("legenda", True) else []
    titulo = None
    if cortes.get("titulo"):
        t = cortes["titulo"]
        ids = [p["id"] for p in palavras]
        a, b = ids.index(t["de"]), ids.index(t.get("ate", t["de"]))
        texto = " ".join(correcoes.get(palavras[i]["id"], palavras[i]["texto"]) for i in range(a, b + 1))
        texto = re.sub(r"[,.;:…]+$", "", texto).upper()
        linhas_t, tam = quebrar_titulo(texto, medir)
        posicao = t.get("posicao", "topo")
        # No topo, a caixa encosta no alto da zona segura: quanto mais alto, menos cobre o rosto.
        altura_caixa = len(linhas_t) * tam * 1.25 + 2 * TITULO["caixa"]
        y = round(ZONA["y0"] + 12 + altura_caixa / 2) if posicao == "topo" else TITULO["y"]["meio"]
        titulo = {"texto": texto, "linhas": linhas_t, "tamanho": tam, "y": y,
                  "posicao": posicao, "fim": min(float(t.get("duracao_s", 2.5)), total_q / FPS)}
        if len(linhas_t) > 3 or len(texto.split()) > 8:
            avisos.append(f"título longo ({len(texto.split())} palavras, {len(linhas_t)} linhas): o gancho funciona melhor com 3 a 7 palavras")
        if any(i in removidas for i in range(a, b + 1)):
            avisos.append("o título usa palavras de um trecho que foi cortado (foi dito, mas não está no vídeo)")

    fontes = trabalho / "fontes"
    fontes.mkdir(exist_ok=True)
    (fontes / FONTE).write_bytes((PASTA_FONTES / FONTE).read_bytes())
    ass = "legenda.ass"
    escrever_ass(trabalho / ass, paginas, titulo, cor, caixa_alta, medir)
    escrever_srt(projeto / "legenda.srt", paginas)

    inicio = time.time()
    if args.legendado:
        # Reserva sem motor de animação: legenda e título gravados direto pelo ffmpeg.
        final = projeto / "video-final.mp4"
        print(f"Renderizando {len(segs)} trechos, {tempo(total_q / FPS)} de vídeo ...", flush=True)
        renderizar(clipes, segs, zs, trabalho, final, cortes.get("limpeza_voz", True), ass if (paginas or titulo) else None)
        ffmpeg(["-i", str(final), "-frames:v", "1", "-q:v", "2", str(projeto / "capa.jpg")])
    else:
        # Padrão: só a pessoa, cortada e com a voz tratada; o compor.py desenha o resto.
        publico = trabalho / "publico"
        (publico / "fontes").mkdir(parents=True, exist_ok=True)
        (publico / "fontes" / FONTE).write_bytes((PASTA_FONTES / FONTE).read_bytes())
        final = publico / "aroll.mp4"
        print(f"Cortando {len(segs)} trechos, {tempo(total_q / FPS)} de vídeo ...", flush=True)
        renderizar(clipes, segs, zs, trabalho, final, cortes.get("limpeza_voz", True), None)
        # Onde está o rosto: os destaques sobre a pessoa vão para o espaço livre.
        try:
            import percepcao
            r = percepcao.rostos(final, total_q)
            gravar_json(trabalho / "rostos.json", r)
            if r["achou"] < 0.8:
                avisos.append(f"rosto encontrado em só {r['achou'] * 100:.0f}% do vídeo: confira os destaques sobre a pessoa")
            m = percepcao.maos(final, total_q)
            gravar_json(trabalho / "maos.json", m)
            (trabalho / "gestos.txt").write_text(percepcao.resumir_gestos(m, r, pal_out), encoding="utf-8")
        except ImportError:
            (trabalho / "rostos.json").unlink(missing_ok=True)
        except RuntimeError as e:
            # Sem acesso à GPU (proteção do Codex, máquina virtual) o MediaPipe não abre: o corte segue sem o rosto.
            (trabalho / "rostos.json").unlink(missing_ok=True)
            avisos.append(f"leitura do rosto indisponível neste ambiente ({str(e).rsplit(':', 1)[-1].strip()[:100]}). "
                          "O corte saiu. As animações também vão falhar aqui: rode fora da proteção do terminal "
                          "(no Codex, acesso total) ou entregue a reserva (editar.py --legendado)")

    # O que saiu, em texto, para conferir.
    saiu, grupo = [], []
    for i in range(len(palavras) + 1):
        if i < len(palavras) and i in removidas:
            grupo.append(i)
        elif grupo:
            ps = [palavras[j] for j in grupo]
            saiu.append(f"- {tempo(ps[0]['ini'])}  \"{' '.join(p['texto'] for p in ps)}\"" + (f"  ({removidas[grupo[0]]})" if removidas[grupo[0]] else ""))
            grupo = []
    original = sum(c["duracao"] for c in clipes)
    n_pausas = sum(1 for k in range(1, len(segs)) if segs[k]["clipe"] == segs[k - 1]["clipe"]) - len(saiu)
    (projeto / "cortes.txt").write_text(
        f"Duração: {tempo(original)} gravados → {tempo(total_q / FPS)} no vídeo final\n\n"
        f"Falas removidas ({len(saiu)}):\n" + ("\n".join(saiu) if saiu else "- nenhuma") + "\n\n"
        f"Pausas encurtadas e silêncios de início/fim: automáticos ({max(0, n_pausas)} cortes de pausa)\n",
        encoding="utf-8")

    gravar_json(trabalho / "plano.json", {
        "duracao_q": total_q, "fps": FPS, "segmentos": segs, "zooms": zs, "palavras": pal_out,
        "paginas": [{"ini": p["ini"], "fim": p["fim"], "texto": " ".join(w["texto"] for w in p["palavras"]), "tamanho": p["tamanho"],
                     "palavras": [{"texto": limpar(w["texto"], False), "ini": w["ini"], "fim": w["fim"]} for w in p["palavras"]]} for p in paginas],
        "caixa_alta": caixa_alta, "cor_destaque": cor,
        "titulo": titulo, "termos": tr["termos"], "removidas": sorted(removidas), "avisos": avisos,
        "palavras_removidas": [{"id": palavras[i]["id"], "ini": palavras[i]["ini"], "fim": palavras[i]["fim"]} for i in sorted(removidas)],
    })
    print(f"Pronto em {time.time() - inicio:.0f} s: {final}" + ("" if args.legendado else "  (próximo passo: compor.py)"))
    print(f"{len(segs)} trechos, {len(saiu)} falas removidas, {len(paginas)} páginas de legenda" + (f", título: {titulo['texto']}" if titulo else ""))
    for a in avisos:
        print(f"aviso: {a}")


if __name__ == "__main__":
    main()
