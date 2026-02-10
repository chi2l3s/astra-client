import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';

export const ThemeManager: React.FC = () => {
  const { preferences } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', preferences.theme);
    root.setAttribute('data-reduce-motion', preferences.reduceMotion ? 'true' : 'false');
    root.setAttribute('lang', preferences.language);

    if (preferences.accentColor) {
      const rgb = hexToRgb(preferences.accentColor);
      if (rgb) {
        root.style.setProperty('--color-primary', `${rgb.r} ${rgb.g} ${rgb.b}`);
        root.style.setProperty('--color-primary-hover', `${Math.max(0, rgb.r - 30)} ${Math.max(0, rgb.g - 30)} ${Math.max(0, rgb.b - 30)}`);
        root.style.setProperty('--color-brand-solid', `${rgb.r} ${rgb.g} ${rgb.b}`);
      }
    }
  }, [preferences.theme, preferences.accentColor, preferences.reduceMotion, preferences.language]);

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  return null;
};
