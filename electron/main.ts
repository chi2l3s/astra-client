import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, crashReporter } from 'electron';
import path from 'path';
import fs from 'fs';
import { setupUpdater, checkForUpdates, restartToUpdate } from './services/updater';
import { autoUpdater } from 'electron-updater';
import { loginMicrosoft, getAccessToken, clearToken } from './services/auth';
import {
  openAppData,
  openVersionFolder,
  openFile,
  deleteFile,
  listInstalledFiles,
  listScreenshots,
  installFromUrl,
} from './services/files';
import { installVersion, launchGame, detectJava } from './services/launcher';
import { importOfficialLauncherSettings } from './services/launcherSettings';
import { importModpack, exportModpack } from './services/modpack';
const DiscordRPC = require('discord-rpc');

const clientId = '1470031346473635995';
let rpcClient: any;

const initRPC = () => {
  rpcClient = new DiscordRPC.Client({ transport: 'ipc' });
  rpcClient.on('ready', () => {
    setActivity('In Launcher', 'Browsing modpacks');
  });
  rpcClient.login({ clientId }).catch(() => {});
};

const setActivity = (state: string, details: string, startTimestamp?: number) => {
  if (!rpcClient) return;
  rpcClient.setActivity({
    details,
    state,
    startTimestamp: startTimestamp || Date.now(),
    largeImageKey: 'minecraft_icon',
    largeImageText: 'Astra Client',
    instance: false,
  });
};

process.env.DIST = path.join(__dirname, '../dist');
const DIST = process.env.DIST;
process.env.VITE_PUBLIC = app.isPackaged ? DIST : path.join(DIST, '../public');

let win: BrowserWindow | null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
let tray: Tray | null = null;
let isQuitting = false;
let lastUpdateCheck = 0;
let crashReporterStarted = false;
let currentPreferences = {
  updateChannel: 'stable',
  autoUpdates: true,
  startOnBoot: false,
  minimizeToTray: true,
  crashReports: true,
  telemetry: false,
};

const getTrayIconPath = () => {
  const publicDir = process.env.VITE_PUBLIC || path.join(__dirname, '../public');
  const candidate = path.join(publicDir, 'logo.png');
  if (fs.existsSync(candidate)) return candidate;
  const fallback = path.join(process.resourcesPath, 'public', 'logo.png');
  if (fs.existsSync(fallback)) return fallback;
  return candidate;
};

const ensureTray = () => {
  if (tray) return;
  const iconPath = getTrayIconPath();
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Показать', click: () => showWindow() },
    { type: 'separator' },
    {
      label: 'Выход',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip('Astra Client');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => showWindow());
};

const destroyTray = () => {
  if (!tray) return;
  tray.destroy();
  tray = null;
};

const showWindow = () => {
  if (!win) return;
  if (process.platform === 'darwin') {
    app.dock.show();
  }
  win.show();
  win.focus();
};

const applyPreferences = (prefs: Partial<typeof currentPreferences>) => {
  currentPreferences = { ...currentPreferences, ...prefs };

  if (typeof currentPreferences.startOnBoot === 'boolean') {
    app.setLoginItemSettings({
      openAtLogin: currentPreferences.startOnBoot,
      openAsHidden: Boolean(currentPreferences.minimizeToTray),
    });
  }

  if (currentPreferences.minimizeToTray) {
    ensureTray();
  } else {
    destroyTray();
  }

  if (typeof currentPreferences.updateChannel === 'string') {
    autoUpdater.allowPrerelease = currentPreferences.updateChannel === 'beta';
  }

  if (typeof currentPreferences.autoUpdates === 'boolean') {
    autoUpdater.autoDownload = currentPreferences.autoUpdates;
    const now = Date.now();
    if (currentPreferences.autoUpdates && app.isPackaged && now - lastUpdateCheck > 5 * 60 * 1000) {
      lastUpdateCheck = now;
      checkForUpdates(true);
    }
  }

  if (currentPreferences.crashReports && !crashReporterStarted) {
    crashReporter.start({
      submitURL: 'https://example.com/crash',
      uploadToServer: false,
      compress: true,
      extra: { telemetry: String(Boolean(currentPreferences.telemetry)) },
    });
    crashReporterStarted = true;
  }
};

