// grade_icones: ícones com rótulo (até 9), cada um entrando quando é dito; o último
// a entrar fica aceso. Bom para "dentista, médico, setor financeiro".
// Escolhe sozinha o desenho em que todos os rótulos ficam legíveis: cartões (ícone
// grande em cima do rótulo) ou "chips" (ícone ao lado do rótulo) em 2 ou 1 coluna.
// props: { titulo?: string, itens: { icone: string, texto: string, em: number }[] }
import type React from "react";
import { Icone } from "../../motor/icones";
import { entra, lerp, molaLeve } from "../../motor/molas";
import { alfa, caber, caixa, exigirDeclarados, medir } from "../../motor/util";
import type { Estilo, PropsCena } from "../../tipos";
import { superficie } from "./comum";

type Item = { icone: string; texto: string; em: number };
type Modo = { tipo: "cartao" | "chip"; cols: number; compacto?: boolean };

const LEGIVEL = 44;
const GAP = 18;

function medidas(estilo: Estilo, itens: Item[], modo: Modo, largura: number, altura: number) {
  const n = itens.length;
  const rows = Math.ceil(n / modo.cols);
  const celW = (largura - GAP * (modo.cols - 1)) / modo.cols;
  if (modo.tipo === "cartao") {
    const celH = Math.min(celW * (modo.cols === 1 ? 0.8 : 1.0), (altura - GAP * (rows - 1)) / rows);
    const limite = Math.min(60, celH * 0.24);
    const tamTexto = Math.min(limite, ...itens.map((i) => caber(estilo, caixa(i.texto, estilo), celW - 28, limite, 1)));
    const tamIcone = Math.min(celH - tamTexto * 1.3 - 44, celW * 0.42);
    return { rows, celW, celH, tamTexto, tamIcone, ok: tamTexto >= LEGIVEL && tamIcone >= 64 };
  }
  const celH = Math.min(150, (altura - GAP * (rows - 1)) / rows);
  // Compacto: ícone menor para sobrar largura ao rótulo (2 colunas com palavras longas).
  const tamIcone = modo.compacto ? Math.min(42, celH * 0.36) : Math.min(64, celH * 0.46);
  const limite = Math.min(64, celH * 0.5);
  const espacoTexto = celW - 2 * (modo.compacto ? 16 : 22) - tamIcone * 1.5 - (modo.compacto ? 12 : 18);
  const tamTexto = Math.min(limite, ...itens.map((i) => caber(estilo, caixa(i.texto, estilo), espacoTexto, limite, 1)));
  return { rows, celW, celH, tamTexto, tamIcone, ok: tamTexto >= 40 && celH >= tamTexto * 1.5 };
}

export const GradeIcones: React.FC<PropsCena> = ({ t, largura, altura, estilo, props, textos }) => {
  const itens = ((props.itens as Item[]) ?? []).slice(0, 9);
  const titulo = props.titulo as string | undefined;
  exigirDeclarados("grade_icones", textos, [titulo, ...itens.map((i) => i.texto)]);
  const n = Math.max(1, itens.length);
  const tamTitulo = titulo ? caber(estilo, caixa(titulo, estilo), largura, 52) : 0;
  const reserva = titulo ? tamTitulo * 1.7 : 0;
  const areaH = altura - reserva;
  const candidatos: Modo[] = [
    ...(n <= 3 ? [{ tipo: "cartao" as const, cols: n }] : n <= 9 ? [{ tipo: "cartao" as const, cols: n === 4 ? 2 : 3 }] : []),
    { tipo: "chip", cols: 2 },
    ...(n > 3 ? [{ tipo: "chip" as const, cols: 2, compacto: true }] : []),
    { tipo: "chip", cols: 1 },
  ];
  const escolhido = candidatos.map((m) => ({ m, x: medidas(estilo, itens, m, largura, areaH) })).find((c) => c.x.ok) ?? {
    m: candidatos[candidatos.length - 1],
    x: medidas(estilo, itens, candidatos[candidatos.length - 1], largura, areaH),
  };
  const { m: modo, x } = escolhido;
  const tamTexto = Math.max(40, x.tamTexto);
  const alturaBloco = reserva + x.rows * x.celH + (x.rows - 1) * GAP;
  const topo = (altura - alturaBloco) / 2;
  const tit = entra(t, 0.05, 0.35);

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: estilo.fonte, fontWeight: 800 }}>
      {titulo ? (
        <div style={{ position: "absolute", left: 0, top: topo, width: largura, textAlign: "center", fontSize: tamTitulo, letterSpacing: 4, color: estilo.cor_destaque, opacity: tit, transform: `translateY(${lerp(14, 0, tit)}px)` }}>
          {caixa(titulo, estilo)}
        </div>
      ) : null}
      {itens.map((it, k) => {
        if (t < it.em) return null;
        const c = k % modo.cols;
        const r = Math.floor(k / modo.cols);
        // Última linha incompleta fica centrada.
        const naLinha = r === x.rows - 1 ? n - r * modo.cols : modo.cols;
        const desloc = ((modo.cols - naLinha) * (x.celW + GAP)) / 2;
        const pop = molaLeve(t - it.em, 0.45, 0.06);
        const v = entra(t, it.em, 0.3);
        // Aceso do seu `em` até o próximo item entrar.
        const aceso = entra(t, it.em, 0.25) - (k + 1 < itens.length ? entra(t, itens[k + 1].em, 0.25) : 0);
        const corIcone = aceso > 0.5 ? estilo.cor_destaque : alfa("#FFFFFF", 0.9);
        const brilho = aceso > 0 ? `drop-shadow(0 0 ${18 * aceso}px ${alfa(estilo.cor_destaque, 0.6)})` : "none";
        // No chip, o ícone fica num selo quadrado com fundo leve.
        const icone =
          modo.tipo === "chip" ? (
            <div style={{ flex: "none", width: x.tamIcone * 1.5, height: x.tamIcone * 1.5, borderRadius: x.tamIcone * 0.36, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: alfa(aceso > 0.5 ? estilo.cor_destaque : "#FFFFFF", aceso > 0.5 ? 0.18 : 0.08), filter: brilho }}>
              <Icone nome={it.icone} tamanho={x.tamIcone} cor={corIcone} />
            </div>
          ) : (
            <div style={{ flex: "none", filter: brilho }}>
              <Icone nome={it.icone} tamanho={x.tamIcone} cor={corIcone} />
            </div>
          );
        const rotulo = <div style={{ fontSize: tamTexto, color: estilo.cor_texto, whiteSpace: "nowrap" }}>{caixa(it.texto, estilo)}</div>;
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: desloc + c * (x.celW + GAP),
              top: topo + reserva + r * (x.celH + GAP),
              width: x.celW,
              height: x.celH,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: modo.tipo === "cartao" ? "column" : "row",
              alignItems: "center",
              justifyContent: modo.tipo === "cartao" ? "center" : "flex-start",
              gap: modo.tipo === "cartao" ? 14 : modo.compacto ? 12 : 18,
              padding: modo.tipo === "cartao" ? 0 : modo.compacto ? "0 16px" : "0 22px",
              ...superficie(estilo.cor_destaque, Math.max(0, aceso)),
              opacity: v,
              transform: `scale(${lerp(0.7, 1, pop)})`,
            }}
          >
            {icone}
            {rotulo}
          </div>
        );
      })}
    </div>
  );
};
