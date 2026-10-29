// Utilidades da família "dados": ler e escrever número no formato brasileiro,
// rótulo de cena e superfícies de cartão no padrão do guia.
import type React from "react";
import { entra, lerp } from "../../motor/molas";
import { alfa, caber, caixa } from "../../motor/util";
import type { Estilo } from "../../tipos";

export const VERMELHO = "#FF4D4F";

/** Número dentro de um texto dito ("R$ 12.400", "87%", "1,5 mil", "10x").
 *  Devolve o valor, as casas decimais e o que vem antes e depois do número. */
export type Numero = { valor: number; casas: number; antes: string; depois: string };

export function lerNumero(texto: string): Numero | null {
  const m = /[-+]?\d[\d.,]*/.exec(texto);
  if (!m) return null;
  let bruto = m[0].replace(/[.,]$/, "");
  let casas = 0;
  if (bruto.includes(",")) {
    // vírgula é decimal; ponto é milhar
    const [int, dec] = bruto.split(",");
    casas = dec.length;
    bruto = `${int.replace(/\./g, "")}.${dec}`;
  } else if (/\.\d{3}(\.|$)/.test(bruto)) {
    bruto = bruto.replace(/\./g, ""); // 12.400 = doze mil e quatrocentos
  } else if (bruto.includes(".")) {
    casas = bruto.split(".")[1].length; // 1.5 escrito com ponto
  }
  const valor = Number(bruto);
  if (!Number.isFinite(valor)) return null;
  const fim = m.index + m[0].replace(/[.,]$/, "").length;
  return { valor, casas, antes: texto.slice(0, m.index), depois: texto.slice(fim) };
}

/** Formata no padrão brasileiro: ponto de milhar, vírgula decimal. */
export function formatarBR(valor: number, casas: number): string {
  const fixo = Math.abs(valor).toFixed(casas);
  const [int, dec] = fixo.split(".");
  const milhar = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${valor < 0 ? "-" : ""}${milhar}${dec ? `,${dec}` : ""}`;
}

/** Texto do contador no meio da contagem: mesmo prefixo/sufixo e casas do texto final.
 *  No fim (p = 1) devolve o texto dito, exatamente como veio. */
export function textoContando(texto: string, p: number, de = 0): string {
  const n = lerNumero(texto);
  if (!n || p >= 1) return texto;
  return `${n.antes}${formatarBR(lerp(de, n.valor, p), n.casas)}${n.depois}`;
}

/** Valor numérico de um item: `valor` explícito ou o número do texto dito. */
export function valorDe(item: { valor?: number; texto?: string }): number {
  if (typeof item.valor === "number") return item.valor;
  return (item.texto && lerNumero(item.texto)?.valor) || 0;
}

/** Cartão neutro do guia. */
export const superficie = (raio = 26): React.CSSProperties => ({
  background: `linear-gradient(145deg, ${alfa("#FFFFFF", 0.14)}, ${alfa("#FFFFFF", 0.05)})`,
  border: `1.5px solid ${alfa("#FFFFFF", 0.18)}`,
  borderRadius: raio,
  boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
});

/** Cartão em destaque (cor da marca). */
export const superficieDestaque = (estilo: Estilo, raio = 26): React.CSSProperties => ({
  background: `linear-gradient(145deg, ${estilo.cor_destaque}, ${alfa(estilo.cor_destaque, 0.72)})`,
  border: `1.5px solid ${alfa("#FFFFFF", 0.4)}`,
  borderRadius: raio,
  boxShadow: `0 18px 48px rgba(0,0,0,0.35), 0 0 46px ${alfa(estilo.cor_destaque, 0.4)}`,
});

/** Altura que o rótulo ocupa (0 sem rótulo). */
export const alturaRotulo = (tamanho: number) => (tamanho ? tamanho * 1.25 : 0);

/** Tamanho do rótulo de cena (caixa alta, na cor de destaque). */
export const tamanhoRotulo = (estilo: Estilo, rotulo: string | undefined, largura: number, max = 54) =>
  rotulo ? caber(estilo, caixa(rotulo, estilo), largura, max, 40) : 0;

/** Rótulo de cena: entra de baixo, curto, e fica parado. */
export const Rotulo: React.FC<{ texto: string; t: number; t0?: number; topo: number; largura: number; tamanho: number; estilo: Estilo; cor?: string }> = ({
  texto,
  t,
  t0 = 0.1,
  topo,
  largura,
  tamanho,
  estilo,
  cor,
}) => {
  const p = entra(t, t0, 0.4);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: topo,
        width: largura,
        textAlign: "center",
        fontSize: tamanho,
        lineHeight: 1.25,
        letterSpacing: 4,
        color: cor ?? estilo.cor_destaque,
        opacity: p,
        translate: `0px ${lerp(18, 0, p)}px`,
        whiteSpace: "nowrap",
      }}
    >
      {caixa(texto, estilo)}
    </div>
  );
};
