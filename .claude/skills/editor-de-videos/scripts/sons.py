"""Efeitos sonoros do motion, sintetizados no próprio computador (sem arquivo de
terceiros, sem licença). Determinístico: ruído com semente fixa.

WAV 48 kHz mono 16 bits, pico em -6 dBFS; o volume final de cada uso vem da timeline.
"""
import math
import wave
from pathlib import Path

TAXA = 48000


def _ruido():
    semente = 42
    while True:
        semente = (semente * 1664525 + 1013904223) % 4294967296
        yield semente / 2147483648 - 1


def _filtrar(amostras, f_alta, f_baixa):
    """Passa-banda simples (um polo passa-altas + um polo passa-baixas)."""
    a_hp = math.exp(-2 * math.pi * f_alta / TAXA)
    a_lp = 1 - math.exp(-2 * math.pi * f_baixa / TAXA)
    saida, hp_ant, x_ant, lp = [], 0.0, 0.0, 0.0
    for x in amostras:
        hp = a_hp * (hp_ant + x - x_ant)
        hp_ant, x_ant = hp, x
        lp += a_lp * (hp - lp)
        saida.append(lp)
    return saida


def _seno(f, t):
    return math.sin(2 * math.pi * f * t)


def _vozes():
    r = _ruido()
    return {
        # sopro para a entrada de painel ou tela cheia
        "whoosh": (0.5, lambda t, d: next(r) * math.sin(math.pi * min(1, t / d)) ** 1.6, (400, 4200)),
        # sopro curto para acento sobre a pessoa
        "whoosh-curto": (0.3, lambda t, d: next(r) * math.sin(math.pi * min(1, t / d)) ** 1.5, (700, 5500)),
        # estalo arredondado: palavra, ícone ou número que salta
        "pop": (0.16, lambda t, d: _seno(520 + 700 * math.exp(-t * 25), t) * math.exp(-t * 32), None),
        # tique seco: item de lista, passo, barra
        "tique": (0.05, lambda t, d: _seno(2200, t) * math.exp(-t * 110) + 0.3 * next(r) * math.exp(-t * 300), None),
        # clique de botão
        "clique": (0.04, lambda t, d: 0.7 * next(r) * math.exp(-t * 400) + _seno(1600, t) * math.exp(-t * 180), None),
        # batida grave e macia: ênfase, palavra atrás da pessoa
        "batida": (0.45, lambda t, d: _seno(95 - 50 * t, t) * math.exp(-t * 9), None),
        # plim de dois tons: resultado, oferta, check final
        "plim": (0.6, lambda t, d: (_seno(1318.5, t) + 0.6 * _seno(1975.5, t) * (t > 0.07)) * math.exp(-t * 7), None),
    }


def gerar(pasta: Path):
    """Grava os efeitos que faltam em `pasta` e devolve os nomes disponíveis."""
    pasta.mkdir(parents=True, exist_ok=True)
    vozes = _vozes()
    for nome, (dur, funcao, filtro) in vozes.items():
        arq = pasta / f"{nome}.wav"
        if arq.exists():
            continue
        n = int(dur * TAXA)
        buf = [funcao(i / TAXA, dur) for i in range(n)]
        if filtro:
            buf = _filtrar(buf, *filtro)
        pico = max(abs(x) for x in buf) or 1.0
        fade = int(TAXA * 0.002)
        dados = bytearray()
        for i, x in enumerate(buf):
            env = min(1.0, i / fade, (n - 1 - i) / fade)
            v = max(-1.0, min(1.0, x * 0.5 / pico * env))
            dados += int(round(v * 32767)).to_bytes(2, "little", signed=True)
        with wave.open(str(arq), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(TAXA)
            w.writeframes(bytes(dados))
    return sorted(vozes)