const createWindow = () => {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 640,
    frame: false,
    backgroundColor: '#0A0A0B',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  setupUpdater(win);
  if (currentPreferences.autoUpdates) {
    checkForUpdates(app.isPackaged);
  }

  if (process.env.NODE_ENV === 'development') {
    const devUrl = VITE_DEV_SERVER_URL || 'http://localhost:5173';
    win.loadURL(devUrl);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(DIST, 'index.html'));
  }

  win.on('close', (event) => {
    if (currentPreferences.minimizeToTray && !isQuitting) {
      event.preventDefault();
      win?.hide();
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.whenReady().then(() => {
  createWindow();
  initRPC();
  applyPreferences(currentPreferences);
});

app.on('before-quit', () => {
  isQuitting = true;
  destroyTray();
});

ipcMain.on('window-min', () => win?.minimize());
ipcMain.on('window-max', () => (win?.isMaximized() ? win.unmaximize() : win?.maximize()));
ipcMain.on('window-close', () => win?.close());

ipcMain.handle('login-microsoft', async () => loginMicrosoft());
ipcMain.handle('logout-microsoft', async (_event, { accountId }) => {
  clearToken(accountId);
  return true;
});

ipcMain.handle('open-app-data', async () => openAppData(app));

ipcMain.handle('get-installed-files', async (_event, { versionId, folder = 'mods' }) => {
  try {
    return listInstalledFiles(app, versionId, folder);
  } catch {
    return [];
  }
});

ipcMain.handle('get-screenshots', async (_event, { versionId }) => {
  try {
    return listScreenshots(app, versionId);
  } catch {
    return [];
  }
});

ipcMain.handle('open-file', async (_event, { filePath }) => {
  try {
    await openFile(app, filePath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('delete-file', async (_event, { filePath }) => {
  try {
    return deleteFile(app, filePath);
  } catch {
    return false;
  }
});

ipcMain.handle('open-version-folder', async (_event, { versionId, folder = 'mods' }) => {
  try {
    return await openVersionFolder(app, versionId, folder);
  } catch {
    return false;
  }
});

ipcMain.handle('install-mod', async (_event, { url, filename, versionId, folder = 'mods' }) => {
  const currentWin = BrowserWindow.getAllWindows()[0];
  try {
    const result = await installFromUrl(app, { url, filename, versionId, folder });
    currentWin?.webContents.send('mod-installed', { success: true, filename });
    return result;
  } catch (error: any) {
    currentWin?.webContents.send('mod-installed', { success: false, error: error?.message || 'Install failed' });
    return { success: false };
  }
});

ipcMain.handle('install-version', async (_event, { version }) => {
  const currentWin = BrowserWindow.getAllWindows()[0];
  try {
    await installVersion(app, currentWin, { version });
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('launch-game', async (_event, payload) => {
  const currentWin = BrowserWindow.getAllWindows()[0];
  const { version, username, memory, javaPath, jvmArgs, closeLauncherAfterStart } = payload || {};
  if (typeof version !== 'string' || typeof username !== 'string') return false;
  try {
    await launchGame(app, currentWin, {
      version,
      username,
      memory: Number(memory) || 4096,
      javaPath,
      jvmArgs,
      closeLauncherAfterStart: Boolean(closeLauncherAfterStart),
    });
    setActivity('Playing Minecraft', `Version ${version}`, Date.now());
    return true;
  } catch {
    currentWin?.webContents.send('game-exit', 1);
    return false;
  }
});

ipcMain.handle('save-theme', async (_event, themeData) => {
  const { dialog } = require('electron');
  const currentWin = BrowserWindow.getAllWindows()[0];
  const { filePath } = await dialog.showSaveDialog(currentWin, {
    title: 'Сохранить тему',
    defaultPath: 'my-theme.json',
    filters: [{ name: 'Astra Theme', extensions: ['json'] }],
  });

  if (filePath) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(themeData, null, 2));
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }
  return { canceled: true };
});

ipcMain.handle('load-theme', async () => {
  const { dialog } = require('electron');
  const currentWin = BrowserWindow.getAllWindows()[0];
  const { filePaths } = await dialog.showOpenDialog(currentWin, {
    title: 'Загрузить тему',
    filters: [{ name: 'Astra Theme', extensions: ['json'] }],
    properties: ['openFile'],
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8');
      const themeData = JSON.parse(content);
      if (!themeData.theme || !themeData.accentColor) {
        throw new Error('Invalid theme file');
      }
      return { success: true, themeData };
    } catch (error) {
      return { success: false, error };
    }
  }
  return { canceled: true };
});

ipcMain.handle('upload-skin', async (_event, { accountId, skinData, variant = 'classic' }) => {
  const token = getAccessToken(accountId);
  if (!token) return { success: false, error: 'Требуется лицензионный аккаунт' };

  try {
    const base64Data = skinData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const formData = new FormData();
    formData.append('variant', variant);
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('file', blob, 'skin.png');

    const response = await fetch('https://api.minecraftservices.com/minecraft/profile/skins', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Ошибка Mojang API: ${response.statusText}`);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error' };
  }
});

ipcMain.handle('restart-app', async () => {
  restartToUpdate();
  return true;
});

ipcMain.handle('settings-update', async (_event, prefs) => {
  if (!prefs || typeof prefs !== 'object') return false;
  applyPreferences({
    updateChannel: prefs.updateChannel,
    autoUpdates: prefs.autoUpdates,
    startOnBoot: prefs.startOnBoot,
    minimizeToTray: prefs.minimizeToTray,
    crashReports: prefs.crashReports,
    telemetry: prefs.telemetry,
  });
  return true;
});

ipcMain.handle('java-detect', async (_event, { preferred }) => {
  try {
    const result = detectJava(preferred);
    return { success: true, ...result };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Detect failed' };
  }
});

ipcMain.handle('java-download', async () => {
  const { shell } = require('electron');
  await shell.openExternal('https://adoptium.net/temurin/releases/?version=17');
  return true;
});

ipcMain.handle('launcher-import-settings', async () => {
  try {
    const data = importOfficialLauncherSettings(app);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Import failed' };
  }
});

ipcMain.handle('modpack-import', async (_event, { versionId }) => {
  const { dialog } = require('electron');
  const currentWin = BrowserWindow.getAllWindows()[0];
  const { filePaths } = await dialog.showOpenDialog(currentWin, {
    title: 'Импорт модпака',
    filters: [{ name: 'Modpack', extensions: ['mrpack', 'zip'] }],
    properties: ['openFile'],
  });
  if (!filePaths || filePaths.length === 0) return { canceled: true };
  try {
    return await importModpack(app, versionId, filePaths[0]);
  } catch (error: any) {
    return { success: false, error: error?.message || 'Import failed' };
  }
});

ipcMain.handle('modpack-export', async (_event, { versionId }) => {
  const { dialog } = require('electron');
  const currentWin = BrowserWindow.getAllWindows()[0];
  const { filePath } = await dialog.showSaveDialog(currentWin, {
    title: 'Экспорт модпака',
    defaultPath: `modpack-${versionId}.zip`,
    filters: [{ name: 'ZIP', extensions: ['zip'] }],
  });
  if (!filePath) return { canceled: true };
  try {
    return await exportModpack(app, versionId, filePath);
  } catch (error: any) {
    return { success: false, error: error?.message || 'Export failed' };
  }
});
