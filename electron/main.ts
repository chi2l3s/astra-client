import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { Client, Authenticator } from 'minecraft-launcher-core';
import fs from 'fs';
import { autoUpdater } from 'electron-updater';
const msmc = require("msmc");
const DiscordRPC = require('discord-rpc');

const clientId = '1470031346473635995'; // Example ID, should be replaced with your own application ID
let rpcClient: any;

const initRPC = () => {
  rpcClient = new DiscordRPC.Client({ transport: 'ipc' });
  
  rpcClient.on('ready', () => {
    setActivity('In Launcher', 'Browsing modpacks');
  });

  rpcClient.login({ clientId }).catch(console.error);
};

const setActivity = (state: string, details: string, startTimestamp?: number) => {
  if (!rpcClient) return;
  
  rpcClient.setActivity({
    details,
    state,
    startTimestamp: startTimestamp || Date.now(),
    largeImageKey: 'minecraft_icon', // Make sure you have this asset in your Discord App
    largeImageText: 'Astra Client',
    instance: false,
  });
};

const launcher = new Client();

process.env.DIST = path.join(__dirname, '../dist');
const DIST = process.env.DIST;
process.env.VITE_PUBLIC = app.isPackaged ? DIST : path.join(DIST, '../public');

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 640,
    frame: false, // Frameless window for custom UI
    backgroundColor: '#0A0A0B',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  // Auto Updater Events
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
    win?.webContents.send('update-status', { 
        status: 'progress', 
        progress: progressObj.percent 
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send('update-status', { status: 'downloaded', info });
  });

  // Check for updates once window is ready
  if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
  }

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  initRPC();
});

// IPC handlers
ipcMain.on('window-min', () => win?.minimize());
ipcMain.on('window-max', () => {
  if (win?.isMaximized()) {
    win.unmaximize();
  } else {
    win?.maximize();
  }
});
ipcMain.on('window-close', () => win?.close());

ipcMain.handle('login-microsoft', async (event) => {
  const win = BrowserWindow.getAllWindows()[0];
  try {
    const authManager = new msmc.Auth("select_account");
    const xboxManager = await authManager.launch("electron");
    const token = await xboxManager.getMinecraft();

    if (token) {
       // result is the user profile
       const profile = token.profile;
       
       // Check if user actually owns the game to prevent "Demo" accounts
       // msmc 5.x check:
       const entitlements = await msmc.McAPI.getEntitlements(token.mcToken);
       if (!entitlements || entitlements.items.length === 0) {
           return { error: "Аккаунт не имеет лицензии Minecraft Java Edition" };
       }

       return {
         success: true,
         account: {
           username: profile.name,
           uuid: profile.id,
           accessToken: token.mcToken, 
           type: 'microsoft'
         }
       };
    } else {
        return { error: "Authentication failed" };
    }
  } catch (err) {
    console.error("Auth Error:", err);
    return { error: err };
  }
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  const { shell } = require('electron');
  // If no path provided, open app data root
  const target = folderPath || path.join(app.getPath('appData'), '.astra-client');
  await shell.openPath(target);
  return true;
});

ipcMain.handle('get-installed-files', async (event, { versionId, folder = 'mods' }) => {
  const rootPath = path.join(app.getPath('appData'), '.astra-client', 'versions', versionId, folder);
  
  if (!fs.existsSync(rootPath)) {
    return [];
  }

  try {
    const files = fs.readdirSync(rootPath);
    return files.map(file => ({
      name: file,
      path: path.join(rootPath, file),
      size: fs.statSync(path.join(rootPath, file)).size
    }));
  } catch (error) {
    console.error('Get Installed Files Error:', error);
    return [];
  }
});

