#!/usr/bin/env python3
"""Confere se o computador tem o que o editor precisa e, com --instalar, prepara
o ambiente da skill: Python isolado com o modelo de transcrição, o motor de
animação (Remotion) com o navegador de render, e a skill oficial de boas
práticas do Remotion (baixada do repositório oficial).

uso: python3 scripts/verificar.py             só confere        (Windows: py scripts\verificar.py)
     python3 scripts/verificar.py --instalar  instala o que falta (~3,2 GB na primeira vez)

Tudo fica em ~/.editor-de-videos (apagar a pasta desfaz a instalação). ffmpeg,
Python e Node.js vêm do sistema: quando faltam, o script mostra o comando de
instalação certo para o sistema da pessoa. Sem Node.js, instala só a parte de
transcrição e corte (vídeo cortado e legendado, sem animação).
Última linha da saída: PRONTO, ou FALTA com a lista do que resolver.
"""
import argparse
import io
import os
import platform
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

sys.dont_write_bytecode = True  # não deixa __pycache__ dentro da pasta da skill
os.environ.setdefault("npm_config_update_notifier", "false")  # sem o aviso de versão nova do npm no meio da saída
sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import MODELO, PASTA_SKILL, casa, comando_verificar, espaco_livre_gb, filtros_disponiveis, python_do_ambiente  # noqa: E402

SISTEMA = platform.system()
# MediaPipe fixo na 0.10.21: a 1.0.1 trava no detector de rosto (pede serviço de GPU).
PACOTES = ["faster-whisper>=1.1", "pillow>=10", "mediapipe==0.10.21"]
ESPACO_MIN_GB = 5.0
NODE_MIN = 18
# Skill oficial de boas práticas do Remotion, numa versão fixa (commit de 07/10/2026) para
# toda instalação receber o mesmo texto. É baixada do repositório oficial, nunca embutida.
SKILLS_REMOTION_COMMIT = "32b241b97f4e0e4ab61fe9a41b05e6e64503f8c5"
SKILLS_REMOTION = f"https://codeload.github.com/remotion-dev/skills/zip/{SKILLS_REMOTION_COMMIT}"
AVISO_LICENCA = (
    "Licença do Remotion (motor de animação): grátis para pessoa física, empresa ou equipe de até 3 pessoas e "
    "organização sem fins lucrativos. Com 4 pessoas ou mais (contando sócios, funcionários e freelancers), a empresa "
    "precisa de uma licença paga do Remotion: https://www.remotion.pro/license"
)

INSTRUCOES = {
    "ffmpeg": {
        # A fórmula "ffmpeg" do Homebrew vem sem libass e zimg; a "ffmpeg-full" tem tudo, mas fica fora do PATH.
        "Darwin": "Instale a versão completa do ffmpeg pelo Homebrew: brew install ffmpeg-full   e ponha no PATH: "
                  "echo 'export PATH=\"$(brew --prefix ffmpeg-full)/bin:$PATH\"' >> ~/.zprofile   (depois feche e abra o terminal; "
                  "sem Homebrew: https://brew.sh, depois os comandos)",
        "Windows": "Instale o ffmpeg: winget install --id Gyan.FFmpeg -e   (depois feche e abra o terminal de novo)",
        "Linux": "Instale o ffmpeg: sudo apt install ffmpeg",
    },
    "python": {
        "Darwin": "Instale o Python 3.12: brew install python@3.12   (ou o instalador de https://www.python.org)",
        "Windows": "Instale o Python 3.12: winget install --id Python.Python.3.12 -e   (depois feche e abra o terminal de novo)",
        "Linux": "Instale o Python 3.12 com venv (no Ubuntu: sudo apt install python3.12 python3.12-venv)",
    },
    "node": {
        "Darwin": "Instale o Node.js: brew install node   (ou o instalador LTS de https://nodejs.org)",
        "Windows": "Instale o Node.js: winget install --id OpenJS.NodeJS.LTS -e   (depois feche e abra o terminal de novo)",
        "Linux": "Instale o Node.js 20 ou mais novo (https://nodejs.org ou o gerenciador do sistema)",
    },
}


