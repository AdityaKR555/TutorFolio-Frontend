import { useEffect, useState } from "react";
import { BACKGROUND_OPTIONS, BACKGROUND_STORAGE_KEY, CUSTOM_BACKGROUND_STORAGE_KEY, getBackground, getCustomBackground, setBackground } from "../utils/background";

export default function SystemThemeSettings() {
  const [background, updateBackground] = useState(getBackground);
  const [customColor, updateCustomColor] = useState(getCustomBackground);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sync = (event) => {
      if (event.type === "storage" && event.key !== BACKGROUND_STORAGE_KEY && event.key !== CUSTOM_BACKGROUND_STORAGE_KEY && event.key !== null) return;
      updateBackground(document.documentElement.dataset.background || "cream");
      updateCustomColor(document.documentElement.style.getPropertyValue("--tf-custom-bg") || getCustomBackground());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("tutorfolio-background-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("tutorfolio-background-updated", sync);
    };
  }, []);

  return (
    <section className="tf-card min-w-0 p-5 shadow-sm max-[560px]:p-4" id="system-theme" aria-labelledby="system-theme-title">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[.08em] text-tf-muted">Appearance</span>
      <h2 id="system-theme-title" className="tf-section-title mt-0 mb-1">System theme</h2>
      <p className="mt-0 mb-5 text-sm text-tf-copy">Choose your platform background. Changes apply instantly and are remembered in this browser.</p>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-tf-ink">Light theme background</legend>
        <div className="grid grid-cols-2 gap-3 min-[1100px]:grid-cols-4 max-[560px]:grid-cols-1">
          {BACKGROUND_OPTIONS.map((option) => (
            <label key={option.id} className={`relative flex cursor-pointer flex-col rounded-xl border-2 p-3 transition-colors ${background === option.id ? "border-tf-blue bg-tf-sky/30" : "border-tf-line hover:border-tf-blue/50"}`}>
              <div className="mb-3 flex h-24 items-center justify-center rounded-lg border border-black/10 px-4" style={{ backgroundColor: option.id === "custom" ? customColor : option.color }} aria-hidden="true">
                <div className="w-full rounded-lg border border-black/5 bg-white p-3 shadow-sm">
                  <div className="mb-2 h-1.5 w-1/2 rounded bg-slate-300" />
                  <div className="h-1.5 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="radio" name="platform-background" value={option.id} checked={background === option.id}
                  className="h-4 w-4 shrink-0 accent-[var(--tf-blue)]"
                  onChange={() => {
                    const saved = setBackground(option.id, customColor);
                    updateBackground(option.id);
                    setMessage(saved ? `${option.name} background saved.` : `${option.name} applied for this visit. Browser storage is unavailable.`);
                  }} />
                <span className="text-sm font-semibold text-tf-ink">{option.name}</span>
              </div>
              <span className="mt-1 pl-6 text-xs text-tf-copy">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {background === "custom" && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-tf-line bg-tf-surface-soft p-3">
          <label htmlFor="custom-background-color" className="text-sm font-medium text-tf-ink">Custom background color</label>
          <input id="custom-background-color" type="color" value={customColor}
            className="h-11 w-16 cursor-pointer rounded-lg border border-tf-line bg-tf-surface p-1"
            onInput={(event) => {
              const color = event.target.value;
              updateCustomColor(color);
              const saved = setBackground("custom", color);
              setMessage(saved ? "Custom background saved." : "Custom background applied for this visit. Browser storage is unavailable.");
            }} />
          <span className="font-mono text-sm text-tf-copy">{customColor.toUpperCase()}</span>
        </div>
      )}
      <p className="mt-4 mb-0 text-xs text-tf-copy">Dark theme uses a black background. Your selected color returns when you switch to light theme.</p>
      <p role="status" className="mt-2 mb-0 min-h-5 text-xs text-tf-success">{message}</p>
    </section>
  );
}
