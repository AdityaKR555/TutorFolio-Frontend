export const CUSTOM_BACKGROUND_STORAGE_KEY = "tutorfolio-custom-background";
export const DEFAULT_CUSTOM_BACKGROUND = "#eaeafb";
export const isBackgroundColor = (value) => /^#[0-9a-f]{6}$/i.test(value);

export const getCustomBackground = () => {
  try {
    const saved = localStorage.getItem(CUSTOM_BACKGROUND_STORAGE_KEY);
    return isBackgroundColor(saved) ? saved : DEFAULT_CUSTOM_BACKGROUND;
  } catch {
    return DEFAULT_CUSTOM_BACKGROUND;
  }
};

export const BACKGROUND_STORAGE_KEY = "tutorfolio-background";

export const BACKGROUND_OPTIONS = [
  { id: "cream", name: "Light cream", color: "#fbf9f6", description: "Soft and warm" },
  { id: "lavender", name: "Lavender", color: "#eaeafb", description: "A gentle hint of purple" },
  { id: "white", name: "White", color: "#ffffff", description: "Clean and minimal · Default" },
  { id: "custom", name: "Custom", color: "#eaeafb", description: "Choose your own color" },
];

export const getBackground = () => {
  try {
    const saved = localStorage.getItem(BACKGROUND_STORAGE_KEY);
    return BACKGROUND_OPTIONS.some((option) => option.id === saved) ? saved : "white";
  } catch {
    return "white";
  }
};

export const setBackground = (background, customColor = getCustomBackground()) => {
  if (!BACKGROUND_OPTIONS.some((option) => option.id === background)) return false;
  if (!isBackgroundColor(customColor)) return false;
  document.documentElement.style.setProperty("--tf-custom-bg", customColor);
  const rgb = customColor.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255);
  const linear = rgb.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  document.documentElement.style.setProperty("--tf-sidebar-custom-ink", luminance < 0.179 ? "#ffffff" : "#172b46");
  document.documentElement.dataset.background = background;
  let saved = true;
  try {
    localStorage.setItem(CUSTOM_BACKGROUND_STORAGE_KEY, customColor);
    localStorage.setItem(BACKGROUND_STORAGE_KEY, background);
  } catch {
    saved = false;
  }
  window.dispatchEvent(new Event("tutorfolio-background-updated"));
  return saved;
};