def ok(rotulo, detalhe=""):
    print(f"  ok     {rotulo}{(': ' + detalhe) if detalhe else ''}")


def falta(rotulo, detalhe):
    print(f"  FALTA  {rotulo}: {detalhe}")


def aviso(rotulo, detalhe):
    print(f"  aviso  {rotulo}: {detalhe}")


def versao_de(py):
    try:
        r = subprocess.run([*py, "-c", "import sys; print('%d.%d' % sys.version_info[:2])"], capture_output=True, text=True, timeout=20)
        return tuple(int(x) for x in r.stdout.strip().split(".")) if r.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired, ValueError):
        return None


def escolher_python():
    """Python para o ambiente: 3.12, 3.11 ou 3.10, nessa ordem. O MediaPipe 0.10.21 só
    existe até o 3.12; sem nenhum desses, pede para instalar o 3.12."""
    candidatos = []
    for v in ("3.12", "3.11", "3.10"):
        if SISTEMA == "Windows" and shutil.which("py"):
            candidatos.append(["py", f"-{v}"])
        exe = shutil.which(f"python{v}")
        if exe:
            candidatos.append([exe])
    for c in candidatos:
        v = versao_de(c)
        if v and (3, 10) <= v <= (3, 12):
            return c, v
    v = sys.version_info[:2]
    if (3, 10) <= v <= (3, 12):
        return [sys.executable], v
    return None


def msg_python():
    v = sys.version_info[:2]
    motivo = "é antigo" if v < (3, 10) else "é novo demais: a leitura do rosto (MediaPipe) ainda não existe para ele"
    return (f"o editor precisa do Python 3.10, 3.11 ou 3.12 e só achei o {v[0]}.{v[1]}, que {motivo}. "
            + INSTRUCOES["python"].get(SISTEMA, ""))


def checar_ffmpeg():
    problemas = []
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        falta("ffmpeg", INSTRUCOES["ffmpeg"].get(SISTEMA, INSTRUCOES["ffmpeg"]["Linux"]))
        return ["ffmpeg"]
    r = subprocess.run(["ffmpeg", "-hide_banner", "-version"], capture_output=True, text=True)
    ok("ffmpeg", (r.stdout.split() + ["?", "?", "?"])[2])
    filtros = filtros_disponiveis()
    essenciais = {"loudnorm": "volume", "afftdn": "limpeza da voz"}
    for f, para in essenciais.items():
        if f not in filtros:
            falta(f"ffmpeg sem '{f}'", f"precisa de uma versão completa do ffmpeg para {para}. {INSTRUCOES['ffmpeg'].get(SISTEMA, '')}")
            problemas.append(f"ffmpeg-{f}")
    completo = INSTRUCOES["ffmpeg"].get(SISTEMA, "Instale a versão completa do ffmpeg.")
    if "subtitles" not in filtros:
        aviso("ffmpeg sem 'subtitles' (libass)", f"o vídeo com animação funciona; só a reserva sem animação (editar.py --legendado) não roda. {completo}")
    codificadores = subprocess.run(["ffmpeg", "-hide_banner", "-encoders"], capture_output=True, text=True).stdout
    if "libvpx-vp9" not in codificadores:
        aviso("ffmpeg sem 'libvpx-vp9'", f"a palavra atrás da pessoa não vai funcionar (o recorte precisa desse codificador). {completo}")
    if not {"zscale", "tonemap"} <= filtros:
        aviso("ffmpeg sem 'zscale'", f"vídeos gravados em HDR (padrão do iPhone) vão sair com a cor lavada; ou desligue o HDR na câmera. {completo}")
    return problemas