ipcMain.handle('get-screenshots', async (event, { versionId }) => {
  if (!versionId) return [];

  const screenshotsPath = path.join(app.getPath('appData'), '.astra-client', 'versions', versionId, 'screenshots');
  
  if (!fs.existsSync(screenshotsPath)) {
    return [];
  }

  try {
    const files = fs.readdirSync(screenshotsPath)
      .filter(file => file.endsWith('.png'))
      .map(file => {
        const fullPath = path.join(screenshotsPath, file);
        const stats = fs.statSync(fullPath);
        return {
          name: file,
          path: fullPath,
          date: stats.mtime,
          // Read file as base64 for display
          // Limit to recent 6 files to avoid memory issues with large lists
          data: `data:image/png;base64,${fs.readFileSync(fullPath).toString('base64')}`
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 6);

    return files;
  } catch (error) {
    console.error('Get Screenshots Error:', error);
    return [];
  }
});

ipcMain.on('open-file', async (event, filePath) => {
    const { shell } = require('electron');
    await shell.openPath(filePath);
});

ipcMain.on('delete-file', async (event, { filePath }) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Delete File Error:', error);
  }
});

ipcMain.on('open-version-folder', async (event, { versionId, folder = 'mods' }) => {
  const { shell } = require('electron');
  const target = path.join(app.getPath('appData'), '.astra-client', 'versions', versionId, folder);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  await shell.openPath(target);
});

ipcMain.on('install-mod', async (event, { url, filename, versionId, folder = 'mods' }) => {
  const win = BrowserWindow.getAllWindows()[0];
  // Create version specific directory based on folder type (mods, resourcepacks, saves)
  const rootPath = path.join(app.getPath('appData'), '.astra-client', 'versions', versionId, folder);

  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath, { recursive: true });
  }

  const filePath = path.join(rootPath, filename);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(buffer));
    
    win?.webContents.send('mod-installed', { success: true, filename });
  } catch (error) {
    console.error('Install Mod Error:', error);
    win?.webContents.send('mod-installed', { success: false, error: error });
  }
});

ipcMain.on('install-version', async (event, { version }) => {
  const win = BrowserWindow.getAllWindows()[0];
  const rootPath = path.join(app.getPath('appData'), '.astra-client', 'versions', version);

  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath, { recursive: true });
  }

  // Create a new client instance for this installation to avoid event conflicts
  const installLauncher = new Client();

  const opts = {
    clientPackage: undefined,
    // Use a dummy auth or offline auth since we just want to download
    authorization: await Authenticator.getAuth("Player"), 
    root: rootPath,
    version: {
      number: version,
      type: "release"
    },
    memory: {
      max: "1024",
      min: "512"
    },
    // Don't actually show window if possible, but launcher-core doesn't have headless
  }

  try {
    // Listen for progress
    installLauncher.on('progress', (e) => {
      win?.webContents.send('install-progress', { 
        version, 
        progress: Math.round(e.task / e.total * 100) 
      });
    });

    installLauncher.on('data', (e) => {
      // Game started producing output, meaning it's running
      // We can kill it now
      // But we need the child process reference
    });

    // Launch
    const child = await installLauncher.launch(opts);
    
    // If we got here, game process started. Kill it immediately.
    if (child) {
        child.kill();
    }

    win?.webContents.send('install-complete', { version });

  } catch (error) {
    console.error('Install Version Error:', error);
    win?.webContents.send('install-error', { version, error });
  }
});

