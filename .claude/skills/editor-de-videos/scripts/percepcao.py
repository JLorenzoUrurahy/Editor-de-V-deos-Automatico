"""Percepção da pessoa no vídeo já cortado (MediaPipe, licença Apache 2.0, roda na CPU).

- rostos(): onde está o rosto, um quadro a cada PASSO, para os destaques sobre a
  pessoa irem para o espaço livre e nunca cobrirem o rosto.
- maos(): onde estão as mãos e que gesto fazem (aberta, apontando, contando,
  punho), para as cenas que interagem com a pessoa nascerem do gesto.
- frente(): a pessoa recortada do fundo, em vídeo com transparência, só no trecho
  de uma cena "atrás" ou "profundidade".

Os quadros vão do ffmpeg para o modelo e de volta para o ffmpeg por pipe: nada de
sequência de imagens em disco.
"""
import subprocess
import urllib.request
from pathlib import Path

from comum import ALTURA, FPS, LARGURA, casa

PASSO = 3
MODELOS = {
    "rosto": ("blaze_face_short_range.tflite",
              "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"),
    "pessoa": ("selfie_segmenter.tflite",
               "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite"),
    "mao": ("hand_landmarker.task",
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"),
}


def pasta_modelos():
    return casa() / "modelos" / "mediapipe"


def baixar_modelos():
    pasta = pasta_modelos()
    pasta.mkdir(parents=True, exist_ok=True)
    for arquivo, url in MODELOS.values():
        destino = pasta / arquivo
        if not destino.exists():
            destino.write_bytes(urllib.request.urlopen(url, timeout=120).read())


def modelos_ok():
    return all((pasta_modelos() / arq).exists() for arq, _ in MODELOS.values())


def _opcoes(modelo):
    from mediapipe.tasks.python import BaseOptions
    return BaseOptions(model_asset_path=str(pasta_modelos() / MODELOS[modelo][0]), delegate=BaseOptions.Delegate.CPU)


def _quadros(video, largura, altura, filtro="", ini_f=0, n=None):
    """Quadros RGB do vídeo, um por vez, direto do ffmpeg."""
    import numpy as np

    cmd = ["ffmpeg", "-v", "error", "-nostdin"]
    if ini_f:
        cmd += ["-ss", f"{ini_f / FPS:.6f}"]
    cmd += ["-i", str(video)]
    if n:
        cmd += ["-frames:v", str(n)]
    vf = ",".join(x for x in (filtro, f"scale={largura}:{altura}") if x)
    cmd += ["-vf", vf, "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    tam = largura * altura * 3
    try:
        while True:
            dados = p.stdout.read(tam)
            if len(dados) < tam:
                break
            yield np.frombuffer(dados, np.uint8).reshape(altura, largura, 3)
    finally:
        p.stdout.close()
        p.wait()


def rostos(video, total_f):
    """Caixa do rosto (x, y, w, h em px do quadro 1080x1920) a cada PASSO quadros.
    Sem rosto num quadro, vale a caixa vizinha. Mediana de 5 amostras contra tremida."""
    import mediapipe as mp
    import numpy as np
    from mediapipe.tasks.python import vision

    detector = vision.FaceDetector.create_from_options(vision.FaceDetectorOptions(base_options=_opcoes("rosto"), min_detection_confidence=0.5))
    w, h = LARGURA // 2, ALTURA // 2
    caixas = []
    for q in _quadros(video, w, h, filtro=f"select='not(mod(n\\,{PASSO}))'"):
        r = detector.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(q)))
        if r.detections:
            b = max(r.detections, key=lambda d: d.bounding_box.width * d.bounding_box.height).bounding_box
            caixas.append([b.origin_x * 2, b.origin_y * 2, b.width * 2, b.height * 2])
        else:
            caixas.append(None)
    esperado = (total_f + PASSO - 1) // PASSO
    caixas = (caixas + [None] * esperado)[:esperado]
    conhecidas = [c for c in caixas if c]
    if not conhecidas:
        return {"passo_f": PASSO, "caixas": [], "achou": 0.0}
    achou = len(conhecidas) / max(1, len(caixas))
    ultima = conhecidas[0]
    for k, c in enumerate(caixas):
        if c:
            ultima = c
        else:
            caixas[k] = ultima
    suaves = []
    for k in range(len(caixas)):
        janela = caixas[max(0, k - 2): k + 3]
        suaves.append([int(sorted(c[i] for c in janela)[len(janela) // 2]) for i in range(4)])
    return {"passo_f": PASSO, "caixas": suaves, "achou": round(achou, 3)}


def _gesto(lm):
    """Gesto pelos pontos da mão: dedo esticado quando a ponta fica bem mais longe do
    punho do que a junta do meio."""
    import math

    def d(a, b):
        return math.hypot(a.x - b.x, a.y - b.y)

    w = lm[0]
    i, m, a, mi = (d(lm[tip], w) > d(lm[pip], w) * 1.15 for tip, pip in ((8, 6), (12, 10), (16, 14), (20, 18)))
    esticados = sum((i, m, a, mi))
    if esticados >= 4:
        return "aberta", 5
    if i and not (m or a or mi):
        return "apontando", 1
    if i and m and not (a or mi):
        return "contando", 2
    if i and m and a and not mi:
        return "contando", 3
    if esticados == 0:
        return "punho", 0
    return "outro", esticados


def maos(video, total_f):
    """Mãos a cada PASSO quadros: centro, altura (px do quadro 1080x1920), ponta do
    indicador e gesto. Até duas por amostra."""
    import mediapipe as mp
    import numpy as np
    from mediapipe.tasks.python import vision

    det = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(base_options=_opcoes("mao"), num_hands=2, min_hand_detection_confidence=0.5))
    amostras = []
    for q in _quadros(video, LARGURA // 2, ALTURA // 2, filtro=f"select='not(mod(n\\,{PASSO}))'"):
        r = det.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(q)))
        aqui = []
        for lm in r.hand_landmarks:
            xs = [p.x * LARGURA for p in lm]
            ys = [p.y * ALTURA for p in lm]
            gesto, dedos = _gesto(lm)
            aqui.append({"x": round(sum(xs) / len(xs)), "y": round(sum(ys) / len(ys)), "h": round(max(ys) - min(ys)),
                         "ponta": [round(lm[8].x * LARGURA), round(lm[8].y * ALTURA)], "gesto": gesto, "dedos": dedos})
        amostras.append(aqui)
    esperado = (total_f + PASSO - 1) // PASSO
    amostras = (amostras + [[] for _ in range(esperado)])[:esperado]
    return {"passo_f": PASSO, "amostras": amostras}


def frente(video, ini_f, fim_f, saida: Path):
    """A pessoa recortada do fundo, de ini_f a fim_f, em WebM VP9 com transparência."""
    import cv2
    import mediapipe as mp
    import numpy as np
    from mediapipe.tasks.python import vision

    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=_opcoes("pessoa"), output_confidence_masks=True))
    n = max(1, fim_f - ini_f)
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-nostdin", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{LARGURA}x{ALTURA}", "-r", str(FPS), "-i", "-",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", "-b:v", "0", "-crf", "32",
         "-deadline", "realtime", "-cpu-used", "8", "-row-mt", "1", str(saida)],
        stdin=subprocess.PIPE,
    )
    anterior = None
    try:
        for q in _quadros(video, LARGURA, ALTURA, ini_f=ini_f, n=n):
            m = seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(q))).confidence_masks[0].numpy_view()
            m = np.asarray(m, np.float32)
            # Suaviza no tempo (menos cintilação na borda) e firma a borda (curva suave entre 0,35 e 0,65).
            m = m if anterior is None else 0.7 * m + 0.3 * anterior
            anterior = m
            a = np.clip((m - 0.35) / 0.3, 0, 1)
            a = a * a * (3 - 2 * a)
            a = cv2.GaussianBlur(a, (5, 5), 0)
            rgba = np.dstack([q, (a * 255).astype(np.uint8)])
            enc.stdin.write(rgba.tobytes())
    finally:
        enc.stdin.close()
        enc.wait()
    if enc.returncode != 0:
        raise RuntimeError("o ffmpeg não conseguiu gravar o recorte (precisa do codificador libvpx-vp9)")
    return saida


