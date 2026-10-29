// Família "telas": dispositivos e interfaces em 3D, cartões em perspectiva.
import type React from "react";
import type { PropsCena } from "../../tipos";
import { Cards3D } from "./Cards3D";
import { Celular3D } from "./Celular3D";
import { Chat } from "./Chat";
import { Navegador } from "./Navegador";
import { Notebook3D } from "./Notebook3D";
import { Notificacoes } from "./Notificacoes";
import { Prompt } from "./Prompt";
import { Terminal } from "./Terminal";

export const TELAS: Record<string, React.FC<PropsCena>> = {
  cards_3d: Cards3D,
  celular_3d: Celular3D,
  notebook_3d: Notebook3D,
  navegador: Navegador,
  chat: Chat,
  prompt: Prompt,
  terminal: Terminal,
  notificacoes: Notificacoes,
};
