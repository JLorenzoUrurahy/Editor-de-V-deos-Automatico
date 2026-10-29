// Ícones por nome (biblioteca lucide, licença ISC, 1.800+ ícones de traço).
// Nome em PascalCase ("Stethoscope") ou kebab-case ("stethoscope"). Nome que não
// existe falha alto, com o nome no erro, para a cena não sair com ícone errado.
import { icons } from "lucide-react";
import type React from "react";

const pascal = (n: string) => n.replace(/(^|[-_ ])(\w)/g, (_, __, c: string) => c.toUpperCase());

export function iconeExiste(nome: string): boolean {
  return Boolean(icons[pascal(nome) as keyof typeof icons]);
}

export const Icone: React.FC<{ nome: string; tamanho: number; cor: string; traco?: number }> = ({ nome, tamanho, cor, traco = 2 }) => {
  const C = icons[pascal(nome) as keyof typeof icons];
  if (!C) throw new Error(`Ícone "${nome}" não existe (veja os nomes em https://lucide.dev/icons)`);
  return <C size={tamanho} color={cor} strokeWidth={traco} />;
};
