// Os mapas embutidos (dados/*.json) entram pelo empacotador; aqui só o tipo.
declare module "*.json" {
  const valor: unknown;
  export default valor;
}
