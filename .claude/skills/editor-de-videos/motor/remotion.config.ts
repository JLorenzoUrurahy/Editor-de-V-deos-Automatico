// Configuração do Remotion CLI para o editor de vídeos.
// Feito com Remotion (https://www.remotion.dev). O uso do Remotion segue a licença dele: https://www.remotion.pro/license
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// H.264 yuv420p marcado como bt709, igual ao vídeo da câmera.
Config.setColorSpace("bt709");
