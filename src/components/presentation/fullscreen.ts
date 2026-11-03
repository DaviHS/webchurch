export function enterFullscreen(target: Document = document): void {
  if (target.fullscreenElement) return;
  target.documentElement.requestFullscreen().catch((error: unknown) => {
    console.debug("Tela cheia recusada pelo navegador:", error);
  });
}

export function exitFullscreen(target: Document = document): void {
  if (!target.fullscreenElement) return;
  target.exitFullscreen().catch((error: unknown) => {
    console.debug("Não foi possível sair da tela cheia:", error);
  });
}
