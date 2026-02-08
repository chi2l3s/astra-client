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
}

export interface Server {
  id: string;
  name: string;
  ip: string;
  icon?: string;
  lastPlayed?: string;
}

export interface PlayStats {
  totalPlayTime: number; // in minutes
  launchCount: number;
  lastSessionDuration: number; // in minutes
  lastPlayedDate: string;
}

export interface Account {
  id: string;
  type: 'offline' | 'microsoft';
  username: string;
  uuid: string;
  avatarUrl?: string;
  isActive: boolean;
  accessToken?: string;
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
