import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { useThemeStore } from './store'

// Initialize theme immediately to prevent FOUC (Flash of Unstyled Content)
// This runs before React renders anything
(() => {
  const storedTheme = localStorage.getItem("zaad-theme-storage");
  const root = document.documentElement;
  
  let theme: "light" | "dark" | "system" = "system";
  
  if (storedTheme) {
    try {
      const parsed = JSON.parse(storedTheme);
      theme = parsed.state?.theme || "system";
    } catch {
      theme = "system";
    }
  }

  // Apply the theme
  root.classList.remove("light", "dark");
  
  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
})();

function Root() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </StrictMode>,
)
