import { contextBridge, ipcRenderer } from 'electron';

type Unsubscribe = () => void;

const on = (channel: string, handler: (...args: any[]) => void): Unsubscribe => {
  const subscription = (_event: any, ...args: any[]) => handler(...args);
  ipcRenderer.on(channel, subscription);
  return () => ipcRenderer.removeListener(channel, subscription);
};

contextBridge.exposeInMainWorld('astra', {
  platform: process.platform,
  window: {
    minimize: () => ipcRenderer.send('window-min'),
    maximize: () => ipcRenderer.send('window-max'),
    close: () => ipcRenderer.send('window-close'),
  },
  auth: {
    loginMicrosoft: () => ipcRenderer.invoke('login-microsoft'),
    logoutMicrosoft: (accountId: string) => ipcRenderer.invoke('logout-microsoft', { accountId }),
  },
  folders: {
    openAppData: () => ipcRenderer.invoke('open-app-data'),
    openVersionFolder: (versionId: string, folder: string) =>
      ipcRenderer.invoke('open-version-folder', { versionId, folder }),
  },
  files: {
    listInstalled: (versionId: string, folder: string) =>
      ipcRenderer.invoke('get-installed-files', { versionId, folder }),
    listScreenshots: (versionId: string) => ipcRenderer.invoke('get-screenshots', { versionId }),
    installFromUrl: (params: { url: string; filename: string; versionId: string; folder: string }) =>
      ipcRenderer.invoke('install-mod', params),
    openFile: (filePath: string) => ipcRenderer.invoke('open-file', { filePath }),
    deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', { filePath }),
  },
  game: {
    installVersion: (version: string) => ipcRenderer.invoke('install-version', { version }),
    launch: (payload: any) => ipcRenderer.invoke('launch-game', payload),
    onLog: (handler: (log: string) => void) => on('game-log', handler),
    onExit: (handler: (code: number) => void) => on('game-exit', handler),
    onInstallProgress: (handler: (data: { version: string; progress: number }) => void) =>
      on('install-progress', handler),
    onInstallComplete: (handler: (data: { version: string }) => void) => on('install-complete', handler),
  },
  updates: {
    onStatus: (handler: (data: any) => void) => on('update-status', handler),
    restart: () => ipcRenderer.invoke('restart-app'),
  },
  settings: {
    update: (prefs: any) => ipcRenderer.invoke('settings-update', prefs),
  },
  theme: {
    save: (themeData: any) => ipcRenderer.invoke('save-theme', themeData),
    load: () => ipcRenderer.invoke('load-theme'),
  },
  skins: {
    upload: (payload: { accountId: string; skinData: string; variant: 'classic' | 'slim' }) =>
      ipcRenderer.invoke('upload-skin', payload),
  },
});

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, data?: any) => {
      if (channel === 'window-min' || channel === 'window-max' || channel === 'window-close') {
        ipcRenderer.send(channel, data);
      }
    },
  },
});
