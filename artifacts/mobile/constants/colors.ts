/**
 * Semantic design tokens for the mobile app.
 * 
 * Classic Light Theme - Professional, clean, and elegant
 * Designed for finance applications with accessibility in mind.
 */

const colors = {
  light: {
    // Text & Typography
    text: '#1a1a1a',
    foreground: '#1a1a1a',
    
    // Backgrounds
    background: '#f9f9f9', // Soft off-white
    card: '#ffffff',
    
    // Text on cards
    cardForeground: '#1a1a1a',
    
    // Primary action - Navy/Charcoal
    primary: '#1e3a5f',
    primaryForeground: '#ffffff',
    
    // Secondary - Light gray
    secondary: '#e8e8e8',
    secondaryForeground: '#1e3a5f',
    
    // Muted - Subtle grays
    muted: '#f0f0f0',
    mutedForeground: '#666666',
    
    // Accent - Refined green for finance
    accent: '#2d8f6f', // Professional teal
    accentForeground: '#ffffff',
    
    // Destructive/Error
    destructive: '#d32f2f',
    destructiveForeground: '#ffffff',
    
    // Borders & Inputs
    border: '#e0e0e0',
    input: '#e0e0e0',
    
    // Semantic colors
    tint: '#2d8f6f', // Same as accent
    success: '#2e7d32',
    warning: '#f57c00',
    error: '#d32f2f',
  },
  
  dark: {
    // Dark mode tokens (preserved from original)
    text: '#F1F4EE',
    tint: '#A9D4B4',
    background: '#111613',
    foreground: '#F1F4EE',
    card: '#1B241F',
    cardForeground: '#F1F4EE',
    primary: '#A9D4B4',
    primaryForeground: '#102016',
    secondary: '#253129',
    secondaryForeground: '#E2E9E1',
    muted: '#202923',
    mutedForeground: '#A0AAA0',
    accent: '#A9D4B4',
    accentForeground: '#102016',
    destructive: '#F07478',
    destructiveForeground: '#1D1111',
    border: '#303A33',
    input: '#303A33',
    success: '#66bb6a',
    warning: '#ffa726',
    error: '#ef5350',
  },
  
  radius: 12, // Refined border radius for professional look
};

export default colors;
