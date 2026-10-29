#!/usr/bin/env python3
"""Etapa 3 do editor (SKILL.md): lê as gravações, detecta as pausas e transcreve com o tempo
de cada palavra. Cria a pasta do projeto ao lado do primeiro vídeo.

uso: <python do ambiente> scripts/transcrever.py VIDEO [VIDEO ...] [--termos "Marca, Produto, Nome"] [--saida PASTA]

Vários vídeos viram uma gravação só, na ordem dada.
Saída em <pasta>/.trabalho/:
  transcricao.txt   para ler e decidir os cortes (uma linha por frase, com id)
  palavras.txt      uma palavra por linha, com id e tempo (para cortes finos)
  transcricao.json  tudo, para os outros scripts

Cuidados que o script já toma:
- O Whisper às vezes engole uma frase repetida (quando a pessoa erra e repete).
  Trechos com fala e sem palavra, ou palavras esticadas por cima de uma pausa, são
  retranscritos sozinhos; o que voltar entra marcado como recuperado.
- Palavras "ouvidas" dentro de silêncio longo são invenção do modelo e saem.
- O limiar de silêncio se ajusta ao ruído de fundo de cada gravação.
"""
import argparse
import difflib
import os
import re
import sys
import wave
from pathlib import Path

sys.dont_write_bytecode = True  # não deixa __pycache__ dentro da pasta da skill
sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import FPS, MODELO, VERSAO, casa, exigir_ambiente, ffmpeg, gravar_json, sondar, tempo  # noqa: E402

JANELA_S = 28.0
MIN_BLOCO_S = 12.0
SILENCIO_LONGO_S = 1.5
BORDA_S = 0.3
PAUSA_LINHA_S = 0.45


# ---------------------------------------------------------------- silêncios

def detectar_silencios(audio, taxa=16000, minimo=0.1):
    """Silêncios pelo nível do áudio em janelas de 20 ms. O limiar se mede pela
    própria gravação: 18 dB abaixo do nível da fala (percentil 90); em sala
    barulhenta, pelo menos 3 dB acima do ruído de fundo (percentil 20). Fica
    entre -50 e -28 dB. (O piso absoluto engana: celular grava o começo quase em
    silêncio digital, bem abaixo das pausas reais entre frases.)"""
    import numpy as np

    n = int(taxa * 0.02)
    k = len(audio) // n
    if k == 0:
        return [], -40.0
    janelas = audio[: k * n].reshape(k, n)
    db = 20 * np.log10(np.sqrt((janelas ** 2).mean(axis=1)) + 1e-9)
    fala = float(np.percentile(db, 90))
    fundo = float(np.percentile(db, 20))
    limiar = min(max(fala - 18, fundo + 3, -50.0), -28.0)
    baixo = db < limiar
    silencios, i = [], 0
    while i < k:
        if baixo[i]:
            j = i
            while j < k and baixo[j]:
                j += 1
            if (j - i) * 0.02 >= minimo:
                silencios.append({"inicio": round(i * 0.02, 3), "fim": round(j * 0.02, 3)})
            i = j
        else:
            i += 1
    return fundir(silencios), round(limiar, 1)


def fundir(silencios):
    """Silêncios separados por menos de 0,12 s (estalo, respiração) são um só."""
    saida = []
    for s in silencios:
        if saida and s["inicio"] - saida[-1]["fim"] < 0.12:
            saida[-1]["fim"] = max(saida[-1]["fim"], s["fim"])
        else:
            saida.append(dict(s))
    for s in saida:
        s["dur"] = round(s["fim"] - s["inicio"], 3)
    return saida


