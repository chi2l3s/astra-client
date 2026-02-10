import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Account, InstalledVersion, UserPreferences, Server, PlayStats } from '../types';

interface DownloadStatus {
  versionId: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
}

interface AppState {
  user: User | null;
  accounts: Account[];
  activeAccount: Account | null;
  installedVersions: InstalledVersion[];
  selectedVersion: string | null;
  isLoading: boolean;
  preferences: UserPreferences;
  downloads: Record<string, DownloadStatus>;
  servers: Server[];
  playStats: PlayStats;

  setUser: (user: User | null) => void;
  addAccount: (account: Account) => void;
  removeAccount: (accountId: string) => void;
  setActiveAccount: (accountId: string) => void;
  setLoading: (loading: boolean) => void;
  setSelectedVersion: (versionId: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  startDownload: (versionId: string) => void;
  updateDownloadProgress: (versionId: string, progress: number) => void;
  completeDownload: (versionId: string) => void;

  addServer: (server: Server) => void;
  removeServer: (serverId: string) => void;
  recordSession: (duration: number) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  accentColor: '#10B981',
  memoryAllocation: 4096,
  jvmArgs: '-Xmx4G -XX:+UseG1GC',
  windowWidth: 1280,
  windowHeight: 720,
  fullscreen: false,
  closeLauncherAfterStart: false,
  performancePreset: 'balanced',
  language: 'ru',
  autoUpdates: true,
  updateChannel: 'stable',
  startOnBoot: false,
  minimizeToTray: true,
  reduceMotion: false,
  enableSounds: true,
  showNews: true,
  telemetry: false,
  crashReports: true,
};

const DEFAULT_STATS: PlayStats = {
  totalPlayTime: 0,
  launchCount: 0,
  lastSessionDuration: 0,
  lastPlayedDate: new Date().toISOString(),
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],
      activeAccount: null,
      installedVersions: [],
      selectedVersion: null,
      isLoading: false,
      preferences: DEFAULT_PREFERENCES,
      downloads: {},
      servers: [],
      playStats: DEFAULT_STATS,

      setUser: (user) => set({ user }),
      addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
      removeAccount: (accountId) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== accountId),
          activeAccount: state.activeAccount?.id === accountId ? null : state.activeAccount,
        })),
      setActiveAccount: (accountId) =>
        set((state) => ({
          activeAccount: state.accounts.find((a) => a.id === accountId) || null,
          accounts: state.accounts.map((a) => ({
            ...a,
            isActive: a.id === accountId,
          })),
        })),
      setLoading: (loading) => set({ isLoading: loading }),
      setSelectedVersion: (versionId) => set({ selectedVersion: versionId }),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      startDownload: (versionId) =>
        set((state) => ({
          downloads: {
            ...state.downloads,
            [versionId]: { versionId, progress: 0, status: 'downloading' },
          },
        })),

      updateDownloadProgress: (versionId, progress) =>
        set((state) => ({
          downloads: {
            ...state.downloads,
            [versionId]: { ...state.downloads[versionId], progress },
          },
        })),

      completeDownload: (versionId) => {
        set((state) => {
          const isInstalled = state.installedVersions.some((v) => v.id === versionId);
          let newInstalled = state.installedVersions;

          if (!isInstalled) {
            newInstalled = [
              ...state.installedVersions,
              {
                id: versionId,
                type: 'release',
                installDate: new Date().toISOString(),
              },
            ];
          }

          const newDownloads = { ...state.downloads };
          delete newDownloads[versionId];

          return {
            installedVersions: newInstalled,
            downloads: newDownloads,
          };
        });
      },

      addServer: (server) => set((state) => ({ servers: [...state.servers, server] })),
      removeServer: (serverId) => set((state) => ({ servers: state.servers.filter((s) => s.id !== serverId) })),

      recordSession: (duration) =>
        set((state) => ({
          playStats: {
            totalPlayTime: state.playStats.totalPlayTime + duration,
            launchCount: state.playStats.launchCount + 1,
            lastSessionDuration: duration,
            lastPlayedDate: new Date().toISOString(),
          },
        })),
    }),
    {
      name: 'astra-storage',
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccount: state.activeAccount,
        preferences: state.preferences,
        installedVersions: state.installedVersions,
        selectedVersion: state.selectedVersion,
        servers: state.servers,
        playStats: state.playStats,
      }),
    }
  )
);