def checar_homebrew():
    """No Mac, as instruções de ffmpeg, Python e Node usam o Homebrew. Num Mac novo ele não
    existe (ou foi instalado e ainda não está no PATH): isso vem antes de tudo."""
    if SISTEMA != "Darwin" or shutil.which("brew"):
        return []
    if shutil.which("ffmpeg") and exe("node") and escolher_python():
        return []
    for brew in ("/opt/homebrew/bin/brew", "/usr/local/bin/brew"):
        if Path(brew).exists():
            falta("Homebrew no PATH", f"o Homebrew está instalado, mas o terminal não o encontra. Rode: echo 'eval \"$({brew} shellenv)\"' "
                  ">> ~/.zprofile   e feche e abra o terminal.")
            return ["homebrew"]
    falta("Homebrew", "as instruções abaixo usam o Homebrew, que ainda não está instalado. Instale primeiro, colando no Terminal: "
          "/bin/bash -c \"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\"   "
          "(pede a senha do Mac e instala as ferramentas de linha de comando da Apple). No fim, rode os comandos que ele "
          "mostra em \"Next steps\" e feche e abra o terminal.")
    return ["homebrew"]


def checar_arquitetura():
    """O MediaPipe 0.10.21 (rosto, mãos e recorte) só tem pacote para Mac, e para Windows
    e Linux em processador Intel ou AMD (x86_64)."""
    maquina = platform.machine().lower()
    if SISTEMA != "Darwin" and maquina not in ("x86_64", "amd64"):
        falta("processador", f"{SISTEMA} em {platform.machine()}: a leitura do rosto (MediaPipe 0.10.21) só existe para Mac "
              "e para Windows e Linux em processador Intel ou AMD (x86_64).")
        return ["processador"]
    return []


def exe(nome):
    return shutil.which(nome) or shutil.which(f"{nome}.cmd")


def checar_node():
    node = exe("node")
    if not node or not exe("npm"):
        falta("Node.js", INSTRUCOES["node"].get(SISTEMA, INSTRUCOES["node"]["Linux"]))
        return ["node"]
    v = subprocess.run([node, "--version"], capture_output=True, text=True).stdout.strip()
    try:
        maior = int(v.lstrip("v").split(".")[0])
    except ValueError:
        maior = 0
    if maior < NODE_MIN:
        falta("Node.js", f"{v} é antigo (precisa {NODE_MIN} ou mais novo). " + INSTRUCOES["node"].get(SISTEMA, ""))
        return ["node"]
    ok("Node.js", v)
    return []


def motor_ok():
    m = casa() / "motor"
    return (m / "node_modules" / "remotion").exists() and (m / "package.json").exists()


def boas_praticas():
    return casa() / "remotion-skills" / "skills" / "remotion-best-practices" / "SKILL.md"


def instalar_motor():
    """Motor de animação: copia o projeto Remotion da skill e instala as dependências
    (~300 MB); depois garante o navegador de render do Remotion (~190 MB)."""
    motor = casa() / "motor"
    fonte = PASTA_SKILL / "motor"
    motor.mkdir(parents=True, exist_ok=True)
    mudou = not (motor / "package.json").exists() or (motor / "package.json").read_text() != (fonte / "package.json").read_text()
    for nome in ("package.json", "remotion.config.ts", "tsconfig.json"):
        shutil.copy2(fonte / nome, motor / nome)
    shutil.rmtree(motor / "src", ignore_errors=True)
    shutil.copytree(fonte / "src", motor / "src")
    if mudou or not motor_ok():
        print("Instalando o motor de animação (Remotion, ~300 MB) ...")
        r = subprocess.run([exe("npm"), "install", "--no-audit", "--no-fund", "--no-update-notifier", "--loglevel=error"], cwd=motor)
        if r.returncode != 0:
            sys.exit("A instalação do motor falhou (mensagem acima). Confira a internet e rode de novo.")
    print("Conferindo o navegador de render do Remotion (baixa ~190 MB na primeira vez) ...")
    r = subprocess.run([exe("npx"), "remotion", "browser", "ensure"], cwd=motor)
    if r.returncode != 0:
        sys.exit("Não consegui preparar o navegador de render do Remotion (mensagem acima).")
    if not boas_praticas().exists():
        print("Baixando a skill oficial de boas práticas do Remotion (repositório remotion-dev/skills, versão fixa) ...")
        destino = casa() / "remotion-skills"
        dados = urllib.request.urlopen(SKILLS_REMOTION, timeout=120).read()
        with zipfile.ZipFile(io.BytesIO(dados)) as z:
            raiz = z.namelist()[0].split("/")[0] + "/"
            for nome in z.namelist():
                if nome.endswith("/") or not nome.startswith(raiz):
                    continue
                alvo = destino / nome[len(raiz):]
                alvo.parent.mkdir(parents=True, exist_ok=True)
                alvo.write_bytes(z.read(nome))
    print(AVISO_LICENCA)


