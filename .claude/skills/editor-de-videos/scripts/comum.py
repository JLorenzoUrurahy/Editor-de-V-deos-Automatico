"""Funções comuns aos scripts do editor de vídeos.

Só biblioteca padrão aqui: o verificar.py importa este arquivo antes de existir
o ambiente com as dependências.
"""
import json
import math
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

PASTA_SKILL = Path(__file__).resolve().parent.parent
PASTA_FONTES = PASTA_SKILL / "fontes"
FONTE = "PlusJakartaSans-ExtraBold.ttf"
FONTE_NOME = "Plus Jakarta Sans ExtraBold"

FPS = 30
LARGURA, ALTURA = 1080, 1920
# Zona segura: o que fica livre da interface do Reels, TikTok e Shorts (margem
# conservadora; a lateral direita é mais estreita devido aos botões).
ZONA = {"x0": 108, "x1": 918, "y0": 288, "y1": 1440}
CENTRO_X = (ZONA["x0"] + ZONA["x1"]) // 2

MODELO = "large-v3-turbo"
VERSAO = "2.0.0"


def casa():
    """Pasta do ambiente da skill (Python isolado e modelo)."""
    return Path(os.environ.get("EDITOR_VIDEOS_HOME", Path.home() / ".editor-de-videos"))


def python_do_ambiente():
    pasta = casa() / "venv"
    if platform.system() == "Windows":
        return pasta / "Scripts" / "python.exe"
    return pasta / "bin" / "python"


def no_ambiente():
    """True se este processo já roda no Python do ambiente da skill."""
    try:
        return Path(sys.prefix).resolve() == (casa() / "venv").resolve()
    except OSError:
        return False


def comando_verificar(instalar=True):
    """Comando para rodar o verificar.py neste sistema, com o caminho completo."""
    script = PASTA_SKILL / "scripts" / "verificar.py"
    python = "py" if platform.system() == "Windows" else "python3"
    return f"{python} \"{script}\"" + (" --instalar" if instalar else "")


def exigir_ambiente():
    if no_ambiente():
        return
    py = python_do_ambiente()
    if py.exists():
        sys.exit(f"Rode este script com o Python do ambiente da skill:\n  \"{py}\" {' '.join(sys.argv)}")
    sys.exit(f"O ambiente da skill ainda não foi instalado. Rode primeiro: {comando_verificar()}")


def ler_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def gravar_json(p, obj):
    Path(p).write_text(json.dumps(obj, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def tempo(s):
    """Segundos → mm:ss.cc"""
    s = max(0.0, s)
    m, r = divmod(s, 60)
    return f"{int(m):02d}:{r:05.2f}"


class ErroFfmpeg(RuntimeError):
    pass


def ffmpeg(args, cwd=None):
    cmd = ["ffmpeg", "-hide_banner", "-nostdin", "-y", *args]
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        fim = "\n".join(r.stderr.strip().splitlines()[-15:])
        raise ErroFfmpeg(f"ffmpeg falhou (código {r.returncode}):\n{fim}")
    return r.stderr


def sondar(arquivo):
    """Resumo do arquivo: dimensões como aparecem na tela (já com a rotação do
    celular), taxa de quadros, HDR, áudio e durações."""
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(arquivo)],
        capture_output=True, text=True, encoding="utf-8", errors="replace",
    )
    if r.returncode != 0:
        raise ErroFfmpeg(f"Não consegui ler {arquivo}: {r.stderr.strip()[-300:]}")
    info = json.loads(r.stdout)
    video = next((s for s in info["streams"] if s.get("codec_type") == "video" and not s.get("disposition", {}).get("attached_pic")), None)
    audio = next((s for s in info["streams"] if s.get("codec_type") == "audio"), None)
    if video is None:
        raise ErroFfmpeg(f"{arquivo} não tem vídeo.")
    rot = 0
    for sd in video.get("side_data_list", []) or []:
        if "rotation" in sd:
            rot = int(round(float(sd["rotation"])))
    if "rotate" in video.get("tags", {}):
        rot = int(video["tags"]["rotate"])
    w, h = int(video["width"]), int(video["height"])
    if abs(rot) % 180 == 90:
        w, h = h, w
    num, den = (video.get("avg_frame_rate") or "0/1").split("/")
    fps = float(num) / float(den) if float(den) else 0.0
    trc = video.get("color_transfer", "")
    dur_v = float(video.get("duration") or info["format"].get("duration") or 0)
    dur_a = float(audio.get("duration") or info["format"].get("duration") or 0) if audio else 0.0
    return {
        "arquivo": str(arquivo),
        "largura": w,
        "altura": h,
        "rotacao": rot,
        "fps": round(fps, 3),
        "vfr": video.get("r_frame_rate") != video.get("avg_frame_rate"),
        "hdr": trc in ("arib-std-b67", "smpte2084"),
        "transferencia": trc,
        "primarias": video.get("color_primaries", ""),
        "matriz": video.get("color_space", ""),
        "codec": video.get("codec_name"),
        "tem_audio": audio is not None,
        "duracao_video": dur_v,
        "duracao_audio": dur_a,
        "duracao": float(info["format"].get("duration") or 0),
    }


def filtros_disponiveis():
    r = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    nomes = set()
    for linha in r.stdout.splitlines():
        partes = linha.split()
        if len(partes) >= 3 and "->" in partes[2]:
            nomes.add(partes[1])
    return nomes


def rotular_folha(arquivo, colunas, total, w, h, passo, padding=4, tamanho=16):
    """Escreve o tempo de cada quadro (hh:mm:ss.mmm) numa folha montada pelo filtro tile.
    Feito com o Pillow, e não com o drawtext do ffmpeg: o ffmpeg do Homebrew vem sem ele."""
    from PIL import Image, ImageDraw, ImageFont  # só no ambiente da skill
    img = Image.open(arquivo).convert("RGB")
    desenho = ImageDraw.Draw(img)
    fonte = ImageFont.truetype(str(PASTA_FONTES / FONTE), tamanho)
    for i in range(total):
        s = i * passo
        texto = f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{s % 60:06.3f}"
        x = (i % colunas) * (w + padding) + 6
        y = (i // colunas) * (h + padding) + h - tamanho - 10
        caixa = desenho.textbbox((x, y), texto, font=fonte)
        desenho.rectangle((caixa[0] - 4, caixa[1] - 4, caixa[2] + 4, caixa[3] + 4), fill=(0, 0, 0))
        desenho.text((x, y), texto, font=fonte, fill=(255, 255, 255))
    img.save(arquivo, quality=90)


def espaco_livre_gb(pasta):
    return shutil.disk_usage(pasta).free / 1e9


def cover(largura, altura, zoom=1.0):
    """Escala que cobre 1080x1920 (com zoom) e a posição do recorte. O recorte
    fica centrado na horizontal e puxado para cima na vertical (âncora 0,35),
    para o zoom não cortar a cabeça."""
    s = max(LARGURA / largura, ALTURA / altura) * zoom
    ws = max(LARGURA, int(math.ceil(largura * s / 2)) * 2)
    hs = max(ALTURA, int(math.ceil(altura * s / 2)) * 2)
    x = (ws - LARGURA) // 2
    y = int(round((hs - ALTURA) * 0.35))
    return ws, hs, x, y
