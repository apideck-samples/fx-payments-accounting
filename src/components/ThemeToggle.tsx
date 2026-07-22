"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Light/dark toggle backed by localStorage. The actual `dark` class is
// applied to <html> by the inline script in layout.tsx (to avoid a FOUC),
// so this component only mirrors that state and reacts to clicks.
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const initial = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(initial);
  }, []);

  const flip = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("apideck-demo-theme", next);
    } catch {
      // ignore (private-mode etc.)
    }
  };

  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="inline-flex items-center justify-center w-8 h-8 rounded-md ring-1 ring-black/10 dark:ring-white/15 bg-white/60 dark:bg-ink-800/60 text-ink-900 dark:text-zinc-200 hover:bg-white dark:hover:bg-ink-700 transition"
    >
      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
}
