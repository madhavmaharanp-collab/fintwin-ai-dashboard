/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#111412',
    tint: '#173F35',
    background: '#F6F6F2',
    foreground: '#111412',
    card: '#FFFFFF',
    cardForeground: '#111412',
    primary: '#173F35',
    primaryForeground: '#ffffff',
    secondary: '#E8ECE7',
    secondaryForeground: '#173F35',
    muted: '#EBEDE7',
    mutedForeground: '#626861',
    accent: '#D8F35B',
    accentForeground: '#111412',
    destructive: '#B83A42',
    destructiveForeground: '#ffffff',
    border: '#DCDDD8',
    input: '#DCDDD8',
  },
  dark: {
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
    accent: '#D8F35B',
    accentForeground: '#111412',
    destructive: '#F07478',
    destructiveForeground: '#1D1111',
    border: '#303A33',
    input: '#303A33',
  },
  radius: 20,
};

export default colors;
