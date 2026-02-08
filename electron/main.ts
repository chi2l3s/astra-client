import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { Client, Authenticator } from 'minecraft-launcher-core';
import fs from 'fs';
const msmc = require("msmc");

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

app.whenReady().then(createWindow);

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
  // If there are mods, we likely need Fabric.
  // In a real app, you'd check if the user selected "Fabric" explicitly.
  // Here, we'll try to use Fabric if the version folder has mods, OR simply default to installing Fabric for this version.
  
  // Construct Fabric config
  const fabricConfig = {
    loader: "0.15.7", // hardcoded latest stable for now, ideally fetch dynamically
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
        number: launchVersion.number,
        type: "release",
        custom: launchVersion.number // Critical for MCLC to pick up the custom JSON
      },
      memory: {
        max: memory.toString(),
        min: "2048"
      }
    }

    launcher.launch(opts);

    launcher.on('debug', (e) => win?.webContents.send('game-log', `[DEBUG] ${e}`));
    launcher.on('data', (e) => win?.webContents.send('game-log', `[GAME] ${e}`));
    launcher.on('progress', (e) => win?.webContents.send('game-log', `[PROGRESS] ${e.type} - ${Math.round(e.task / e.total * 100)}%`));
    
    launcher.on('close', (e) => {
      win?.webContents.send('game-log', `[LAUNCHER] Game closed with code ${e}`);
      win?.webContents.send('game-exit', e);
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
