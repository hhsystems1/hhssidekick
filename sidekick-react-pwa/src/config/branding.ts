/**
 * App Branding Configuration
 * Centralized place for app name, logo, and branding
 */

export const BRANDING = {
  // App Information
  appName: 'Sidekick', // Change this to your actual app name
  appTagline: 'Your AI-Powered Business Assistant',

  // Logo Configuration (update when you have your logo)
  logo: {
    // Set to true when you have a logo file
    hasImage: false,
    // Path to logo image (relative to public folder)
    imagePath: '/logo.svg',
    // Emoji/icon fallback (used when hasImage is false)
    emoji: '🤖',
    // Text fallback
    text: 'SK',
  },

  // Colors (Tailwind classes)
  colors: {
    primary: 'emerald', // Used for buttons, highlights
    sidebar: 'slate-900',
    background: 'slate-950',
  },

  // Navigation
  navigation: {
    showChat: true, // Toggle chat feature
    showMarketplace: false, // Toggle marketplace (future feature)
    showTraining: false, // Toggle training (future feature)
  },
};

/**
 * Get the logo display (emoji or text)
 * Returns the appropriate fallback based on configuration
 */
export function getLogo() {
  return BRANDING.logo.emoji || BRANDING.logo.text;
}

/**
 * Check if logo image should be displayed
 */
export function hasLogoImage() {
  return BRANDING.logo.hasImage;
}

/**
 * Get logo image path
 */
export function getLogoImagePath() {
  return BRANDING.logo.imagePath;
}
