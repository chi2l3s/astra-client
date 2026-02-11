import fs from 'fs';
import path from 'path';
import os from 'os';
import extract from 'extract-zip';
import archiver from 'archiver';
import type { App } from 'electron';
import { getVersionRoot, isWithin } from './paths';

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

export const importModpack = async (app: App, versionId: string, filePath: string) => {
  const root = getVersionRoot(app, versionId);
  fs.mkdirSync(root, { recursive: true });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astra-modpack-'));
  await extract(filePath, { dir: tempDir });

  const manifestPath = path.join(tempDir, 'modrinth.index.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Unsupported modpack format');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const files = Array.isArray(manifest?.files) ? manifest.files : [];

  for (const entry of files) {
    const file = entry?.file;
    const url = file?.url || entry?.downloads?.[0];
    const relPath = entry?.path;
    if (!url || !relPath) continue;
    ensureUrlAllowed(url);
    const targetPath = path.join(root, relPath);
    if (!isWithin(root, targetPath)) {
      continue;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(targetPath, buffer);
  }

  return { success: true, imported: files.length };
};

export const exportModpack = async (app: App, versionId: string, outputPath: string) => {
  const root = getVersionRoot(app, versionId);
  if (!fs.existsSync(root)) {
    throw new Error('Version folder not found');
  }

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const zip = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    zip.on('error', (err) => reject(err));

    zip.pipe(output);
    const folders = ['mods', 'resourcepacks', 'saves'];
    folders.forEach((folder) => {
      const folderPath = path.join(root, folder);
      if (fs.existsSync(folderPath)) {
        zip.directory(folderPath, folder);
      }
    });
    zip.finalize();
  });

  return { success: true };
};
