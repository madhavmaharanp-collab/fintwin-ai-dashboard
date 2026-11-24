import colors from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

export function useColors() {
  const { scheme } = useTheme();
  const palette = colors[scheme];
  return { ...palette, radius: colors.radius };
}
