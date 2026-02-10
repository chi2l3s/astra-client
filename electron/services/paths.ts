import path from 'path';
import type { App } from 'electron';

const SAFE_VERSION = /^[A-Za-z0-9._-]+$/;
const SAFE_FOLDER = new Set(['mods', 'resourcepacks', 'saves', 'screenshots']);

export const getAppDataRoot = (app: App) => path.join(app.getPath('appData'), '.astra-client');

export const assertSafeVersion = (versionId: string) => {
  if (!SAFE_VERSION.test(versionId)) {
    throw new Error('Invalid version id');
  }
};

export const assertSafeFolder = (folder: string) => {
  if (!SAFE_FOLDER.has(folder)) {
    throw new Error('Invalid folder');
  }
};

export const getVersionRoot = (app: App, versionId: string) => {
  assertSafeVersion(versionId);
  return path.join(getAppDataRoot(app), 'versions', versionId);
};

export const resolveVersionFolder = (app: App, versionId: string, folder: string) => {
  assertSafeFolder(folder);
  return path.join(getVersionRoot(app, versionId), folder);
};

export const isWithin = (parent: string, child: string) => {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};
