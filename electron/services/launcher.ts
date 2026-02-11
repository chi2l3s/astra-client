import fs from 'fs';
import path from 'path';
import { Client, Authenticator } from 'minecraft-launcher-core';
import type { App, BrowserWindow } from 'electron';
import { ensureVersionRoot } from './files';
import { getVersionRoot } from './paths';

type LaunchOptions = {
  version: string;
  username: string;
  memory: number;
  javaPath?: string;
  jvmArgs?: string;
  closeLauncherAfterStart?: boolean;
};

type InstallOptions = { version: string };

const getJavaVersion = (javaPath: string) => {
  try {
    const { execSync } = require('child_process');
    const output = execSync(`"${javaPath}" -version 2>&1`).toString();
    const match = output.match(/version "(\d+(\.\d+)*)(_\d+)?"/);
    if (match && match[1]) {
      const v = match[1];
      if (v.startsWith('1.')) return parseInt(v.split('.')[1]);
      return parseInt(v.split('.')[0]);
    }
  } catch {
    return 0;
  }
  return 0;
};

const findBestJava = (preferred?: string) => {
  const candidates = [
    preferred || null,
    process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
    'C:\\Program Files\\Java\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.2.13-hotspot\\bin\\java.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21\\bin\\java.exe',
    'C:\\Program Files\\Java\\jdk-17\\bin\\java.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-17\\bin\\java.exe',
    'java',
  ].filter(Boolean) as string[];

  let bestJava = 'java';
  let maxVersion = 0;

  for (const p of candidates) {
    if (p === 'java' || fs.existsSync(p)) {
      const v = getJavaVersion(p);
      if (v > maxVersion) {
        maxVersion = v;
        bestJava = p;
      }
    }
  }

  return { javaPath: bestJava, javaVersion: maxVersion };
};

export const detectJava = (preferred?: string) => {
  return findBestJava(preferred);
};

const resolveFabric = async (rootPath: string, version: string, win?: BrowserWindow) => {
  let fabricLoaderVersion = '0.16.10';

  try {
    const metaResponse = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}`);
    if (metaResponse.ok) {
      const metaData = await metaResponse.json();
      if (metaData && metaData.length > 0 && metaData[0].loader?.version) {
        fabricLoaderVersion = metaData[0].loader.version;
      }
    }
  } catch {
  }

  const fabricVersionId = `fabric-loader-${fabricLoaderVersion}-${version}`;
  const fabricJsonPath = path.join(rootPath, 'versions', fabricVersionId, `${fabricVersionId}.json`);

  if (fs.existsSync(fabricJsonPath)) {
    return fabricVersionId;
  }

  try {
    const fabricUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${fabricLoaderVersion}/profile/json`;
    const response = await fetch(fabricUrl);
    if (response.ok) {
      const json = await response.json();
      const fabricDir = path.join(rootPath, 'versions', fabricVersionId);
      if (!fs.existsSync(fabricDir)) fs.mkdirSync(fabricDir, { recursive: true });
      fs.writeFileSync(fabricJsonPath, JSON.stringify(json, null, 2));
      return fabricVersionId;
    }
  } catch {
  }

  win?.webContents.send('game-log', `[LAUNCHER] Fabric not available, launching vanilla.`);
  return version;
};

export const installVersion = async (app: App, win: BrowserWindow | undefined, options: InstallOptions) => {
  const { version } = options;
  const rootPath = ensureVersionRoot(app, version);
  const installLauncher = new Client();

  const opts = {
    clientPackage: undefined,
    authorization: await Authenticator.getAuth('Player'),
    root: rootPath,
    version: { number: version, type: 'release' },
    memory: { max: '1024', min: '512' },
  };

  return new Promise<void>(async (resolve, reject) => {
    installLauncher.on('progress', (e) => {
      win?.webContents.send('install-progress', {
        version,
        progress: Math.round((e.task / e.total) * 100),
      });
    });

    try {
      const child = await installLauncher.launch(opts);
      if (child) child.kill();
      win?.webContents.send('install-complete', { version });
      resolve();
    } catch (error) {
      win?.webContents.send('install-error', { version, error: `${error}` });
      reject(error);
    }
  });
};

export const launchGame = async (app: App, win: BrowserWindow | undefined, opts: LaunchOptions) => {
  const rootPath = getVersionRoot(app, opts.version);
  if (!fs.existsSync(rootPath)) {
    fs.mkdirSync(rootPath, { recursive: true });
  }

  const launcher = new Client();

  const { javaPath, javaVersion } = findBestJava(opts.javaPath);
  win?.webContents.send('game-log', `[LAUNCHER] Found Java ${javaVersion} at ${javaPath}`);

  const fabricVersionId = await resolveFabric(rootPath, opts.version, win);
  const customVersion = fabricVersionId !== opts.version ? fabricVersionId : undefined;

  if (opts.closeLauncherAfterStart) {
    win?.hide();
  }

  const launchOpts: any = {
    clientPackage: undefined,
    authorization: await Authenticator.getAuth(opts.username),
    root: rootPath,
    javaPath,
    version: {
      number: opts.version,
      type: 'release',
      ...(customVersion ? { custom: customVersion } : {}),
    },
    memory: {
      max: opts.memory.toString(),
      min: '2048',
    },
  };

  if (opts.jvmArgs) {
    launchOpts.javaArgs = opts.jvmArgs.split(' ').filter(Boolean);
  }

  await launcher.launch(launchOpts);

  launcher.on('debug', (e) => win?.webContents.send('game-log', `[DEBUG] ${e}`));
  launcher.on('data', (e) => win?.webContents.send('game-log', `[GAME] ${e}`));
  launcher.on('progress', (e) =>
    win?.webContents.send('game-log', `[PROGRESS] ${e.type} - ${Math.round((e.task / e.total) * 100)}%`)
  );
  launcher.on('close', (e) => {
    win?.webContents.send('game-log', `[LAUNCHER] Game closed with code ${e}`);
    win?.webContents.send('game-exit', e);
    if (opts.closeLauncherAfterStart) {
      win?.show();
    }
  });
};