def planejar_blocos(silencios, ini, fim):
    """Blocos de até 28 s cobrindo [ini, fim], cortados sempre dentro de silêncios
    (cada bloco recebe a dica com os termos, que assim vale para o arquivo todo)."""
    def bordas(s):
        margem = min(BORDA_S, s["dur"] / 2)
        return s["inicio"] + margem, s["fim"] - margem

    sil = [s for s in silencios if s["inicio"] >= ini and s["fim"] <= fim]
    inicio = ini
    if sil and sil[0]["inicio"] <= ini + 0.05:
        inicio = bordas(sil[0])[1]
    blocos = []
    while inicio < fim - 0.2:
        limite = inicio + JANELA_S
        dentro = [s for s in sil if inicio + 1.0 < s["inicio"] and (s["inicio"] + s["fim"]) / 2 <= limite]
        longos = [s for s in dentro if s["dur"] >= SILENCIO_LONGO_S]
        tardios = [s for s in dentro if (s["inicio"] + s["fim"]) / 2 > inicio + MIN_BLOCO_S]
        if longos:
            escolhido = longos[0]
        elif limite >= fim:
            escolhido = None
        elif tardios:
            escolhido = max(tardios, key=lambda s: s["dur"])
        elif dentro:
            escolhido = max(dentro, key=lambda s: s["dur"])
        else:
            escolhido = None
        if escolhido is None:
            b = min(limite, fim)
            blocos.append((inicio, b))
            inicio = b
        else:
            b, proximo = bordas(escolhido)
            blocos.append((inicio, b))
            inicio = proximo
    return [(round(a, 3), round(b, 3)) for a, b in blocos if b - a > 0.2]


# ---------------------------------------------------------------- transcrição

class Transcritor:
    def __init__(self, termos):
        from faster_whisper import WhisperModel

        try:
            import ctranslate2
            gpu = ctranslate2.get_cuda_device_count() > 0
        except Exception:
            gpu = False
        self.modelo = WhisperModel(
            MODELO,
            device="cuda" if gpu else "cpu",
            compute_type="float16" if gpu else "int8",
            cpu_threads=os.cpu_count() or 4,
            download_root=str(casa() / "modelos"),
            local_files_only=True,
        )
        self.dica = "Vídeo em português do Brasil." + (f" Termos: {', '.join(termos)}." if termos else "")

    def __call__(self, audio, ini, fim, idioma="pt", dica=True):
        trecho = audio[int(ini * 16000): int(fim * 16000)]
        segmentos, _ = self.modelo.transcribe(
            trecho,
            language=idioma,
            word_timestamps=True,
            initial_prompt=self.dica if dica else None,
            condition_on_previous_text=False,
            vad_filter=False,
            beam_size=5,
        )
        palavras = []
        for seg in segmentos:
            for w in seg.words or []:
                texto = w.word.strip()
                if texto:
                    palavras.append({"texto": texto, "ini": round(ini + w.start, 3), "fim": round(ini + w.end, 3), "prob": round(w.probability, 3)})
        return palavras


def juntar_fragmentos(palavras):
    """O Whisper separa "e -mail", "39 %", "R $" e "47 ,00": junta o fragmento à
    palavra anterior."""
    saida = []
    for p in palavras:
        t = p["texto"]
        ant = saida[-1]["texto"] if saida else ""
        gruda = (
            (t.startswith("-") and len(t) > 1)
            or t in ("%", "%.", "%,")
            or (t.startswith("$") and ant in ("R", "US"))
            or (re.match(r"^[,.]\d", t) and re.search(r"\d$", ant))
        )
        if gruda and saida:
            saida[-1]["texto"] += p["texto"]
            saida[-1]["fim"] = p["fim"]
            saida[-1]["prob"] = min(saida[-1]["prob"], p["prob"])
        else:
            saida.append(p)
    return saida


def dentro_de_silencio(p, silencios):
    return any(s["dur"] >= 1.0 and p["ini"] >= s["inicio"] + 0.1 and p["fim"] <= s["fim"] - 0.3 for s in silencios)


