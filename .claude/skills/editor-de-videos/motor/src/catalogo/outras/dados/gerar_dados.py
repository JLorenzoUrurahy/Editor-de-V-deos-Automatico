#!/usr/bin/env python3
"""Gera os mapas embutidos (rodar só para atualizar; o render nunca vai à internet).

  brasil-uf.json  estados do Brasil. Fonte: IBGE, API de malhas v3 (UF, qualidade mínima)
                  + API de localidades (sigla e nome). Uso permitido com citação da fonte (IBGE).
  mundo.json      países. Fonte: Natural Earth, 1:110m admin 0 (domínio público).

uso: python3 gerar_dados.py <pasta com uf.geojson, estados.json e ne110.geojson>
  curl -o uf.geojson "https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&intrarregiao=UF&qualidade=minima"
  curl -o estados.json "https://servicodados.ibge.gov.br/api/v1/localidades/estados"
  curl -o ne110.geojson "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"

Os anéis saem no sentido que o d3-geo espera (externo horário, buraco anti-horário);
com o sentido do GeoJSON padrão o d3 pinta o resto do globo.
"""
import json
import sys
from pathlib import Path


def area(anel):
    return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(anel, anel[1:]))


def orientar(poligono, casas):
    """Arredonda, tira pontos repetidos e anéis degenerados (menos de 4 pontos
    derrubam o recorte do d3-geo) e acerta o sentido dos anéis."""
    saida = []
    for k, anel in enumerate(poligono):
        anel = [[round(x, casas), round(y, casas)] for x, y in anel]
        limpo = [anel[0]] + [p for a, p in zip(anel, anel[1:]) if p != a]
        if limpo[0] != limpo[-1]:
            limpo.append(limpo[0])
        if len(limpo) < 4 or abs(area(limpo)) < 1e-9:
            if k == 0:
                return None
            continue
        horario = area(limpo) < 0
        if (k == 0) != horario:
            limpo.reverse()
        saida.append(limpo)
    return saida


def geometria(g, casas):
    if g["type"] == "Polygon":
        return {"type": "Polygon", "coordinates": orientar(g["coordinates"], casas)}
    partes = [q for q in (orientar(p, casas) for p in g["coordinates"]) if q]
    return {"type": "MultiPolygon", "coordinates": partes}


def main():
    pasta = Path(sys.argv[1])
    aqui = Path(__file__).resolve().parent
    estados = {str(e["id"]): e for e in json.loads((pasta / "estados.json").read_text())}
    uf = json.loads((pasta / "uf.geojson").read_text())
    brasil = {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {"sigla": estados[f["properties"]["codarea"]]["sigla"], "nome": estados[f["properties"]["codarea"]]["nome"]},
         "geometry": geometria(f["geometry"], 3)} for f in uf["features"]]}
    (aqui / "brasil-uf.json").write_text(json.dumps(brasil, ensure_ascii=False, separators=(",", ":")))

    ne = json.loads((pasta / "ne110.geojson").read_text())
    mundo = {"type": "FeatureCollection", "features": []}
    for f in ne["features"]:
        p = f["properties"]
        a2 = p["ISO_A2_EH"] if p["ISO_A2_EH"] != "-99" else p["ADM0_A3"][:2]
        mundo["features"].append({"type": "Feature", "properties": {"a2": a2, "a3": p["ADM0_A3"], "nome": p["NAME_PT"]},
                                  "geometry": geometria(f["geometry"], 2)})
    (aqui / "mundo.json").write_text(json.dumps(mundo, ensure_ascii=False, separators=(",", ":")))
    print("ok", len(brasil["features"]), len(mundo["features"]))


if __name__ == "__main__":
    main()
