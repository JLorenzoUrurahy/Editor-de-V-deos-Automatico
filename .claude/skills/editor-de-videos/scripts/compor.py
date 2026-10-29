#!/usr/bin/env python3
"""Etapa 7 do editor (SKILL.md): desenha legenda, título e cenas de motion sobre a pessoa
cortada, com o Remotion, e entrega o vídeo final.

uso: <python do ambiente> scripts/compor.py PASTA_DO_PROJETO [--amostra DE ATE] [--escala 0.5]

Lê .trabalho/plano.json (do editar.py), .trabalho/cortes.json (campo "cenas") e
as cenas livres em .trabalho/cenas/<id>.tsx. Grava:
  video-final.mp4 e capa.jpg              (vídeo inteiro)
  amostra.mp4                             (com --amostra wNN wMM: só esse trecho)
  .trabalho/timeline.json                 o que o motor tocou

Antes de renderizar, confere:
- toda âncora (de, ate, em) é uma palavra que ficou no vídeo;
- todo texto de cena foi dito no vídeo (ou está em "textos_extra" do cortes.json,
  vindo do briefing): nada inventado;
- cenas não se sobrepõem.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

sys.dont_write_bytecode = True  # não deixa __pycache__ dentro da pasta da skill
os.environ.setdefault("npm_config_update_notifier", "false")  # sem o aviso de versão nova do npm no meio da saída
sys.path.insert(0, str(Path(__file__).resolve().parent))
from comum import FONTE, FONTE_NOME, FPS, PASTA_SKILL, casa, comando_verificar, exigir_ambiente, ffmpeg, gravar_json, ler_json, tempo  # noqa: E402

TRANSICAO_F = 14          # 0,45 s de troca de layout
ANTECIPA_S = 0.45         # o painel chega junto com a primeira palavra da cena
DEPOIS_S = 0.6            # e fica um pouco depois da última
JUNTA_S = 3.0             # cenas do mesmo layout com intervalo menor que isso dividem o painel (sem sobe e desce)
NAO_TEXTO = {"tipo", "icone", "icones", "imagem", "video", "midia", "print", "tela", "cor", "layout", "id", "valor", "total", "lado",
             "formato", "lado_texto", "dispositivo", "estilo", "regiao", "pais", "estado", "foco", "variante", "vencedor",
             "seguir", "mao"}
# Valores de opção que dividem a chave com texto de verdade ("de" é quem fala no chat,
# porém é o preço riscado na oferta).
OPCOES = {("de", "pessoa"), ("de", "ia")}
# Conectivos podem aparecer em rótulo sem terem sido ditos ("PREÇO DE LANÇAMENTO").
CONECTIVOS = {"de", "do", "da", "dos", "das", "no", "na", "nos", "nas", "em", "e", "o", "a", "os", "as", "um", "uma",
              "com", "para", "pra", "por", "ao", "r", "rs", "us", "x", "vs"}
ESTILO_PADRAO = {"cor_texto": "#FFFFFF", "cor_fundo": "#0B0C10", "cor_fundo2": "#1A1C24", "cor_contorno": "#111111"}


def sem_acento(t):
    return "".join(c for c in unicodedata.normalize("NFD", t.lower()) if unicodedata.category(c) != "Mn")


def fichas(t):
    return re.findall(r"\w+", sem_acento(t))


def eh_ancora(chave):
    return chave == "em" or chave.startswith("em_")


MIDIA = {"imagem", "video", "midia", "print", "tela"}


def copiar_midia(valor, projeto, publico, erros, cena_id):
    """Imagem ou vídeo da pessoa: copia para publico/midia/ e devolve o caminho público."""
    origem = Path(valor).expanduser()
    if not origem.is_absolute():
        origem = (projeto / origem) if (projeto / origem).exists() else (projeto.parent / origem)
    if not origem.exists():
        erros.append(f"cena {cena_id}: arquivo de mídia não encontrado: {valor}")
        return valor
    destino = publico / "midia" / origem.name
    destino.parent.mkdir(parents=True, exist_ok=True)
    if not destino.exists() or destino.stat().st_size != origem.stat().st_size:
        shutil.copy2(origem, destino)
    return f"midia/{origem.name}"


def resolver_props(valor, chave, ini_s, tempos, erros, textos, cena_id, projeto=None, publico=None):
    """Troca âncoras de palavra por segundos locais, copia a mídia da pessoa e junta os textos exibidos."""
    if isinstance(valor, str) and chave in MIDIA and projeto is not None:
        return copiar_midia(valor, projeto, publico, erros, cena_id)
    if isinstance(valor, dict):
        return {k: resolver_props(v, k, ini_s, tempos, erros, textos, cena_id, projeto, publico) for k, v in valor.items()}
    if isinstance(valor, list):
        return [resolver_props(v, chave, ini_s, tempos, erros, textos, cena_id, projeto, publico) for v in valor]
    if isinstance(valor, str) and eh_ancora(chave):
        if valor not in tempos:
            erros.append(f"cena {cena_id}: âncora {chave}={valor} não é uma palavra que ficou no vídeo")
            return 0.0
        return round(tempos[valor][0] - ini_s, 3)
    if isinstance(valor, str) and chave not in NAO_TEXTO and (chave, valor) not in OPCOES:
        textos.append(valor)
    return valor


PAINEL = {"metade", "tela"}
SOBREPOE_MAX_S = 0.6       # sobreposição pequena entre cenas vizinhas: a anterior encolhe
ZONA_SEGURA = {"x0": 108, "x1": 918, "y0": 300, "y1": 1320}   # y1: acima da legenda baixa
Y_LEGENDA_NORMAL = 1300

# Som de cada tipo de cena: (na entrada, nos momentos `em`). Volume baixo, sob a voz.
SONS_ENTRADA = {"metade": ("whoosh", 0.32), "tela": ("whoosh", 0.32), "foco": ("whoosh", 0.28),
                "sobre": ("whoosh-curto", 0.2), "atras": ("batida", 0.42), "interage": ("pop", 0.24),
                "profundidade": ("whoosh", 0.3)}
# Cenas que seguem a mão (as outras de interação seguem o rosto).
SEGUEM_MAO = {"na_mao", "contagem"}
SOM_EM = {
    "oferta": "plim", "numero": "plim", "percentual": "plim", "numero_pop": "pop", "de_para": "plim",
    "destaque": "pop", "icone_pop": "pop", "icone_conceito": "pop", "chips": "tique", "tarja": None,
    "seguir_salvar": "clique", "comentario": "clique", "prompt": "clique", "palavra_atras": None,
    "titulo_cinetico": None, "citacao": None,
    "na_mao": "pop", "contagem": "tique", "selo_rosto": "pop", "orbita": None, "sai_de_tras": None, "atravessa": None,
}


def tipos_da_familia(familia):
    indice = PASTA_SKILL / "motor" / "src" / "catalogo" / familia / "index.ts"
    return set(re.findall(r"^\s+(\w+):\s*\w+,", indice.read_text(encoding="utf-8"), flags=re.M)) if indice.exists() else set()


def rosto_no_trecho(rostos, ini_f, fim_f, rosto_y):
    """União das caixas do rosto entre dois quadros (x0, y0, x1, y1). Sem rastro do
    rosto, uma caixa típica de selfie na altura `rosto_y`."""
    caixas = rostos.get("caixas") or []
    passo = rostos.get("passo_f", 3)
    trecho = caixas[ini_f // passo: fim_f // passo + 1] if caixas else []
    if not trecho:
        cy = rosto_y * 1920
        return (300, cy - 230, 780, cy + 230)
    return (min(c[0] for c in trecho), min(c[1] for c in trecho), max(c[0] + c[2] for c in trecho), max(c[1] + c[3] for c in trecho))


def zonas_livres(rosto):
    """Áreas livres ao redor do rosto, dentro da zona segura."""
    x0, y0, x1, y1 = rosto
    h = y1 - y0
    cabeca = y0 - 0.45 * h            # topo da cabeça (cabelo)
    queixo = y1 + 0.08 * h
    z = {}
    alto = cabeca - 24 - ZONA_SEGURA["y0"]
    if alto >= 140:
        z["acima"] = {"x": 108, "y": ZONA_SEGURA["y0"], "w": 810, "h": round(min(alto, 520))}
    peito_y = queixo + 24
    if ZONA_SEGURA["y1"] - peito_y >= 140:
        z["peito"] = {"x": 108, "y": round(peito_y), "w": 810, "h": round(min(ZONA_SEGURA["y1"] - peito_y, 420))}
    topo_lado = max(ZONA_SEGURA["y0"], cabeca)
    base_lado = min(queixo + 0.3 * h, ZONA_SEGURA["y1"])
    if x0 - 24 - 108 >= 160:
        z["esquerda"] = {"x": 108, "y": round(topo_lado), "w": round(x0 - 24 - 108), "h": round(base_lado - topo_lado)}
    if 918 - (x1 + 24) >= 160:
        z["direita"] = {"x": round(x1 + 24), "y": round(topo_lado), "w": round(918 - x1 - 24), "h": round(base_lado - topo_lado)}
    return z, cabeca


def _suavizar(pontos):
    """Preenche buracos de até 2 amostras e tira o tremor com média móvel centrada de 5
    amostras (sem atraso). Pontos são [x, y, tamanho] ou None."""
    pts = [list(p) if p else None for p in pontos]
    for i, p in enumerate(pts):
        if p is None:
            a = next((j for j in range(i - 1, max(-1, i - 3), -1) if pts[j]), None)
            b = next((j for j in range(i + 1, min(len(pts), i + 3)) if pontos[j]), None)
            if a is not None and b is not None and b - a <= 3:
                f = (i - a) / (b - a)
                pts[i] = [pts[a][k] + (pontos[b][k] - pts[a][k]) * f for k in range(3)]
    saida = []
    for i, p in enumerate(pts):
        if p is None:
            saida.append(None)
            continue
        viz = [q for q in pts[max(0, i - 2): i + 3] if q]
        saida.append([round(sum(q[k] for q in viz) / len(viz)) for k in range(3)])
    return saida


def montar_trilha(de, ini_f, fim_f, rostos, maos, lado=None):
    """Caminho do rosto ou da mão na cena: um ponto a cada 3 quadros a partir de ini_f."""
    passo = 3
    idx = [round((f) / passo) for f in range(ini_f, fim_f, passo)]
    if de == "rosto":
        caixas = rostos.get("caixas") or []
        pts = [[c[0] + c[2] / 2, c[1] + c[3] / 2, c[2]] if (c := (caixas[k] if k < len(caixas) else None)) else None for k in idx]
    else:
        amostras = maos.get("amostras") or []
        pts, anterior = [], None
        for k in idx:
            aqui = amostras[k] if k < len(amostras) else []
            if lado:
                aqui = [m for m in aqui if (m["x"] < 540) == (lado == "esquerda")]
            if not aqui:
                pts.append(None)
                continue
            if anterior:
                m = min(aqui, key=lambda m: (m["x"] - anterior[0]) ** 2 + (m["y"] - anterior[1]) ** 2)
            else:
                m = max(aqui, key=lambda m: m["h"])
            anterior = [m["x"], m["y"], m["h"]]
            pts.append(anterior)
    return {"de": de, "passo_f": passo, "pontos": _suavizar(pts)}


def escolher_zona(pedida, zonas):
    if pedida in zonas:
        return pedida
    for nome in ("acima", "peito"):
        if nome in zonas:
            return nome
    laterais = [n for n in ("esquerda", "direita") if n in zonas]
    return max(laterais, key=lambda n: zonas[n]["w"] * zonas[n]["h"]) if laterais else None


def tempos_em(props, chave=""):
    """Todos os tempos `em`/`em_*` (já em segundos locais) de uma cena."""
    if isinstance(props, dict):
        return [t for k, v in props.items() for t in tempos_em(v, k)]
    if isinstance(props, list):
        return [t for v in props for t in tempos_em(v, chave)]
    return [props] if eh_ancora(chave) and isinstance(props, (int, float)) else []


def tipos_do_catalogo():
    tipos = set()
    for indice in (PASTA_SKILL / "motor" / "src" / "catalogo").glob("*/index.ts"):
        tipos |= set(re.findall(r"^\s+(\w+):\s*\w+,", indice.read_text(encoding="utf-8"), flags=re.M))
    return tipos


def montar_timeline(projeto, args):
    trabalho = projeto / ".trabalho"
    plano = ler_json(trabalho / "plano.json")
    cortes = ler_json(trabalho / "cortes.json")
    tempos = {w["id"]: (w["ini"], w["fim"]) for w in plano["palavras"]}
    ditas = {f for w in plano["palavras"] for f in fichas(w["texto"])}
    extras = {f for t in cortes.get("textos_extra", []) + plano.get("termos", []) for f in fichas(t)}
    erros = []

    cenas = []
    for c in cortes.get("cenas", []):
        cid = c.get("id") or f"c{len(cenas) + 1}"
        for k in ("de", "ate"):
            if c.get(k) not in tempos:
                erros.append(f"cena {cid}: {k}={c.get(k)} não é uma palavra que ficou no vídeo")
        if erros:
            continue
        ini_s = max(0.0, tempos[c["de"]][0] - ANTECIPA_S)
        fim_s = min(plano["duracao_q"] / FPS, tempos[c["ate"]][1] + DEPOIS_S)
        textos = []
        props = resolver_props(c.get("props", {}), "", ini_s, tempos, erros, textos, cid, projeto, trabalho / "publico")
        for t in textos:
            faltam = [f for f in fichas(t) if f not in ditas and f not in extras and f not in CONECTIVOS]
            if faltam:
                erros.append(f"cena {cid}: o texto \"{t}\" tem palavra que não foi dita ({', '.join(faltam)}). "
                             "Use só o que está na fala, ou declare em textos_extra o que veio do briefing.")
        tipo = c["tipo"]
        if tipo == "livre" or tipo.startswith("livre/"):
            tipo = f"livre/{c.get('arquivo', cid)}"
            if not (trabalho / "cenas" / f"{tipo[6:]}.tsx").exists():
                erros.append(f"cena {cid}: cena livre sem arquivo .trabalho/cenas/{tipo[6:]}.tsx")
        elif tipo not in tipos_do_catalogo():
            erros.append(f"cena {cid}: tipo \"{tipo}\" não existe no catálogo (veja catalogo.md) nem é livre")
        layout = c.get("layout", "metade")
        if layout not in PAINEL | {"foco", "sobre", "atras", "interage", "profundidade"}:
            erros.append(f"cena {cid}: layout \"{layout}\" não existe (metade, tela, foco, sobre, atras, interage ou profundidade)")
        cenas.append({"id": cid, "tipo": tipo, "ini_f": round(ini_s * FPS), "fim_f": round(fim_s * FPS),
                      "layout": layout, "props": props, "textos": textos, "_zona": c.get("zona", "auto"),
                      "_sons": c.get("sons", True), "_seguir": c.get("props", {}).get("seguir"), "_mao": c.get("props", {}).get("mao")})
    cenas.sort(key=lambda c: c["ini_f"])
    for a, b in zip(cenas, cenas[1:]):
        if b["ini_f"] < a["fim_f"] - 1:
            if b["layout"] == a["layout"] or (a["fim_f"] - b["ini_f"]) <= SOBREPOE_MAX_S * FPS:
                a["fim_f"] = b["ini_f"]  # a seguinte assume (um elemento forte por vez)
            else:
                erros.append(f"cenas {a['id']} e {b['id']} se sobrepõem: uma cena por vez")
    if erros:
        sys.exit("Problemas nas cenas (nada foi renderizado):\n  " + "\n  ".join(erros))

    # Trechos de painel: cenas de painel vizinhas dividem o painel, se não houver
    # outra cena (sobre, atras, foco) entre elas.
    layouts = []
    for k, c in enumerate(cenas):
        if c["layout"] not in PAINEL:
            continue
        u = layouts[-1] if layouts else None
        anterior = cenas[k - 1] if k else None
        if u and anterior and anterior["layout"] == c["layout"] and u["tipo"] == c["layout"] and c["ini_f"] - u["fim_f"] <= JUNTA_S * FPS:
            u["fim_f"] = max(u["fim_f"], c["fim_f"])
            anterior["fim_f"] = c["ini_f"]  # sem painel vazio entre as duas
        else:
            layouts.append({"tipo": c["layout"], "ini_f": c["ini_f"], "fim_f": c["fim_f"]})

    # Pessoa: área livre de cada destaque, faixa da palavra atrás, legenda baixa, ênfases.
    rostos = ler_json(trabalho / "rostos.json") if (trabalho / "rostos.json").exists() else {}
    maos = ler_json(trabalho / "maos.json") if (trabalho / "maos.json").exists() else {}
    rosto_y = float(cortes.get("rosto_y", 0.45))
    nativas = tipos_da_familia("sobre")
    legenda_baixa = []
    for n, c in enumerate(cenas):
        c["n"] = n
        if c["layout"] in ("interage", "profundidade"):
            r = rosto_no_trecho(rostos, c["ini_f"], c["fim_f"], rosto_y)
            c["rosto"] = {"x": round(r[0]), "y": round(r[1]), "w": round(r[2] - r[0]), "h": round(r[3] - r[1])}
            de = c["_seguir"] or ("mao" if c["tipo"] in SEGUEM_MAO else "rosto")
            c["trilha"] = montar_trilha("mao" if de in ("mao", "ponta") else "rosto", c["ini_f"], c["fim_f"], rostos, maos, c["_mao"])
            if de == "mao" and not any(c["trilha"]["pontos"]):
                print(f"aviso: cena {c['id']}: nenhuma mão no trecho; a cena usa o rosto")
                c["trilha"] = montar_trilha("rosto", c["ini_f"], c["fim_f"], rostos, maos)
            continue
        if c["layout"] not in ("sobre", "atras"):
            continue
        r = rosto_no_trecho(rostos, c["ini_f"], c["fim_f"], rosto_y)
        zonas, cabeca = zonas_livres(r)
        if c["layout"] == "sobre":
            nome = escolher_zona(c["_zona"], zonas)
            if not nome:
                sys.exit(f"cena {c['id']}: não há espaço livre ao redor do rosto para um destaque; use layout foco ou metade")
            if c["_zona"] not in ("auto", nome):
                print(f"aviso: cena {c['id']}: zona {c['_zona']} sem espaço; usei {nome}")
            cx = zonas[nome]
            c["vidro"] = c["tipo"] not in nativas
            if nome == "peito":
                legenda_baixa.append({"ini_f": c["ini_f"], "fim_f": c["fim_f"]})
        else:
            meio = max(ZONA_SEGURA["y0"] + 180, cabeca + 40)
            cx = {"x": 0, "y": round(meio - 180), "w": 1080, "h": 360}
        c["caixa"] = cx
        c["rosto"] = {"x": round(r[0] - cx["x"]), "y": round(r[1] - cx["y"]), "w": round(r[2] - r[0]), "h": round(r[3] - r[1])}

    enfases = []
    ocupado = [(c["ini_f"], c["fim_f"]) for c in cenas if c["layout"] != "sobre"]
    for e in cortes.get("enfases", []):
        if e.get("em") not in tempos:
            sys.exit(f"ênfase: em={e.get('em')} não é uma palavra que ficou no vídeo")
        a = max(0, round((tempos[e["em"]][0] - 0.08) * FPS))
        b = min(plano["duracao_q"], a + round(float(e.get("dur_s", 1.2)) * FPS))
        if any(a < y and b > x for x, y in ocupado):
            print(f"aviso: ênfase em {e['em']} cai sobre uma cena de painel, foco, atrás ou interação; ignorada")
            continue
        r = rosto_no_trecho(rostos, a, b, rosto_y)
        enfases.append({"ini_f": a, "fim_f": b, "escala": min(1.25, max(1.04, float(e.get("escala", 1.12)))),
                        "cx": round((r[0] + r[2]) / 2), "cy": round((r[1] + r[3]) / 2)})

    # Sons: entrada de cada cena e os momentos fortes, sem amontoar (mínimo de 0,12 s entre dois).
    sons = []
    if cortes.get("sons", True):
        for c in cenas:
            if not c["_sons"]:
                continue
            nome, vol = SONS_ENTRADA[c["layout"]]
            sons.append({"f": c["ini_f"], "nome": nome, "volume": vol})
            som_em = SOM_EM.get(c["tipo"], "tique")
            if som_em:
                for t in sorted(set(tempos_em(c["props"]))):
                    sons.append({"f": c["ini_f"] + round(t * FPS), "nome": som_em, "volume": 0.3 if som_em == "plim" else 0.22})
        for e in enfases:
            sons.append({"f": e["ini_f"], "nome": "whoosh-curto", "volume": 0.14})
        sons.sort(key=lambda x: x["f"])
        filtrados = []
        for x in sons:
            if filtrados and x["f"] - filtrados[-1]["f"] < 0.12 * FPS:
                continue
            filtrados.append(x)
        sons = filtrados
    for c in cenas:
        for k in ("_zona", "_sons", "_seguir", "_mao"):
            c.pop(k, None)

    titulo = plano.get("titulo")
    estilo = {**ESTILO_PADRAO, "fonte": FONTE_NOME, "arquivo_fonte": f"fontes/{FONTE}",
              "cor_destaque": plano.get("cor_destaque", "#FFD60A"), "caixa_alta": plano.get("caixa_alta", True),
              **{k: v for k, v in cortes.get("estilo", {}).items() if k in ESTILO_PADRAO}}
    return {
        "fps": FPS,
        "duracao_f": plano["duracao_q"],
        "aroll": "aroll.mp4",
        "rosto_y": float(cortes.get("rosto_y", 0.45)),
        "transicao_f": TRANSICAO_F,
        "estilo": estilo,
        "titulo": {"linhas": titulo["linhas"], "tamanho": titulo["tamanho"], "fim_f": round(titulo["fim"] * FPS)} if titulo else None,
        "paginas": [{"ini_f": round(p["ini"] * FPS), "fim_f": round(p["fim"] * FPS),
                     "palavras": [{"texto": w["texto"], "ini_f": round(w["ini"] * FPS), "fim_f": round(w["fim"] * FPS)} for w in p["palavras"]]}
                    for p in plano["paginas"]],
        "cenas": cenas,
        "layouts": layouts,
        "sons": sons,
        "enfases": enfases,
        "legenda_baixa": legenda_baixa,
    }, tempos


def preparar_motor(trabalho):
    """Copia o motor da skill para ~/.editor-de-videos/motor (dependências ficam lá)
    e registra as cenas livres deste vídeo."""
    motor = casa() / "motor"
    fonte = PASTA_SKILL / "motor"
    if not (motor / "node_modules").exists():
        sys.exit(f"O motor de animação não está instalado. Rode: {comando_verificar()}")
    pacote_mudou = (fonte / "package.json").read_text() != (motor / "package.json").read_text()
    for nome in ("package.json", "remotion.config.ts", "tsconfig.json"):
        shutil.copy2(fonte / nome, motor / nome)
    shutil.rmtree(motor / "src", ignore_errors=True)
    shutil.copytree(fonte / "src", motor / "src")
    if pacote_mudou:
        subprocess.run([npx("npm"), "install", "--no-audit", "--no-fund", "--no-update-notifier", "--loglevel=error"], cwd=motor, check=True)

    livres = sorted((trabalho / "cenas").glob("*.tsx")) if (trabalho / "cenas").exists() else []
    destino = motor / "src" / "cenas" / "video"
    destino.mkdir(parents=True, exist_ok=True)
    linhas = ["// Gerado pelo compor.py. Não editar à mão.", 'import type React from "react";', 'import type { PropsCena } from "../tipos";']
    registro = []
    for k, arq in enumerate(livres):
        shutil.copy2(arq, destino / arq.name)
        linhas.append(f'import {{ Cena as C{k} }} from "./video/{arq.stem}";')
        registro.append(f'  "{arq.stem}": C{k},')
    linhas += ["", "export const LIVRES: Record<string, React.FC<PropsCena>> = {", *registro, "};", ""]
    (motor / "src" / "cenas" / "livres.ts").write_text("\n".join(linhas), encoding="utf-8")
    return motor


def npx(nome="npx"):
    exe = shutil.which(nome) or shutil.which(f"{nome}.cmd")
    if not exe:
        sys.exit(f"{nome} não encontrado: instale o Node.js ({comando_verificar(False)} mostra como).")
    return exe


def garantir_rostos(trabalho, duracao_q):
    """Rastro do rosto (o editar.py já grava; aqui só se faltar)."""
    arq = trabalho / "rostos.json"
    if arq.exists():
        return
    try:
        import percepcao
        print("Lendo a posição do rosto ...", flush=True)
        gravar_json(arq, percepcao.rostos(trabalho / "publico" / "aroll.mp4", duracao_q))
    except ImportError:
        print("aviso: sem a biblioteca de percepção (verificar.py --instalar); destaques usam a posição típica do rosto")
    except RuntimeError:
        print("aviso: a leitura do rosto não abre neste ambiente (sem acesso à GPU); destaques usam a posição típica do rosto. "
              "Se o render falhar em seguida, rode fora da proteção do terminal (no Codex, acesso total) ou entregue a reserva")


def preparar_frentes(timeline, publico):
    """Recorte da pessoa para cada cena atrás, só no trecho dela (com cache pelo trecho)."""
    import percepcao
    for c in timeline["cenas"]:
        if c["layout"] not in ("atras", "profundidade"):
            continue
        nome = f"frente_{c['id']}_{c['ini_f']}_{c['fim_f']}.webm"
        if not (publico / nome).exists():
            print(f"Recortando a pessoa para a cena {c['id']} ...", flush=True)
            for velho in publico.glob(f"frente_{c['id']}_*.webm"):
                velho.unlink()
            percepcao.frente(publico / "aroll.mp4", c["ini_f"], c["fim_f"], publico / nome)
        c["frente"] = nome


def acertar_volume(video):
    """Os sons somam um pouco de energia: se o volume saiu do alvo (-14 LUFS, pico até
    -1 dBTP), normaliza de novo só o áudio, sem tocar no vídeo."""
    err = ffmpeg(["-nostats", "-i", str(video), "-af", "ebur128=peak=true", "-f", "null", "-"])
    resumo = err[err.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+) LUFS", resumo)
    pico = re.search(r"True peak:\s+Peak:\s+(-?[\d.]+)", resumo)
    if i and abs(float(i.group(1)) + 14) <= 0.5 and (not pico or float(pico.group(1)) <= -1.0):
        return
    err = ffmpeg(["-i", str(video), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    m = json.loads(err[err.rindex("{"): err.rindex("}") + 1])
    temp = video.with_suffix(".tmp.mp4")
    ffmpeg(["-i", str(video), "-c:v", "copy", "-af",
            f"loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:measured_I={m['input_i']}:measured_TP={m['input_tp']}"
            f":measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']},aresample=48000",
            "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(temp)])
    temp.replace(video)


def renderizar(motor, timeline_json, publico, saida, quadros=None, escala=None):
    cmd = [npx(), "remotion", "render", "src/index.ts", "Reel", str(saida), f"--props={timeline_json}", f"--public-dir={publico}",
           "--codec=h264", "--crf=18", "--pixel-format=yuv420p", "--audio-codec=aac", "--audio-bitrate=192k", "--log=error"]
    if quadros:
        cmd.append(f"--frames={quadros[0]}-{quadros[1]}")
    if escala:
        cmd.append(f"--scale={escala}")
    r = subprocess.run(cmd, cwd=motor, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        fim = "\n".join((r.stderr or r.stdout).strip().splitlines()[-25:])
        sys.exit(f"O render falhou:\n{fim}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("projeto")
    ap.add_argument("--amostra", nargs=2, metavar=("DE", "ATE"), help="renderiza só o trecho entre duas palavras (wNN wMM)")
    ap.add_argument("--escala", type=float, help="0.5 para prévia rápida em meia resolução")
    args = ap.parse_args()
    exigir_ambiente()
    projeto = Path(args.projeto).expanduser().resolve()
    trabalho = projeto / ".trabalho"
    publico = trabalho / "publico"
    if not (publico / "aroll.mp4").exists():
        sys.exit("Falta .trabalho/publico/aroll.mp4: rode o editar.py antes.")

    garantir_rostos(trabalho, ler_json(trabalho / "plano.json")["duracao_q"])
    timeline, tempos = montar_timeline(projeto, args)
    preparar_frentes(timeline, publico)
    if timeline["sons"]:
        import sons
        sons.gerar(publico / "sons")
    arq = trabalho / "timeline.json"
    gravar_json(arq, timeline)
    motor = preparar_motor(trabalho)

    inicio = time.time()
    if args.amostra:
        a, b = args.amostra
        if a not in tempos or b not in tempos:
            sys.exit("--amostra precisa de duas palavras que ficaram no vídeo")
        q0 = max(0, round((tempos[a][0] - 0.6) * FPS))
        q1 = min(timeline["duracao_f"] - 1, round((tempos[b][1] + 0.8) * FPS))
        saida = projeto / "amostra.mp4"
        print(f"Amostra {tempo(q0 / FPS)}–{tempo(q1 / FPS)} ({len(timeline['cenas'])} cena(s) no vídeo) ...", flush=True)
        renderizar(motor, arq, publico, saida, (q0, q1), args.escala)
    else:
        saida = projeto / "video-final.mp4"
        print(f"Compondo {tempo(timeline['duracao_f'] / FPS)} com {len(timeline['cenas'])} cena(s) ...", flush=True)
        renderizar(motor, arq, publico, saida, None, args.escala)
        acertar_volume(saida)
        ffmpeg(["-i", str(saida), "-frames:v", "1", "-q:v", "2", str(projeto / "capa.jpg")])
    print(f"Pronto em {time.time() - inicio:.0f} s: {saida}")


if __name__ == "__main__":
    main()