def recuperar(palavras, silencios, transcrever, clipes):
    """Fala que o Whisper engoliu. Dois sintomas:
    1. palavra esticada: dura mais de 1,5 s e tem 0,5 s ou mais de silêncio dentro
       (a repetição foi suprimida e a palavra anterior foi estendida até a seguinte);
    2. trecho com som de fala (0,6 s ou mais fora de silêncio) sem nenhuma palavra.
    Cada trecho é retranscrito sozinho; o que voltar entra com "recuperada"."""
    novas = []
    for p in palavras:
        dentro = [s for s in silencios if s["inicio"] > p["ini"] and s["fim"] < p["fim"]]
        if p["fim"] - p["ini"] > 1.5 and sum(s["dur"] for s in dentro) >= 0.5:
            fim_sil = dentro[0]["fim"]
            achadas = [w for w in transcrever(fim_sil - 0.15, p["fim"] + 0.8) if fim_sil - 0.2 <= w["ini"] < p["fim"] - 0.03]
            if achadas:
                p["fim"] = round(dentro[0]["inicio"], 3)
                for k, w in enumerate(achadas):
                    w["ini"] = max(w["ini"], fim_sil)
                    prox = achadas[k + 1]["ini"] if k + 1 < len(achadas) else w["fim"]
                    w["fim"] = round(min(w["fim"], prox) if k + 1 < len(achadas) else w["fim"], 3)
                    w["recuperada"] = True
                novas += achadas
    palavras = sorted(palavras + novas, key=lambda w: w["ini"])

    for c in clipes:
        a0, b0 = c["inicio"], c["inicio"] + c["duracao"]
        for a, b in trechos_de_fala(silencios, a0, b0):
            if b - a < 0.6:
                continue
            coberto = sum(max(0.0, min(b, w["fim"]) - max(a, w["ini"])) for w in palavras)
            if coberto / (b - a) >= 0.3:
                continue
            achadas = [w for w in transcrever(max(a0, a - 0.15), min(b0, b + 0.15))
                       if a - 0.1 <= (w["ini"] + w["fim"]) / 2 <= b + 0.1
                       and not any(min(w["fim"], q["fim"]) - max(w["ini"], q["ini"]) > 0.05 for q in palavras)]
            for w in achadas:
                if eh_hesitacao(w["texto"]):
                    w.update({"texto": "(hesitação)", "hesitacao": True, "prob": 1.0})
                else:
                    w["recuperada"] = True
            palavras = sorted(palavras + achadas, key=lambda w: w["ini"])
    return palavras, sum(1 for w in palavras if w.get("recuperada"))  # hesitações contadas à parte


def trechos_de_fala(silencios, a0, b0):
    sil = [s for s in silencios if s["fim"] > a0 and s["inicio"] < b0]
    cursor, falas = a0, []
    for s in sil:
        if s["inicio"] > cursor:
            falas.append((cursor, min(s["inicio"], b0)))
        cursor = max(cursor, s["fim"])
    if cursor < b0:
        falas.append((cursor, b0))
    return falas


def eh_hesitacao(texto):
    """"Ééé", "Ê...", "hum", "ahn": som de hesitação, não palavra."""
    import unicodedata
    letras = "".join(c for c in unicodedata.normalize("NFD", texto.lower()) if c.isalpha() and unicodedata.category(c) != "Mn")
    if letras == "e":
        return texto.rstrip().endswith(("...", "…")) or texto.count(texto[0]) > 1
    # "um" e "há" são palavras; "hum", "umm", "ahn", "hãn" não.
    return bool(re.fullmatch(r"e+h+m*|e{2,}|h+m+|hu+m+|u{2,}m*|um{2,}|u+h+m*|a+h+n*|ha+n+|h+a{2,}", letras))


def marcar_hesitacoes(palavras, silencios, transcrever, clipes):
    """Som de fala sem palavra no começo de um trecho ("ééé", "hum"): o Whisper não
    escreve hesitação, e ela ficaria grudada na frase seguinte. O trecho livre
    (sem palavra cobrindo) é retranscrito sozinho; vira palavra recuperada se for
    fala de verdade, ou um item "(hesitação)" que a montagem remove sozinha.
    Palavra retranscrita só entra se tiver duração, confiança e não repetir uma
    vizinha (retranscrição de trecho curto inventa e duplica)."""
    novas = []
    for c in clipes:
        for a, b in trechos_de_fala(silencios, c["inicio"], c["inicio"] + c["duracao"]):
            ws = [w for w in palavras if a - 0.15 <= w["ini"] < b]
            if not ws:
                continue
            primeiro = min(w["ini"] for w in ws)
            livre = max([a] + [w["fim"] for w in palavras if w["ini"] < a <= w["fim"]])
            if primeiro - livre < 0.4:
                continue
            ouvidas = [w for w in transcrever(livre - 0.05, primeiro + 0.1, dica=False) if w["fim"] <= primeiro + 0.15]
            hes = [w for w in ouvidas if eh_hesitacao(w["texto"])]
            reais = [w for w in ouvidas if not eh_hesitacao(w["texto"]) and w["fim"] - w["ini"] >= 0.08 and w["prob"] >= 0.5
                     and not any(min(w["fim"], q["fim"]) - max(w["ini"], q["ini"]) > 0.03 for q in palavras)
                     and normalizar(w["texto"]) != normalizar(ws[0]["texto"])]
            for w in reais:
                w["recuperada"] = True
            novas += reais
            if hes:
                fim_h = min(primeiro - 0.03, min([w["ini"] for w in reais], default=primeiro) - 0.03)
                if fim_h - livre >= 0.3:
                    novas.append({"texto": "(hesitação)", "ini": round(livre, 3), "fim": round(fim_h, 3), "prob": 1.0,
                                  "hesitacao": True, "clipe": ws[0]["clipe"]})
    palavras = sorted(palavras + novas, key=lambda w: w["ini"])
    return palavras, sum(1 for w in palavras if w.get("hesitacao"))


