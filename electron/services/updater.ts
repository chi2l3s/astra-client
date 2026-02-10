import { autoUpdater } from 'electron-updater';
import type { BrowserWindow } from 'electron';

export const setupUpdater = (win: BrowserWindow | undefined) => {
  autoUpdater.on('checking-for-update', () => {
    win?.webContents.send('update-status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    win?.webContents.send('update-status', { status: 'available', info });
  });

  autoUpdater.on('update-not-available', (info) => {
    win?.webContents.send('update-status', { status: 'not-available', info });
  });

  autoUpdater.on('error', (err) => {
    win?.webContents.send('update-status', { status: 'error', error: err.toString() });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    win?.webContents.send('update-status', { status: 'progress', progress: progressObj.percent });
  });

  autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send('update-status', { status: 'downloaded', info });
  });
};

export const checkForUpdates = (isPackaged: boolean) => {
  if (isPackaged) {
    autoUpdater.checkForUpdatesAndNotify();
  }
};

export const restartToUpdate = () => {
  autoUpdater.quitAndInstall();
};
