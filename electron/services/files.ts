import fs from 'fs';
import path from 'path';
import type { App } from 'electron';
import { getAppDataRoot, resolveVersionFolder, isWithin, getVersionRoot } from './paths';

const ALLOWED_HOSTS = new Set([
  'cdn.modrinth.com',
  'api.modrinth.com',
  'modrinth.com',
]);

const ensureUrlAllowed = (url: string) => {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error('Invalid protocol');
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error('Host not allowed');
  }
  return parsed;
};

export const openAppData = async (app: App) => {
  const { shell } = require('electron');
  const target = getAppDataRoot(app);
  await shell.openPath(target);
  return true;
};

export const openVersionFolder = async (app: App, versionId: string, folder: string) => {
  const { shell } = require('electron');
  const target = resolveVersionFolder(app, versionId, folder);
  fs.mkdirSync(target, { recursive: true });
  await shell.openPath(target);
  return true;
};

export const openFile = async (app: App, filePath: string) => {
  const { shell } = require('electron');
  const root = getAppDataRoot(app);
  if (!isWithin(root, filePath)) {
    throw new Error('Invalid path');
  }
  await shell.openPath(filePath);
  return true;
};

export const deleteFile = (app: App, filePath: string) => {
  const root = getAppDataRoot(app);
  if (!isWithin(root, filePath)) {
    throw new Error('Invalid path');
  }
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  return true;
};

export const listInstalledFiles = (app: App, versionId: string, folder: string) => {
  const rootPath = resolveVersionFolder(app, versionId, folder);
  if (!fs.existsSync(rootPath)) {
    return [];
  }

  const files = fs.readdirSync(rootPath);
  return files.map((file) => {
    const fullPath = path.join(rootPath, file);
    const stats = fs.statSync(fullPath);
    return { name: file, path: fullPath, size: stats.size, isDirectory: stats.isDirectory() };
  });
};

export const listScreenshots = (app: App, versionId: string) => {
  const screenshotsPath = resolveVersionFolder(app, versionId, 'screenshots');
  if (!fs.existsSync(screenshotsPath)) {
    return [];
  }

  return fs
    .readdirSync(screenshotsPath)
    .filter((file) => file.endsWith('.png'))
    .map((file) => {
      const fullPath = path.join(screenshotsPath, file);
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        path: fullPath,
        date: stats.mtime,
        data: `data:image/png;base64,${fs.readFileSync(fullPath).toString('base64')}`,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 6);
};

export const installFromUrl = async (app: App, params: { url: string; filename: string; versionId: string; folder: string }) => {
  const { url, filename, versionId, folder } = params;
  ensureUrlAllowed(url);

  const rootPath = resolveVersionFolder(app, versionId, folder);
  fs.mkdirSync(rootPath, { recursive: true });

  const filePath = path.join(rootPath, filename);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return { success: true, filename };
};

export const ensureVersionRoot = (app: App, versionId: string) => {
  const root = getVersionRoot(app, versionId);
  fs.mkdirSync(root, { recursive: true });
  return root;
};