ipcMain.on('launch-game', async (event, { version, auth, memory = 4096 }) => {
  const win = BrowserWindow.getAllWindows()[0];
  // Use version specific directory for game files too
  const rootPath = path.join(app.getPath('appData'), '.astra-client', 'versions', version);

  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath, { recursive: true });
  }

  const opts = {
    clientPackage: undefined,
    authorization: await Authenticator.getAuth(auth.username),
    root: rootPath,
    version: {
      number: version,
      type: "release"
    },
    memory: {
      max: memory.toString(),
      min: "2048"
    }
  }

  win?.webContents.send('game-log', `[LAUNCHER] Starting Minecraft ${version}...`);
  win?.webContents.send('game-log', `[LAUNCHER] Game directory: ${rootPath}`);

  // --- Auto Java Detection ---
  const { execSync } = require('child_process');
  
  const getJavaVersion = (javaPath: string) => {
    try {
      // Run java -version and parse stderr (java outputs version to stderr)
      const output = execSync(`"${javaPath}" -version 2>&1`).toString();
      // Match patterns like "version 17.0.1" or "version 1.8.0"
      const match = output.match(/version "(\d+(\.\d+)*)(_\d+)?"/);
      if (match && match[1]) {
        const v = match[1];
        if (v.startsWith('1.')) return parseInt(v.split('.')[1]); // 1.8 -> 8
        return parseInt(v.split('.')[0]); // 17.0 -> 17
      }
    } catch (e) {
      return 0;
    }
    return 0;
  };

  const findJava = () => {
    const commonPaths = [
      process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
      "C:\\Program Files\\Java\\jdk-21\\bin\\java.exe",
      "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.2.13-hotspot\\bin\\java.exe", // Example common path
      "C:\\Program Files\\Eclipse Adoptium\\jdk-21\\bin\\java.exe",
      "C:\\Program Files\\Java\\jdk-17\\bin\\java.exe",
      "C:\\Program Files\\Eclipse Adoptium\\jdk-17\\bin\\java.exe",
      "java" // System path
    ].filter(Boolean) as string[];

    // Define requirements
    // For 1.20.5+ we need Java 21
    // For 1.18+ we need Java 17
    // For older we need Java 8
    // Since we only really support modern versions in this example, let's prioritize 21 then 17.
    
    // Simplified Logic: Just find the highest available Java version
    let bestJava = "java";
    let maxVersion = 0;

    for (const p of commonPaths) {
      if (p === "java" || fs.existsSync(p)) {
        const v = getJavaVersion(p);
        if (v > maxVersion) {
          maxVersion = v;
          bestJava = p;
        }
      }
    }

    win?.webContents.send('game-log', `[LAUNCHER] Found Java ${maxVersion} at ${bestJava}`);
    return bestJava;
  };

  const detectedJava = findJava();

  // --- Auto Fabric Logic ---
  let fabricLoaderVersion = "0.16.10"; // Default fallback

  try {
    // Try to fetch latest compatible loader dynamically
    const metaResponse = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}`);
    if (metaResponse.ok) {
        const metaData = await metaResponse.json();
        if (metaData && metaData.length > 0 && metaData[0].loader && metaData[0].loader.version) {
            fabricLoaderVersion = metaData[0].loader.version;
            win?.webContents.send('game-log', `[LAUNCHER] Resolved latest Fabric Loader: ${fabricLoaderVersion}`);
        }
    }
  } catch (e) {
    console.warn("Failed to resolve dynamic fabric version, using default", e);
  }

  const fabricConfig = {
    loader: fabricLoaderVersion,
    game: version
  };
  
  // If we want to use Fabric, we pass custom version info to MCLC
  // However, MCLC needs the Fabric JSON to exist or we let it handle it via overrides if supported.
  // Simplest way with MCLC:
  // 1. If we know it's Fabric, we change version.custom to "fabric-loader-{loader}-{game}"
  // 2. BUT MCLC doesn't auto-download Fabric JSON. We must do it or rely on existing installation.
  
  // Let's implement a quick "Ensure Fabric" check.
  const versionsDir = path.join(rootPath, 'versions'); // Actually MCLC uses root/versions
  const fabricVersionId = `fabric-loader-${fabricConfig.loader}-${fabricConfig.game}`;
  const fabricJsonPath = path.join(rootPath, 'versions', fabricVersionId, `${fabricVersionId}.json`);
  
  let launchVersion = {
      number: version,
      type: "release" as "release" | "snapshot" | "old_beta" | "old_alpha"
  };

  try {
      // Check if we should use Fabric (simple heuristic: if we are launching a release version)
      if (!fs.existsSync(fabricJsonPath)) {
          win?.webContents.send('game-log', `[LAUNCHER] Fabric not found, attempting to install...`);
          const fabricUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${fabricConfig.loader}/profile/json`;
          const response = await fetch(fabricUrl);
          if (response.ok) {
              const json = await response.json();
              // Save it
              const fabricDir = path.join(rootPath, 'versions', fabricVersionId);
              if (!fs.existsSync(fabricDir)) fs.mkdirSync(fabricDir, { recursive: true });
              fs.writeFileSync(fabricJsonPath, JSON.stringify(json, null, 2));
              win?.webContents.send('game-log', `[LAUNCHER] Fabric installed: ${fabricVersionId}`);
              
              // Switch launch version to Fabric
              launchVersion = {
                  number: fabricVersionId,
                  type: "release"
              };
          } else {
             win?.webContents.send('game-log', `[LAUNCHER] Failed to fetch Fabric JSON. Launching Vanilla.`);
          }
      } else {
          // Fabric exists, use it
          win?.webContents.send('game-log', `[LAUNCHER] Using existing Fabric: ${fabricVersionId}`);
          launchVersion = {
              number: fabricVersionId,
              type: "release"
          };
      }
  } catch (e) {
      console.error("Fabric setup error:", e);
      win?.webContents.send('game-log', `[LAUNCHER] Error setting up Fabric: ${e}`);
  }

  try {
    const opts = {
      clientPackage: undefined,
      authorization: await Authenticator.getAuth(auth.username),
      root: rootPath,
      javaPath: detectedJava,
      version: {
        number: version, // Always point to the vanilla version for the JAR
        type: "release",
        ...(launchVersion.number !== version ? { custom: launchVersion.number } : {})
      },
      memory: {
        max: memory.toString(),
        min: "2048"
      }
    }

    launcher.launch(opts);
    
    setActivity('Playing Minecraft', `Version ${version}`, Date.now());

    launcher.on('debug', (e) => win?.webContents.send('game-log', `[DEBUG] ${e}`));
    launcher.on('data', (e) => win?.webContents.send('game-log', `[GAME] ${e}`));
    launcher.on('progress', (e) => win?.webContents.send('game-log', `[PROGRESS] ${e.type} - ${Math.round(e.task / e.total * 100)}%`));
    
    launcher.on('close', (e) => {
      win?.webContents.send('game-log', `[LAUNCHER] Game closed with code ${e}`);
      win?.webContents.send('game-exit', e);
      setActivity('In Launcher', 'Resting after mining');
    });

  } catch (error) {
    win?.webContents.send('game-log', `[ERROR] Failed to launch: ${error}`);
    win?.webContents.send('game-exit', 1);
  }
});

