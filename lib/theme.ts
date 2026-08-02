export const THEME_STORAGE_KEY = "thilanhewage.theme";

export type Theme = "light" | "dark";

/**
 * Runs before hydration (see app/layout.tsx) so `data-theme` is correct on
 * the very first paint — otherwise a stored dark preference would flash
 * light for a frame on every reload.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing / storage quota — theme just won't persist.
  }
}
