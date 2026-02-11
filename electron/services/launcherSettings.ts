import fs from 'fs';
import path from 'path';
import type { App } from 'electron';

export const importOfficialLauncherSettings = (app: App) => {
  const appData = app.getPath('appData');
  const mcPath = path.join(appData, '.minecraft');
  const profilesPath = path.join(mcPath, 'launcher_profiles.json');
  if (!fs.existsSync(profilesPath)) {
    throw new Error('launcher_profiles.json not found');
  }

  const raw = fs.readFileSync(profilesPath, 'utf-8');
  const data = JSON.parse(raw);
  const profiles = data?.profiles || {};
  const selected = data?.selectedProfile && profiles[data.selectedProfile] ? data.selectedProfile : Object.keys(profiles)[0];
  const profile = selected ? profiles[selected] : null;

  return {
    javaArgs: profile?.javaArgs || '',
    resolution: profile?.resolution || null,
    lastVersionId: profile?.lastVersionId || '',
    gameDir: profile?.gameDir || '',
  };
};
