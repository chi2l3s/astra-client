import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';

export const PreferencesBridge: React.FC = () => {
  const preferences = useStore((s) => s.preferences);

  useEffect(() => {
    if (!window.astra?.settings?.update) return;
    window.astra.settings.update(preferences);
  }, [preferences]);

  return null;
};
