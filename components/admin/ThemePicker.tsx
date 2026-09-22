"use client";

import { useEffect, useRef, useState } from "react";
import { SunIcon, MoonIcon, WallpaperIcon } from "./icons";

const THEMES = [
  { key: "sage", label: "Sage & Clay", dot: "#4f7a5c" },
  { key: "sky", label: "Sky & Sand", dot: "#3f7ea6" },
  { key: "citrus", label: "Citrus Cream", dot: "#c9752f" },
  { key: "orchard", label: "Orchard Jewel", dot: "#7c5cb0" },
] as const;

// Five background photos the admin can swap in behind the CRM's cards —
// purely a background-image swap (see the CSS rules in globals.css right
// after the dark-mode canvas block), so picking one never touches the
// accent theme, light/dark mode, card colors, or anything else.
const WALLPAPERS = [
  { key: "1", label: "Amber Bokeh" },
  { key: "2", label: "Twilight Forest" },
  { key: "3", label: "Cream Gold Bloom" },
  { key: "4", label: "Midnight Spheres" },
  { key: "5", label: "Ink Bokeh Night" },
] as const;

const THEME_KEY = "derax-crm-theme";
const MODE_KEY = "derax-crm-mode";
const WALLPAPER_KEY = "derax-crm-wallpaper";

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
  const [wallpaper, setWallpaper] = useState<string>("");
  const [wallpaperOpen, setWallpaperOpen] = useState(false);
  const wallpaperRef = useRef<HTMLDivElement>(null);

  // Same pattern as AdminSidebar's rail: clicking anywhere outside the
  // open popover closes it, rather than leaving it stuck open until the
  // Wallpaper button itself is clicked again.
  useEffect(() => {
    if (!wallpaperOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (wallpaperRef.current && !wallpaperRef.current.contains(e.target as Node)) {
        setWallpaperOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [wallpaperOpen]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY) || "sage";
      const savedMode = localStorage.getItem(MODE_KEY) || "light";
      const savedWallpaper = localStorage.getItem(WALLPAPER_KEY) || "";
      setTheme(savedTheme);
      setMode(savedMode);
      setWallpaper(savedWallpaper);
      applyToShell(savedTheme, savedMode, savedWallpaper);
    } catch {
      // localStorage unavailable — fall back to the light Sage & Clay default.
    }
  }, []);

  function applyToShell(nextTheme: string, nextMode: string, nextWallpaper: string) {
    const shell = document.querySelector(".crm-shell");
    if (!shell) return;
    shell.setAttribute("data-crm-theme", nextTheme);
    shell.setAttribute("data-crm-mode", nextMode);
    if (nextWallpaper) {
      shell.setAttribute("data-crm-wallpaper", nextWallpaper);
    } else {
      shell.removeAttribute("data-crm-wallpaper");
    }
  }

  function pickTheme(key: string) {
    setTheme(key);
    applyToShell(key, mode, wallpaper);
    try {
      localStorage.setItem(THEME_KEY, key);
    } catch {
      // best-effort only
    }
  }

  function pickMode(nextMode: string) {
    setMode(nextMode);
    applyToShell(theme, nextMode, wallpaper);
    try {
      localStorage.setItem(MODE_KEY, nextMode);
    } catch {
      // best-effort only
    }
  }

  function pickWallpaper(key: string) {
    setWallpaper(key);
    applyToShell(theme, mode, key);
    try {
      if (key) {
        localStorage.setItem(WALLPAPER_KEY, key);
      } else {
        localStorage.removeItem(WALLPAPER_KEY);
      }
    } catch {
      // best-effort only
    }
    setWallpaperOpen(false);
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

      {/*
        Wallpaper picker — a small popover of thumbnails, kept separate
        from the theme/mode controls above since it only ever changes the
        background photo behind the cards, never the accent color, card
        style, or light/dark scheme.
      */}
      <div className="relative" ref={wallpaperRef}>
        <button
          type="button"
          onClick={() => setWallpaperOpen((v) => !v)}
          aria-expanded={wallpaperOpen}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
            wallpaperOpen ? "border-ink/20 bg-white shadow-sm" : "border-transparent text-ink/40 hover:bg-white/60"
          }`}
        >
          <WallpaperIcon className="h-3.5 w-3.5" />
          Wallpaper
        </button>
        {wallpaperOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-ink/10 bg-white p-3 shadow-card">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink/40">Background</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => pickWallpaper("")}
                title="Default"
                className={`flex aspect-video items-center justify-center rounded-lg border bg-cream text-[10px] font-semibold text-ink/40 transition ${
                  wallpaper === "" ? "border-gold ring-2 ring-gold/40" : "border-ink/10 hover:border-ink/20"
                }`}
              >
                Default
              </button>
              {WALLPAPERS.map((w) => (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => pickWallpaper(w.key)}
                  title={w.label}
                  className={`aspect-video overflow-hidden rounded-lg border bg-cover bg-center transition ${
                    wallpaper === w.key ? "border-gold ring-2 ring-gold/40" : "border-ink/10 hover:border-ink/20"
                  }`}
                  style={{ backgroundImage: `url(/crm-wallpapers/wallpaper-${w.key}-thumb.jpg)` }}
                />
              ))}
            </div>
            <p className="mt-2 text-[10px] text-ink/35">Only changes the background photo — your theme and layout stay the same.</p>
          </div>
        )}
      </div>
    </div>
  );
}