ipcMain.handle('save-theme', async (event, themeData) => {
  const { dialog } = require('electron');
  const win = BrowserWindow.getAllWindows()[0];
  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Сохранить тему',
    defaultPath: 'my-theme.json',
    filters: [{ name: 'Astra Theme', extensions: ['json'] }]
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
  const win = BrowserWindow.getAllWindows()[0];
  const { filePaths } = await dialog.showOpenDialog(win, {
    title: 'Загрузить тему',
    filters: [{ name: 'Astra Theme', extensions: ['json'] }],
    properties: ['openFile']
  });

  if (filePaths && filePaths.length > 0) {
    try {
      const content = fs.readFileSync(filePaths[0], 'utf-8');
      const themeData = JSON.parse(content);
      // Basic validation
      if (!themeData.theme || !themeData.accentColor) {
         throw new Error("Invalid theme file");
      }
      return { success: true, themeData };
    } catch (error) {
      console.error('Load Theme Error:', error);
      return { success: false, error };
    }
  }
  return { canceled: true };
});

ipcMain.handle('upload-skin', async (event, { token, skinData, variant = 'classic' }) => {
  if (!token) return { success: false, error: "Требуется лицензионный аккаунт" };

  try {
    // skinData is "data:image/png;base64,..."
    const base64Data = skinData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const formData = new FormData();
    formData.append('variant', variant);
    
    // Create a Blob from the buffer
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('file', blob, 'skin.png');

    const response = await fetch('https://api.minecraftservices.com/minecraft/profile/skins', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        // const err = await response.text();
        // console.error("Mojang Error Body:", err);
        throw new Error(`Ошибка Mojang API: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Upload Skin Error:', error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});

ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
});
