export interface AstraAPI {
  platform: string;
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  auth: {
    loginMicrosoft: () => Promise<any>;
    logoutMicrosoft: (accountId: string) => Promise<boolean>;
  };
  folders: {
    openAppData: () => Promise<boolean>;
    openVersionFolder: (versionId: string, folder: string) => Promise<boolean>;
  };
  files: {
    listInstalled: (versionId: string, folder: string) => Promise<any[]>;
    listScreenshots: (versionId: string) => Promise<any[]>;
    installFromUrl: (params: { url: string; filename: string; versionId: string; folder: string }) => Promise<any>;
    openFile: (filePath: string) => Promise<boolean>;
    deleteFile: (filePath: string) => Promise<boolean>;
  };
  game: {
    installVersion: (version: string) => Promise<boolean>;
    launch: (payload: any) => Promise<boolean>;
    onLog: (handler: (log: string) => void) => () => void;
    onExit: (handler: (code: number) => void) => () => void;
    onInstallProgress: (handler: (data: { version: string; progress: number }) => void) => () => void;
    onInstallComplete: (handler: (data: { version: string }) => void) => () => void;
  };
  updates: {
    onStatus: (handler: (data: any) => void) => () => void;
    restart: () => Promise<boolean>;
  };
  settings: {
    update: (prefs: any) => Promise<boolean>;
  };
  java: {
    detect: (preferred?: string) => Promise<any>;
    download: () => Promise<boolean>;
  };
  launchers: {
    importSettings: () => Promise<any>;
  };
  modpack: {
    import: (versionId: string) => Promise<any>;
    export: (versionId: string) => Promise<any>;
  };
  theme: {
    save: (themeData: any) => Promise<any>;
    load: () => Promise<any>;
  };
  skins: {
    upload: (payload: { accountId: string; skinData: string; variant: 'classic' | 'slim' }) => Promise<any>;
  };
}

declare global {
  interface Window {
    astra?: AstraAPI;
    electron?: {
      ipcRenderer?: {
        send?: (channel: string, data?: any) => void;
      };
    };
  }
}
