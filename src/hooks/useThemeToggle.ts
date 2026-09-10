export const useThemeToggle = () => {
  return {
    theme: 'light' as const,
    isDark: false,
    toggleTheme: () => {},
    getToggleLabel: () => 'نهاري',
    getToggleIcon: () => '☀️',
  };
};
