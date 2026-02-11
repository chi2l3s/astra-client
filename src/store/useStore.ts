import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Account, InstalledVersion, UserPreferences, Server, PlayStats, LaunchProfile } from '../types';

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
  profiles: LaunchProfile[];
  activeProfileId: string | null;
  lastProfileId: string | null;
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
  addProfile: (profile: LaunchProfile) => void;
  updateProfile: (profileId: string, patch: Partial<LaunchProfile>) => void;
  removeProfile: (profileId: string) => void;
  setActiveProfile: (profileId: string) => void;
  setLastProfile: (profileId: string) => void;
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
  uiFont: 'default',
  uiDensity: 'comfortable',
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
      profiles: [
        {
          id: 'default',
          name: 'Default',
          versionId: 'latest',
          memoryAllocation: DEFAULT_PREFERENCES.memoryAllocation,
          jvmArgs: DEFAULT_PREFERENCES.jvmArgs,
          javaPath: DEFAULT_PREFERENCES.javaPath,
        },
      ],
      activeProfileId: 'default',
      lastProfileId: null,
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
      setSelectedVersion: (versionId) =>
        set((state) => ({
          selectedVersion: versionId,
          profiles: state.profiles.map((p) =>
            p.id === state.activeProfileId ? { ...p, versionId } : p
          ),
        })),

      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      addProfile: (profile) =>
        set((state) => ({
          profiles: [...state.profiles, profile],
        })),
      updateProfile: (profileId, patch) =>
        set((state) => {
          const updatedProfiles = state.profiles.map((p) => (p.id === profileId ? { ...p, ...patch } : p));
          const shouldUpdateVersion = state.activeProfileId === profileId && typeof patch.versionId === 'string';
          return {
            profiles: updatedProfiles,
            selectedVersion: shouldUpdateVersion && patch.versionId !== 'latest' ? patch.versionId : state.selectedVersion,
          };
        }),
      removeProfile: (profileId) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== profileId),
          activeProfileId: state.activeProfileId === profileId ? 'default' : state.activeProfileId,
        })),
      setActiveProfile: (profileId) =>
        set((state) => {
          const profile = state.profiles.find((p) => p.id === profileId);
          return {
            activeProfileId: profileId,
            selectedVersion: profile?.versionId && profile.versionId !== 'latest' ? profile.versionId : state.selectedVersion,
          };
        }),
      setLastProfile: (profileId) => set({ lastProfileId: profileId }),

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