NOMES_GESTO = {"aberta": "mão aberta", "apontando": "apontando", "contando": "contando nos dedos"}


def resumir_gestos(maos_, rostos_, palavras):
    """Trechos com o mesmo gesto (pelo menos 0,3 s), com a altura em relação ao rosto,
    o lado da tela e a fala do instante. É o que a IA lê para planejar as cenas
    que interagem com a pessoa."""
    from comum import tempo

    passo = maos_["passo_f"]
    caixas = rostos_.get("caixas") or []
    pontos = []
    for k, aqui in enumerate(maos_["amostras"]):
        validas = [m for m in aqui if m["gesto"] in NOMES_GESTO]
        if not validas:
            pontos.append(None)
            continue
        m = max(validas, key=lambda x: x["h"])
        lado = "à esquerda da tela" if m["x"] < LARGURA / 2 else "à direita da tela"
        rosto = caixas[min(k, len(caixas) - 1)] if caixas else None
        if rosto and m["y"] < rosto[1]:
            altura = "acima do rosto"
        elif rosto and m["y"] < rosto[1] + rosto[3]:
            altura = "na altura do rosto"
        else:
            altura = "abaixo do rosto"
        detalhe = f" ({m['dedos']})" if m["gesto"] == "contando" else ""
        pontos.append((f"{NOMES_GESTO[m['gesto']]}{detalhe}, {altura}, {lado}", m["gesto"]))
    trechos, k = [], 0
    while k < len(pontos):
        if not pontos[k]:
            k += 1
            continue
        j = k
        while j + 1 < len(pontos) and (pontos[j + 1] == pontos[k] or (j + 2 < len(pontos) and pontos[j + 1] is None and pontos[j + 2] == pontos[k])):
            j += 1
        if (j - k + 1) * passo / FPS >= 0.3:
            trechos.append((k * passo / FPS, (j + 1) * passo / FPS, pontos[k][0]))
        k = j + 1
    linhas = ["# Gestos no vídeo cortado (tempos do vídeo final). Use para cenas de interação: o objeto nasce na mão,",
              "# os números acompanham a contagem, o elemento sai de onde a pessoa aponta. Sem gesto, use o rosto.", ""]
    for a, b, texto in trechos:
        fala = " ".join(w["texto"] for w in palavras if a - 0.3 <= w["ini"] <= b + 0.3)
        linhas.append(f"{tempo(a)}–{tempo(b)}  {texto:<55} | fala: \"{fala}\"")
    if not trechos:
        linhas.append("(nenhum gesto claro: as mãos ficaram fora do quadro ou paradas)")
    return "\n".join(linhas) + "\n"
