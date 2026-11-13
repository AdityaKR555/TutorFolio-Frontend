// Theme registry for TutorFolio public website
// Each theme is a React component that receives the same props from PublicTutorWebsite
export { default as ThemeClassic } from './ThemeClassic';
export { default as ThemeMinimal } from './ThemeMinimal';
export { default as ThemeLuminary } from './ThemeLuminary';

/** Metadata for all themes – consumed by Website.jsx settings page */
export const THEMES = [
  {
    id: "classic",
    label: "Classic Academic",
    component: "ThemeClassic",
    primaryColor: "#1763e9",
    secondaryColor: "#0c54cc",
    backgroundColor: "#ffffff",
    description: "Clean, structured academic theme.",
    features: ["Academic layout", "Structured sections", "Light & Dark theme"],
    isPaidOnly: false,
  },
  {
    id: "minimal",
    label: "Modern Minimal",
    component: "ThemeMinimal",
    primaryColor: "#111827",
    secondaryColor: "#4f46e5",
    backgroundColor: "#f9fafb",
    description: "Sleek, distraction-free modern theme.",
    features: ["Clean typography", "Modern geometry", "Refined minimalism"],
    isPaidOnly: false,
  },
  {
    id: "luminary_elite",
    label: "Luminary Elite",
    component: "ThemeLuminary",
    primaryColor: "#d97706",
    secondaryColor: "#4f46e5",
    backgroundColor: "#0b0f19",
    description: "Exclusive luxury theme with heraldic gold crest, pedagogy pillars, and VIP cohorts.",
    features: ["Heraldic gold crest", "Pedagogy pillars", "Executive cohorts", "Paid plan exclusive"],
    isPaidOnly: true,
  },
];
