export interface User {
  id: string;
  email: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'green' | 'red' | 'blue' | 'purple' | 'orange';
  accentColor: string;
  javaPath?: string;
  memoryAllocation: number;
  jvmArgs?: string;
  gameDirectory?: string;
  windowWidth: number;
  windowHeight: number;
  fullscreen: boolean;
  closeLauncherAfterStart: boolean;
  performancePreset: 'potato' | 'balanced' | 'ultra' | 'custom';
  language: 'ru' | 'en';
  autoUpdates: boolean;
  updateChannel: 'stable' | 'beta';
  startOnBoot: boolean;
  minimizeToTray: boolean;
  reduceMotion: boolean;
  enableSounds: boolean;
  showNews: boolean;
  telemetry: boolean;
  crashReports: boolean;
  uiFont: 'default' | 'mono' | 'rounded' | 'serif';
  uiDensity: 'compact' | 'comfortable' | 'spacious';
}

export interface LaunchProfile {
  id: string;
  name: string;
  versionId: string;
  memoryAllocation: number;
  jvmArgs?: string;
  javaPath?: string;
  lastUsedAt?: string;
}

export interface Server {
  id: string;
  name: string;
  ip: string;
  icon?: string;
  lastPlayed?: string;
}

export interface PlayStats {
  totalPlayTime: number;
  launchCount: number;
  lastSessionDuration: number;
  lastPlayedDate: string;
}

export interface Account {
  id: string;
  type: 'offline' | 'microsoft';
  username: string;
  uuid: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface MinecraftVersion {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  time: string;
  releaseTime: string;
}

export interface InstalledVersion {
  id: string;
  type: string;
  installDate: string;
  lastPlayed?: string;
}

export interface Mod {
  id: string;
  name: string;
  version: string;
  fileName: string;
  isEnabled: boolean;
  description?: string;
}
