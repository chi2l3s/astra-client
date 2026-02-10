const msmc = require('msmc');
import * as crypto from 'crypto'

type AuthAccount = {
  id: string;
  type: 'microsoft';
  username: string;
  uuid: string;
  isActive: boolean;
  avatarUrl?: string;
};

type AuthResult = { success: true; account: AuthAccount } | { success: false; error: string };

type TokenEntry = {
  mcToken: string;
  username: string;
  uuid: string;
};

const tokens = new Map<string, TokenEntry>();

const createId = () => crypto.randomUUID();

export const getAccessToken = (accountId: string) => tokens.get(accountId)?.mcToken || '';

export const clearToken = (accountId: string) => tokens.delete(accountId);

export const loginMicrosoft = async (): Promise<AuthResult> => {
  try {
    const authManager = new msmc.Auth('select_account');
    const xboxManager = await authManager.launch('electron');
    const token = await xboxManager.getMinecraft();

    if (!token) {
      return { success: false, error: 'Authentication failed' };
    }

    const profile = token.profile;
    const accountId = createId();

    tokens.set(accountId, { mcToken: token.mcToken, username: profile.name, uuid: profile.id });

    const entitlementsOk = await checkEntitlements(token.mcToken);
    if (!entitlementsOk) {
      tokens.delete(accountId);
      return { success: false, error: 'Аккаунт не имеет лицензии Minecraft Java Edition' };
    }

    return {
      success: true,
      account: {
        id: accountId,
        type: 'microsoft',
        username: profile.name,
        uuid: profile.id,
        isActive: false,
        avatarUrl: `https://minotar.net/helm/${profile.name}/100.png`,
      },
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Auth Error' };
  }
};

const checkEntitlements = async (mcToken: string) => {
  try {
    const entitlementsResponse = await fetch('https://api.minecraftservices.com/entitlements/mcstore', {
      headers: { Authorization: `Bearer ${mcToken}` },
    });

    if (!entitlementsResponse.ok) {
      return true;
    }

    const entitlements = await entitlementsResponse.json();
    return !!entitlements.items && entitlements.items.length > 0;
  } catch {
    return true;
  }
};