# ---------------------------------------------------------------- leitura

def normalizar(t):
    return re.sub(r"[^\w]+", "", t.lower(), flags=re.UNICODE)


def montar_linhas(palavras):
    linhas, atual = [], []
    for p in palavras:
        if atual:
            ant = atual[-1]
            quebra = (
                p["ini"] - ant["fim"] >= PAUSA_LINHA_S
                or re.search(r"[.!?…]$", ant["texto"])
                or p["clipe"] != ant["clipe"]
                or len(atual) >= 18
            )
            if quebra:
                linhas.append(atual)
                atual = []
        atual.append(p)
    if atual:
        linhas.append(atual)
    largura = 2 if len(linhas) < 100 else 3
    return [
        {"id": f"f{i + 1:0{largura}d}", "de": l[0]["id"], "ate": l[-1]["id"], "ini": l[0]["ini"], "fim": l[-1]["fim"], "clipe": l[0]["clipe"]}
        for i, l in enumerate(linhas)
    ], linhas


def sugerir_retakes(linhas_pal, linhas):
    """Linhas parecidas perto uma da outra: provável erro e repetição."""
    linhas_pal = [[p for p in l if not p.get("hesitacao")] or l for l in linhas_pal]
    norm = [[normalizar(p["texto"]) for p in l if not p.get("hesitacao")] for l in linhas_pal]
    sugestoes = []
    for i in range(len(norm) - 1):
        # "...adicionando ela no meu | No meu vídeo": o fim de uma linha repete o começo da próxima.
        a, b = norm[i], norm[i + 1]
        if re.search(r"[.!?…]$", linhas_pal[i][-1]["texto"]):
            continue  # frase completa: repetir de propósito ("...você vai ganhar. Você vai ganhar...") não é erro
        for k in range(min(len(a), len(b), 5), 1, -1):
            if a[-k:] == b[:k]:
                sugestoes.append(f"{linhas[i]['id']} termina como {linhas[i + 1]['id']} começa (\"{' '.join(p['texto'] for p in linhas_pal[i][-k:])}\"): "
                                 f"provável repetição; se for, tire {linhas_pal[i][-k]['id']}–{linhas_pal[i][-1]['id']}")
                break
    for i in range(len(norm)):
        for j in range(i + 1, min(i + 4, len(norm))):
            a, b = norm[i], norm[j]
            if len(a) < 2 or len(b) < 2:
                continue
            prefixo = a == b[: len(a)] or b == a[: len(b)]
            parecido = difflib.SequenceMatcher(None, a, b, autojunk=False).ratio() >= 0.6
            mesmo_comeco = a[:2] == b[:2]
            if prefixo and min(len(a), len(b)) >= 2:
                sugestoes.append(f"{linhas[i]['id']} e {linhas[j]['id']} começam iguais: a primeira deve ser um começo interrompido")
                break
            if parecido and mesmo_comeco:
                sugestoes.append(f"{linhas[i]['id']} ≈ {linhas[j]['id']}: provável repetição (fica a última completa)")
                break
    return sugestoes


