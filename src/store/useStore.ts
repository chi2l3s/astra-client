import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Account, InstalledVersion, UserPreferences } from '../types';

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
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  accentColor: '#10B981',
  memoryAllocation: 4096,
  jvmArgs: '-Xmx4G -XX:+UseG1GC',
  windowWidth: 1280,
  windowHeight: 720,
  fullscreen: false,
  closeLauncherAfterStart: false
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

      setUser: (user) => set({ user }),
      addAccount: (account) => set((state) => ({ accounts: [...state.accounts, account] })),
      removeAccount: (accountId) => set((state) => ({ 
        accounts: state.accounts.filter(a => a.id !== accountId),
        activeAccount: state.activeAccount?.id === accountId ? null : state.activeAccount
      })),
      setActiveAccount: (accountId) => set((state) => ({ 
        activeAccount: state.accounts.find(a => a.id === accountId) || null,
        accounts: state.accounts.map(a => ({
          ...a,
          isActive: a.id === accountId
        }))
      })),
      setLoading: (loading) => set({ isLoading: loading }),
      setSelectedVersion: (versionId) => set({ selectedVersion: versionId }),
      
      updatePreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),

      startDownload: (versionId) => set((state) => ({
        downloads: {
          ...state.downloads,
          [versionId]: { versionId, progress: 0, status: 'downloading' }
        }
      })),

      updateDownloadProgress: (versionId, progress) => set((state) => ({
        downloads: {
          ...state.downloads,
          [versionId]: { ...state.downloads[versionId], progress }
        }
      })),

      completeDownload: (versionId) => {
        set((state) => {
          // Add to installed versions if not exists
          const isInstalled = state.installedVersions.some(v => v.id === versionId);
          let newInstalled = state.installedVersions;
          
          if (!isInstalled) {
            newInstalled = [...state.installedVersions, { 
              id: versionId, 
              type: 'release', 
              releaseTime: new Date().toISOString(), 
              url: '' 
            }];
          }

          // Remove from downloads
          const newDownloads = { ...state.downloads };
          delete newDownloads[versionId];

          return {
            installedVersions: newInstalled,
            downloads: newDownloads
          };
        });
      }
    }),
    {
      name: 'astra-storage', // unique name
      partialize: (state) => ({
        accounts: state.accounts,
        activeAccount: state.activeAccount,
        preferences: state.preferences,
        installedVersions: state.installedVersions,
        selectedVersion: state.selectedVersion
      }), // only persist these fields
    }
  )
);
