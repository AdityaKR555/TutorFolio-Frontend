// Theme registry for TutorFolio public website
// Each theme is a React component that receives the same props from PublicTutorWebsite
export { default as ThemeClassic } from './ThemeClassic';
export { default as ThemeModern } from './ThemeModern';
export { default as ThemeBold } from './ThemeBold';
export { default as ThemeMinimal } from './ThemeMinimal';

/** Metadata for all themes – consumed by Website.jsx settings page */
/** Renderer bindings for database theme IDs. Theme availability and display metadata
 * are supplied by the backend catalog. */
export const THEMES = [
  { id: "classic", label: "Classic Academic", component: "ThemeClassic", primaryColor: "#1763e9", secondaryColor: "#0c54cc", backgroundColor: "#ffffff", description: "Clean, structured academic theme.", features: [] },
  { id: "minimal", label: "Modern Minimal", component: "ThemeMinimal", primaryColor: "#111827", secondaryColor: "#4f46e5", backgroundColor: "#f9fafb", description: "Sleek, distraction-free theme.", features: [] },
  { id: "vibrant_slate", label: "Vibrant Slate", component: "ThemeModern", primaryColor: "#0ea5e9", secondaryColor: "#0284c7", backgroundColor: "#f8fafc", description: "Contemporary high-contrast theme.", features: [] },
  { id: "bold_educator", label: "Bold Educator", component: "ThemeBold", primaryColor: "#f97316", secondaryColor: "#ea580c", backgroundColor: "#fff7ed", description: "Energetic and colorful theme.", features: [] },
  { id: "elite_academy", label: "Elite Academy", component: "ThemeBold", primaryColor: "#8b5cf6", secondaryColor: "#6d28d9", backgroundColor: "#ffffff", description: "Institute-grade premium theme.", features: [] },
];
