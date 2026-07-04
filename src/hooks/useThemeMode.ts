import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "kotokeys-theme";
const LEGACY_STORAGE_KEY = "kotopia-theme";

export function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
  };
}
