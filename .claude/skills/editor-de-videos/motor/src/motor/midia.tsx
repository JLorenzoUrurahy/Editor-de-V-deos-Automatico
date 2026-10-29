// Imagem ou vídeo da própria pessoa (print, gravação de tela, foto de produto),
// copiado pelo compor.py para a pasta pública em midia/. Vídeo entra sem som.
import type React from "react";
import { Img, OffthreadVideo, staticFile } from "remotion";

export const ehVideo = (src: string) => /\.(mp4|mov|webm|m4v)$/i.test(src);

export const Midia: React.FC<{ src: string; largura: number; altura: number; ajuste?: "cover" | "contain"; posicao?: string; style?: React.CSSProperties }> = ({
  src,
  largura,
  altura,
  ajuste = "cover",
  posicao = "top center",
  style,
}) => {
  const comum: React.CSSProperties = { width: largura, height: altura, objectFit: ajuste, objectPosition: posicao, display: "block", ...style };
  return ehVideo(src) ? <OffthreadVideo muted src={staticFile(src)} style={comum} /> : <Img src={staticFile(src)} style={comum} />;
};
