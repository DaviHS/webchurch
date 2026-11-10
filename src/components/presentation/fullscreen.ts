export function enterFullscreen(target: Document = document): void {
  if (target.fullscreenElement) return;
  target.documentElement.requestFullscreen().catch((error: unknown) => {
    console.debug("Tela cheia recusada pelo navegador:", error);
  });
}

export async function tryEnterFullscreen(target: Document = document): Promise<boolean> {
  if (target.fullscreenElement) return true;
  try {
    await target.documentElement.requestFullscreen();
    return true;
  } catch (error) {
    console.info("Tela cheia automática recusada:", error);
    return false;
  }
}

export function autoFullscreen(): () => void {
  let done = false;
  let attempts = 0;
  const attempt = () => {
    if (done || document.fullscreenElement) return;
    attempts += 1;
    void tryEnterFullscreen().then((ok) => {
      if (ok) done = true;
    });
  };
  const timers = [0, 300, 1000, 2500, 5000].map((delay) => setTimeout(attempt, delay));
  const onFocus = () => {
    if (attempts < 12) attempt();
  };
  window.addEventListener("load", attempt);
  window.addEventListener("focus", onFocus);
  return () => {
    done = true;
    timers.forEach(clearTimeout);
    window.removeEventListener("load", attempt);
    window.removeEventListener("focus", onFocus);
  };
}

export function exitFullscreen(target: Document = document): void {
  if (!target.fullscreenElement) return;
  target.exitFullscreen().catch((error: unknown) => {
    console.debug("Não foi possível sair da tela cheia:", error);
  });
}
