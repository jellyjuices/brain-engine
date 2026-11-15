export function followSystemTheme() {
  const query = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!query) return;
  const apply = () => {
    document.documentElement.dataset.theme = query.matches ? "dark" : "light";
  };
  apply();
  query.addEventListener?.("change", apply);
}
