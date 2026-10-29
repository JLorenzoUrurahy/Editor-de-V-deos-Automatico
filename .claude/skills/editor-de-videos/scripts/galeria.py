#!/usr/bin/env python3
"""Galeria do catálogo: renderiza cada cena sozinha, a partir do exemplo em
motor/exemplos/<tipo>.json, e monta uma folha de quadros para conferir o desenho.
Serve para quem mantém o catálogo (e como teste de fumaça: toda cena renderiza?).

uso: <python do ambiente> scripts/galeria.py [TIPO ...] [--motor DIR] [--saida DIR] [--passo 0.4] [--sem-guias]
  sem TIPO: todos os exemplos.
  --motor: cópia do motor para trabalhar sem mexer na instalada (é criada se não
           existir, com node_modules apontando para a instalação principal).
  --sem-guias: sem os contornos tracejados da área da cena e do rosto (imagens limpas).
Saída: <saida>/<tipo>.mp4 (meia resolução) e <saida>/<tipo>.jpg (folha com o tempo de cada quadro).
"""
import argparse
import json
import math
import os
import shutil
import subprocess
import sys
from pathlib import Path

sys.dont_write_bytecode = True
os.environ.setdefault("npm_config_update_notifier", "false")  # sem o aviso de versão nova do npm no meio da saída
sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import FONTE, PASTA_FONTES, PASTA_SKILL, casa, ffmpeg, rotular_folha  # noqa: E402

ESTILO = {
    "fonte": "Plus Jakarta Sans", "arquivo_fonte": f"fontes/{FONTE}", "cor_destaque": "#FFD60A", "cor_texto": "#FFFFFF",
    "cor_fundo": "#0B0C10", "cor_fundo2": "#1A1C24", "cor_contorno": "#111111", "caixa_alta": True,
}


def npx():
    return shutil.which("npx") or shutil.which("npx.cmd") or sys.exit("npx não encontrado (instale o Node.js)")


def preparar(motor: Path):
    principal = casa() / "motor"
    if not (principal / "node_modules").exists():
        sys.exit("Motor principal não instalado: rode verificar.py --instalar")
    motor.mkdir(parents=True, exist_ok=True)
    fonte = PASTA_SKILL / "motor"
    for nome in ("package.json", "remotion.config.ts", "tsconfig.json"):
        shutil.copy2(fonte / nome, motor / nome)
    if motor != principal and not (motor / "node_modules").exists():
        os.symlink(principal / "node_modules", motor / "node_modules")
    destino = motor / "src"
    # As cenas livres geradas para um vídeo não entram na galeria.
    shutil.rmtree(destino, ignore_errors=True)
    shutil.copytree(fonte / "src", destino)
    publico = motor / "publico-galeria"
    (publico / "fontes").mkdir(parents=True, exist_ok=True)
    shutil.copy2(PASTA_FONTES / FONTE, publico / "fontes" / FONTE)
    exemplos_midia = fonte / "exemplos" / "midia"
    if exemplos_midia.exists():
        shutil.copytree(exemplos_midia, publico / "midia", dirs_exist_ok=True)
    # Foto de pessoa para conferir cenas sobre/atras/foco (apenas na máquina de quem mantém a skill).
    for nome in ("fundo-galeria.jpg", "frente-galeria.png", "fundo-galeria-mao.jpg", "frente-galeria-mao.png"):
        origem = casa() / "galeria-fundo" / nome
        if origem.exists():
            shutil.copy2(origem, publico / nome)
    return publico


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("tipos", nargs="*")
    ap.add_argument("--motor", help="pasta do motor (padrão: a instalada)")
    ap.add_argument("--saida", default=str(casa() / "galeria"))
    ap.add_argument("--passo", type=float, default=0.4, help="segundos entre quadros na folha")
    ap.add_argument("--sem-guias", action="store_true", help="sem os contornos tracejados de conferência")
    args = ap.parse_args()
    motor = Path(args.motor).expanduser().resolve() if args.motor else casa() / "motor"
    saida = Path(args.saida).expanduser().resolve()
    saida.mkdir(parents=True, exist_ok=True)
    publico = preparar(motor)
    exemplos = PASTA_SKILL / "motor" / "exemplos"
    tipos = args.tipos or sorted(p.stem for p in exemplos.glob("*.json"))
    falhas = []
    for tipo in tipos:
        ex = json.loads((exemplos / f"{tipo}.json").read_text(encoding="utf-8"))
        props = {"tipo": ex.get("tipo", tipo), "layout": ex.get("layout", "metade"), "dur_s": ex.get("dur_s", 4.0),
                 "props": ex["props"], "textos": ex.get("textos", []), "estilo": {**ESTILO, **ex.get("estilo", {})},
                 "fundo": (publico / "fundo-galeria.jpg").exists(), "guias": not args.sem_guias,
                 **{k: ex[k] for k in ("caixa", "rosto", "vidro", "n", "foto", "trilha") if k in ex}}
        arq = saida / f"{tipo}.props.json"
        arq.write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")
        video = saida / f"{tipo}.mp4"
        r = subprocess.run([npx(), "remotion", "render", "src/index.ts", "Galeria", str(video), f"--props={arq}",
                            f"--public-dir={publico}", "--scale=0.5", "--log=error"], cwd=motor, capture_output=True, text=True)
        if r.returncode != 0:
            falhas.append(tipo)
            print(f"FALHOU {tipo}:\n" + "\n".join((r.stderr or r.stdout).strip().splitlines()[-12:]))
            continue
        n = max(1, math.ceil(props["dur_s"] / args.passo - 1e-6))  # quadros que o fps=1/passo tira
        colunas = min(6, n)
        ffmpeg(["-i", str(video), "-vf",
                f"fps=1/{args.passo},scale=270:480,tile={colunas}x{(n + colunas - 1) // colunas}:padding=4:color=white",
                "-frames:v", "1", "-q:v", "3", str(saida / f"{tipo}.jpg")])
        rotular_folha(saida / f"{tipo}.jpg", colunas, n, 270, 480, args.passo, tamanho=18)
        print(f"ok {tipo} → {saida / f'{tipo}.jpg'}")
    if falhas:
        sys.exit(f"{len(falhas)} cena(s) falharam: {', '.join(falhas)}")


if __name__ == "__main__":
    main()
