import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },
      initTheme: () => {
        const storedTheme = localStorage.getItem("zaad-theme-storage");
        if (storedTheme) {
          try {
            const parsed = JSON.parse(storedTheme);
            applyTheme(parsed.state?.theme || "system");
          } catch {
            applyTheme("system");
          }
        } else {
          applyTheme("system");
        }
      },
    }),
    {
      name: "zaad-theme-storage",
    }
  )
);

function applyTheme(theme: Theme) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";

    root.classList.add(systemTheme);
    return;
  }

  root.classList.add(theme);
}
