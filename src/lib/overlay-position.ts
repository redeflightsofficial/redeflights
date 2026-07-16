/** Prevents horizontal page scroll while mobile overlays (autocomplete / pickers) are open. */
export function lockBodyOverflowX() {
  const html = document.documentElement;
  const body = document.body;
  const prev = {
    htmlOverflowX: html.style.overflowX,
    bodyOverflowX: body.style.overflowX,
    bodyTouchAction: body.style.touchAction,
  };

  html.style.overflowX = "hidden";
  body.style.overflowX = "hidden";
  body.style.touchAction = "pan-y";

  return () => {
    html.style.overflowX = prev.htmlOverflowX;
    body.style.overflowX = prev.bodyOverflowX;
    body.style.touchAction = prev.bodyTouchAction;
  };
}

export function clampMenuToViewport(preferredLeft: number, preferredWidth: number, padding = 8) {
  const maxWidth = Math.max(0, window.innerWidth - padding * 2);
  const width = Math.min(preferredWidth, maxWidth);
  const left = Math.max(padding, Math.min(preferredLeft, window.innerWidth - width - padding));
  return { left, width };
}
