// Theme registry for TutorFolio public website
// Each theme is a React component that receives the same props from PublicTutorWebsite
export { default as ThemeClassic } from './ThemeClassic';
export { default as ThemeModern } from './ThemeModern';
export { default as ThemeBold } from './ThemeBold';
export { default as ThemeMinimal } from './ThemeMinimal';

/** Metadata for all themes – consumed by Website.jsx settings page */
export const THEMES = [
  {
    id: 'theme_classic',
    label: 'Classic',
    component: 'ThemeClassic',
    primaryColor: '#3B82F6',
    secondaryColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
    description: 'Clean, professional and timeless. Great for a formal tutor presence.',
    features: ['Blue accent palette', 'Grid content layout', 'Professional look'],
  },
  {
    id: 'theme_modern',
    label: 'Modern',
    component: 'ThemeModern',
    primaryColor: '#6366F1',
    secondaryColor: '#818CF8',
    backgroundColor: '#0F0F1A',
    description: 'Dark, sleek and minimal. Perfect for a contemporary, standout profile.',
    features: ['Dark surfaces', 'Indigo accents', 'Underline tab nav'],
  },
  {
    id: 'theme_bold',
    label: 'Bold',
    component: 'ThemeBold',
    primaryColor: '#0D9488',
    secondaryColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    description: 'Vibrant, colorful and energetic. Makes your profile pop.',
    features: ['Teal + amber palette', 'Gradient hero', 'Rounded pill tabs'],
  },
  {
    id: 'theme_minimal',
    label: 'Minimal',
    component: 'ThemeMinimal',
    primaryColor: '#111827',
    secondaryColor: '#6B7280',
    backgroundColor: '#FAFAFA',
    description: 'Ultra-clean and typography-first. Elegant simplicity.',
    features: ['Serif headings', 'Ample whitespace', 'Monochrome palette'],
  },
];
