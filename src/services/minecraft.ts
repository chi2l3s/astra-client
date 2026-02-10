import { MinecraftVersion } from '../types';

const MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest.json';

export const minecraftService = {
  async getVersions(): Promise<MinecraftVersion[]> {
    try {
      const response = await fetch(MANIFEST_URL);
      const data = await response.json();
      return data.versions.map((v: any) => ({
        id: v.id,
        type: v.type,
        url: v.url,
        time: v.time,
        releaseTime: v.releaseTime,
      }));
    } catch {
      return [];
    }
  },

  async getVersionDetails(url: string) {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch {
      return null;
    }
  },
};