def pacotes_ok(py):
    r = subprocess.run([str(py), "-c", "import faster_whisper, PIL, mediapipe; print(faster_whisper.__version__)"], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None


def percepcao_ok(py):
    codigo = f"import sys; sys.path.insert(0, {str(Path(__file__).resolve().parent)!r}); import percepcao; print(percepcao.modelos_ok())"
    r = subprocess.run([str(py), "-B", "-c", codigo], capture_output=True, text=True)
    return r.stdout.strip().endswith("True")


def modelo_ok(py):
    codigo = (
        "import sys\nfrom faster_whisper import download_model\n"
        f"download_model({MODELO!r}, cache_dir={str(casa() / 'modelos')!r}, local_files_only=True)\n"
    )
    r = subprocess.run([str(py), "-B", "-c", codigo], capture_output=True, text=True)
    return r.returncode == 0


def instalar():
    base = casa()
    base.mkdir(parents=True, exist_ok=True)
    py = python_do_ambiente()
    if not py.exists():
        escolha = escolher_python()
        if not escolha:
            sys.exit("Não dá para criar o ambiente: " + msg_python())
        cmd, v = escolha
        print(f"Criando o ambiente com Python {v[0]}.{v[1]} em {base / 'venv'} ...")
        r = subprocess.run([*cmd, "-m", "venv", str(base / "venv")], capture_output=True, text=True)
        if r.returncode != 0:
            print(r.stderr[-800:])
            sys.exit("Não consegui criar o ambiente Python. " + INSTRUCOES["python"].get(SISTEMA, ""))
    if not pacotes_ok(py):
        print("Instalando as bibliotecas de transcrição (~0,9 GB, alguns minutos na primeira vez) ...")
        subprocess.run([str(py), "-m", "pip", "install", "--quiet", "--upgrade", "pip"], check=False)
        r = subprocess.run([str(py), "-m", "pip", "install", "--quiet", *PACOTES])
        if r.returncode != 0:
            sys.exit("A instalação das bibliotecas falhou (mensagem acima). Se o erro citar a versão do Python, instale o Python 3.12, apague a pasta "
                     f"{base / 'venv'} e rode de novo. " + INSTRUCOES["python"].get(SISTEMA, ""))
    if not percepcao_ok(py):
        print("Baixando os modelos de rosto e recorte da pessoa (~0,5 MB) ...")
        codigo = f"import sys; sys.path.insert(0, {str(Path(__file__).resolve().parent)!r}); import percepcao; percepcao.baixar_modelos()"
        if subprocess.run([str(py), "-B", "-c", codigo]).returncode != 0:
            sys.exit("O download dos modelos de rosto falhou. Confira a internet e rode de novo.")
    if not modelo_ok(py):
        print("Baixando o modelo de transcrição (~1,5 GB, só na primeira vez) ...")
        codigo = (
            "from faster_whisper import download_model\n"
            f"p = download_model({MODELO!r}, cache_dir={str(base / 'modelos')!r})\nprint('modelo em', p)\n"
        )
        # Sem o aviso do servidor do Hugging Face sobre token: o download é público e o aviso apenas confunde.
        r = subprocess.run([str(py), "-B", "-c", codigo], env={**os.environ, "HF_HUB_VERBOSITY": "error"})
        if r.returncode != 0:
            sys.exit("O download do modelo falhou. Confira a internet e rode de novo (o download continua de onde parou).")


def main():
    sys.stdout.reconfigure(line_buffering=True)  # mensagens na ordem certa, mesmo com os subprocessos
    ap = argparse.ArgumentParser()
    ap.add_argument("--instalar", action="store_true")
    args = ap.parse_args()

    print(f"Editor de vídeos: verificação ({SISTEMA} {platform.machine()})")
    faltas = checar_homebrew()
    v = sys.version_info
    if v < (3, 9):
        falta("Python", f"{v.major}.{v.minor} é antigo. " + INSTRUCOES["python"].get(SISTEMA, ""))
        faltas.append("python")
    elif not python_do_ambiente().exists() and not escolher_python():
        falta("Python", msg_python())
        faltas.append("python")
    faltas += checar_ffmpeg()
    faltas += checar_node()
    faltas += checar_arquitetura()

    livre = espaco_livre_gb(Path.home())
    if livre < ESPACO_MIN_GB:
        falta("espaço em disco", f"{livre:.1f} GB livres; o editor precisa de pelo menos {ESPACO_MIN_GB:.0f} GB")
        faltas.append("disco")
    else:
        ok("espaço em disco", f"{livre:.0f} GB livres")

    # Sem Node.js, a parte de transcrição e corte instala do mesmo jeito: dá para entregar
    # o vídeo cortado e legendado (editar.py --legendado) enquanto o Node não vem.
    bloqueiam = [f for f in faltas if f not in ("node", "homebrew")]  # o Homebrew só serve para instalar o que falta
    if args.instalar and not bloqueiam:
        instalar()
        if "node" not in faltas:
            instalar_motor()
        else:
            print("Node.js ausente: instalei só a transcrição e o corte. Para as animações, instale o Node.js e rode de novo.")

    rode = "depois de resolver o que falta acima, rode" if bloqueiam else "rode"
    py = python_do_ambiente()
    versao = pacotes_ok(py) if py.exists() else None
    if versao:
        ok("bibliotecas de transcrição", f"faster-whisper {versao}")
        if percepcao_ok(py):
            ok("percepção da pessoa", "rosto e recorte (MediaPipe)")
        else:
            falta("percepção da pessoa", f"{rode}: {comando_verificar()}")
            faltas.append("percepcao")
        if modelo_ok(py):
            ok("modelo de transcrição", MODELO)
        else:
            falta("modelo de transcrição", f"{rode}: {comando_verificar()}")
            faltas.append("modelo")
    else:
        falta("ambiente da skill", f"{rode}: {comando_verificar()}")
        faltas.append("ambiente")

    parte_python = bool(versao) and not {"percepcao", "modelo"} & set(faltas)
    dica = rode if bloqueiam else ("instale o Node.js e rode" if "node" in faltas else "rode")
    if motor_ok():
        ok("motor de animação", "Remotion")
    else:
        falta("motor de animação", f"{dica}: {comando_verificar()}")
        faltas.append("motor")
    if boas_praticas().exists():
        ok("boas práticas do Remotion", str(boas_praticas()))
    else:
        falta("boas práticas do Remotion", f"{dica}: {comando_verificar()}")
        faltas.append("boas-praticas")

    if faltas:
        if parte_python and set(faltas) <= {"homebrew", "node", "motor", "boas-praticas"}:
            print(f"SÓ CORTE E LEGENDA (sem animação, editar.py --legendado). Python do ambiente: {py}")
        print(f"FALTA: {', '.join(faltas)}")
        sys.exit(1)
    print(f"Boas práticas do Remotion: {boas_praticas()}")
    print(f"PRONTO. Python do ambiente: {py}")


if __name__ == "__main__":
    main()
