export interface IElectronAPI {
  ipcRenderer: {
    send: (channel: string, data?: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => () => void;
    invoke: (channel: string, data?: any) => Promise<any>;
    removeListener: (channel: string, func: (...args: any[]) => void) => void;
  };
  platform: string;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