def texto_legivel(palavras, linhas, linhas_pal, clipes, sugestoes, limiar):
    total = sum(c["duracao"] for c in clipes)
    cab = [
        f"# Transcrição: {len(clipes)} vídeo(s), {tempo(total)} no total, {len(palavras)} palavras (limiar de silêncio {limiar} dB)",
        "# Cada linha: id, tempo de início, palavras (de–até), texto. Pausas de 1 s ou mais aparecem entre as linhas.",
        "# ⟨palavra⟩ = confiança baixa (confira o sentido). «palavra» = recuperada (o Whisper tinha engolido: costuma ser uma repetição).",
        "# «ééé» = hesitação sem palavra; a montagem remove sozinha.",
    ]
    if sugestoes:
        cab.append("# Prováveis repetições para conferir:")
        cab += [f"#   {s}" for s in sugestoes]
    saida = cab + [""]
    clipe_atual = None
    for k, (l, pal) in enumerate(zip(linhas, linhas_pal)):
        if len(clipes) > 1 and l["clipe"] != clipe_atual:
            clipe_atual = l["clipe"]
            saida.append(f"--- vídeo {clipe_atual + 1}: {Path(clipes[clipe_atual]['arquivo']).name} ---")
        if k > 0 and l["ini"] - linhas[k - 1]["fim"] >= 1.0 and l["clipe"] == linhas[k - 1]["clipe"]:
            saida.append(f"        · pausa {l['ini'] - linhas[k - 1]['fim']:.1f} s")

        def marca(p):
            if p.get("hesitacao"):
                return "«ééé»"
            if p.get("recuperada"):
                return f"«{p['texto']}»"
            if p["prob"] < 0.4:
                return f"⟨{p['texto']}⟩"
            return p["texto"]

        faixa = f"{l['de']}–{l['ate']}"
        saida.append(f"{l['id']}  {tempo(l['ini'])}  {faixa:<12} {' '.join(marca(p) for p in pal)}")
    return "\n".join(saida) + "\n"


