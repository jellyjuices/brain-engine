export function trackViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const root = document.documentElement;
  function update() {
    const vv = window.visualViewport;
    if (!vv) return;
    root.style.setProperty("--vvh", `${vv.height}px`);
    root.style.setProperty("--vvt", `${vv.offsetTop}px`);
    root.style.setProperty(
      "--kb",
      `${Math.max(0, window.innerHeight - vv.height - vv.offsetTop)}px`,
    );
    const keyboard = window.innerHeight - vv.height > 120;
    if (keyboard) root.setAttribute("data-keyboard", "");
    else root.removeAttribute("data-keyboard");
  }
  vv.addEventListener("resize", update);
  vv.addEventListener("scroll", update);
  update();
}
