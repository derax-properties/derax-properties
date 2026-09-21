"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./icons";

const THEMES = [
  { key: "sage", label: "Sage & Clay", dot: "#4f7a5c" },
  { key: "sky", label: "Sky & Sand", dot: "#3f7ea6" },
  { key: "citrus", label: "Citrus Cream", dot: "#c9752f" },
  { key: "orchard", label: "Orchard Jewel", dot: "#7c5cb0" },
] as const;

const THEME_KEY = "derax-crm-theme";
const MODE_KEY = "derax-crm-mode";

/**
 * Applies the saved (or default) theme/mode to the CRM shell as soon as
 * this mounts, and lets the admin pick a different one. Everything here
 * is a per-browser convenience (localStorage) — never anything the server
 * or other admins need to see, so it's fine that it lives only in the
 * viewer's own browser.
 */
export function ThemePicker() {
  const [theme, setTheme] = useState<string>("sage");
  const [mode, setMode] = useState<string>("light");

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY) || "sage";
      const savedMode = localStorage.getItem(MODE_KEY) || "light";
      setTheme(savedTheme);
      setMode(savedMode);
      applyToShell(savedTheme, savedMode);
    } catch {
      // localStorage unavailable — fall back to the light Sage & Clay default.
    }
  }, []);

  function applyToShell(nextTheme: string, nextMode: string) {
    const shell = document.querySelector(".crm-shell");
    if (!shell) return;
    shell.setAttribute("data-crm-theme", nextTheme);
    shell.setAttribute("data-crm-mode", nextMode);
  }

  function pickTheme(key: string) {
    setTheme(key);
    applyToShell(key, mode);
    try {
      localStorage.setItem(THEME_KEY, key);
    } catch {
      // best-effort only
    }
  }

  function pickMode(nextMode: string) {
    setMode(nextMode);
    applyToShell(theme, nextMode);
    try {
      localStorage.setItem(MODE_KEY, nextMode);
    } catch {
      // best-effort only
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-white p-1">
        <button
          type="button"
          onClick={() => pickMode("light")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mode === "light" ? "crm-accent-bg text-white" : "text-ink/50"
          }`}
        >
          <SunIcon className="h-3.5 w-3.5" /> Light
        </button>
        <button
          type="button"
          onClick={() => pickMode("dark")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            mode === "dark" ? "bg-ink text-white" : "text-ink/50"
          }`}
        >
          <MoonIcon className="h-3.5 w-3.5" /> Dark
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        {THEMES.map((t) => (
          <button
            key={t.key}
            type="button"
            title={t.label}
            onClick={() => pickTheme(t.key)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
              theme === t.key ? "border-ink/20 bg-white shadow-sm" : "border-transparent text-ink/40 hover:bg-white/60"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.dot }} />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
