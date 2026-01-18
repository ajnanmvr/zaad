import { useEffect } from 'react';
import { useThemeStore } from '@/store';

/**
 * Hook to manage theme switching
 * Provides access to current theme and a function to change it
 * 
 * Usage:
 * const { theme, setTheme } = useTheme();
 * 
 * setTheme('dark');   // Force dark mode
 * setTheme('light');  // Force light mode
 * setTheme('system'); // Use system preference
 */
export function useTheme() {
  const { theme, setTheme } = useThemeStore();

  // Monitor system theme changes when system theme is selected
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(e.matches ? 'dark' : 'light');
    };

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  return { theme, setTheme };
}

/**
 * Hook to listen for theme changes
 * Useful for components that need to react to theme changes
 */
export function useThemeListener(callback: (theme: 'light' | 'dark' | 'system') => void) {
  const { theme } = useThemeStore();

  useEffect(() => {
    callback(theme);
  }, [theme, callback]);
}

/**
 * Get the current effective theme (light or dark)
 * Resolves 'system' to the actual system preference
 */
export function getEffectiveTheme(): 'light' | 'dark' {
  const root = document.documentElement;
  return root.classList.contains('dark') ? 'dark' : 'light';
}
