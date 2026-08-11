import { useTheme } from '../contexts/ThemeContext';

export const useThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  const getToggleLabel = () => {
    return isDark ? 'نهاري' : 'ليلي';
  };

  const getToggleIcon = () => {
    return isDark ? '☀️' : '🌙';
  };

  return {
    theme,
    isDark,
    toggleTheme,
    getToggleLabel,
    getToggleIcon,
  };
};
