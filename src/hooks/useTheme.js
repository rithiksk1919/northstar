// hooks/useTheme.js
import { useState, useEffect } from 'react';

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ns_theme') || localStorage.getItem('northstar_theme');
      if (saved !== null) return saved === 'dark';
    }
    return true; // Default high-contrast dark theme fallback
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('ns_theme', 'dark');
      localStorage.setItem('northstar_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('ns_theme', 'light');
      localStorage.setItem('northstar_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return { isDarkMode, toggleTheme };
}