# ---------------------------------------------------------------- principal

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("videos", nargs="+")
    ap.add_argument("--termos", default="", help="nomes e termos que a legenda precisa acertar, separados por vírgula")
    ap.add_argument("--saida", help="pasta do projeto (padrão: <primeiro vídeo>-editado ao lado dele)")
    ap.add_argument("--idioma", default="pt")
    args = ap.parse_args()
    exigir_ambiente()
    import numpy as np

    arquivos = [Path(v).expanduser().resolve() for v in args.videos]
    for a in arquivos:
        if not a.exists():
            sys.exit(f"Arquivo não encontrado: {a}")
    projeto = Path(args.saida).expanduser().resolve() if args.saida else arquivos[0].parent / f"{arquivos[0].stem}-editado"
    trabalho = projeto / ".trabalho"
    trabalho.mkdir(parents=True, exist_ok=True)
    termos = [t.strip() for t in args.termos.split(",") if t.strip()]

    clipes, inicio = [], 0.0
    for a in arquivos:
        info = sondar(a)
        if not info["tem_audio"]:
            sys.exit(f"{a.name} não tem áudio.")
        # Duração útil: a menor entre vídeo e áudio, em quadros inteiros.
        dur = int(min(info["duracao_video"] or info["duracao"], info["duracao_audio"] or info["duracao"]) * FPS - 1) / FPS
        clipes.append({"arquivo": str(a), "info": info, "inicio": round(inicio, 6), "duracao": round(dur, 6)})
        inicio += dur
        avisos = []
        if info["largura"] > info["altura"]:
            avisos.append("gravado na horizontal: as laterais serão cortadas para virar vertical")
        if info["hdr"]:
            avisos.append("gravado em HDR: as cores serão convertidas para o padrão das redes")
        if info["vfr"]:
            avisos.append("taxa de quadros variável (normal em celular): será padronizada em 30 qps")
        print(f"{a.name}: {info['largura']}x{info['altura']}, {info['fps']:.0f} qps, {tempo(dur)}" + (f" ({'; '.join(avisos)})" if avisos else ""))

    wav = trabalho / "audio16k.wav"
    partes = [f"[{i}:a]aresample=16000:async=1:first_pts=0,atrim=end={c['duracao']:.6f},asetpts=PTS-STARTPTS,aformat=sample_fmts=s16:channel_layouts=mono[a{i}]" for i, c in enumerate(clipes)]
    grafo = ";".join(partes) + ";" + "".join(f"[a{i}]" for i in range(len(clipes))) + f"concat=n={len(clipes)}:v=0:a=1[a]"
    entradas = [x for c in clipes for x in ("-i", c["arquivo"])]
    ffmpeg([*entradas, "-filter_complex", grafo, "-map", "[a]", "-c:a", "pcm_s16le", str(wav)])
    with wave.open(str(wav), "rb") as w:
        audio = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    duracao = len(audio) / 16000

    silencios, limiar = detectar_silencios(audio)
    print(f"Transcrevendo {tempo(duracao)} de fala (a primeira carga do modelo leva alguns segundos) ...", flush=True)
    t = Transcritor(termos)
    palavras = []
    for k, c in enumerate(clipes):
        for a, b in planejar_blocos(silencios, c["inicio"], c["inicio"] + c["duracao"]):
            for p in t(audio, a, b, args.idioma):
                p["clipe"] = k
                palavras.append(p)
    palavras = juntar_fragmentos(palavras)
    descartadas = [p for p in palavras if dentro_de_silencio(p, silencios)]
    palavras = [p for p in palavras if not dentro_de_silencio(p, silencios)]

    def retranscrever(a, b, dica=True):
        ws = t(audio, max(0.0, a), min(duracao, b), args.idioma, dica=dica)
        for w in ws:
            w["clipe"] = next((k for k, c in enumerate(clipes) if c["inicio"] <= w["ini"] < c["inicio"] + c["duracao"]), len(clipes) - 1)
        return ws

    palavras, n_recuperadas = recuperar(palavras, silencios, retranscrever, clipes)
    palavras, n_hesitacoes = marcar_hesitacoes(palavras, silencios, retranscrever, clipes)
    for i, p in enumerate(palavras):
        p["id"] = f"w{i + 1}"
    palavras = [{"id": p["id"], **{k: v for k, v in p.items() if k != "id"}} for p in palavras]
    linhas, linhas_pal = montar_linhas(palavras)
    sugestoes = sugerir_retakes(linhas_pal, linhas)

    gravar_json(trabalho / "transcricao.json", {
        "versao": VERSAO,
        "modelo": MODELO,
        "idioma": args.idioma,
        "termos": termos,
        "clipes": clipes,
        "duracao": round(duracao, 3),
        "limiar_silencio_db": limiar,
        "silencios": silencios,
        "palavras": palavras,
        "linhas": linhas,
        "descartadas": descartadas,
        "sugestoes": sugestoes,
    })
    (trabalho / "transcricao.txt").write_text(texto_legivel(palavras, linhas, linhas_pal, clipes, sugestoes, limiar), encoding="utf-8")
    meios = [(p["ini"] + p["fim"]) / 2 for p in palavras]
    linhas_pal_txt = []
    for i, p in enumerate(palavras):
        # Pausa após a palavra: o lugar limpo para um corte.
        limite = meios[i + 1] if i + 1 < len(palavras) else float("inf")
        pausa = next((s for s in silencios if p["ini"] < s["inicio"] < limite), None)
        linhas_pal_txt.append(f"{p['id']:>6}  {tempo(p['ini'])}  {p['texto']}"
                              + ("  (recuperada)" if p.get("recuperada") else "") + ("  (hesitação: sai sozinha)" if p.get("hesitacao") else "")
                              + (f"   · pausa {pausa['dur']:.1f} s" if pausa else "") + "\n")
    (trabalho / "palavras.txt").write_text(
        "# id, tempo, palavra; \"· pausa\" marca onde a fala para (corte limpo). Corte sem pausa pode comer sílaba.\n" + "".join(linhas_pal_txt),
        encoding="utf-8",
    )
    print(f"{len(palavras)} palavras em {len(linhas)} linhas; {n_recuperadas} recuperadas; {n_hesitacoes} hesitações; {len(descartadas)} descartadas (dentro de silêncio); "
          f"{len(sugestoes)} prováveis repetições.")
    print(f"Leia: {trabalho / 'transcricao.txt'}")


if __name__ == "__main__":
    main()
