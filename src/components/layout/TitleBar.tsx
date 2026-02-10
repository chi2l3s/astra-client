import React from "react";
import { Minus, Square, X } from "lucide-react";

export const TitleBar = () => {
  const handleMinimize = () => {
    if (window.astra?.window?.minimize) {
      window.astra.window.minimize();
      return;
    }
    window.electron?.ipcRenderer?.send?.('window-min');
  };

  const handleMaximize = () => {
    if (window.astra?.window?.maximize) {
      window.astra.window.maximize();
      return;
    }
    window.electron?.ipcRenderer?.send?.('window-max');
  };

  const handleClose = () => {
    if (window.astra?.window?.close) {
      window.astra.window.close();
      return;
    }
    window.electron?.ipcRenderer?.send?.('window-close');
  };

  return (
    <div className="h-8 bg-background flex items-center justify-between px-4 select-none draggable border-b border-white/5">
      <div className="text-xs font-medium text-text-secondary tracking-wider">
        ASTRA LAUNCHER
      </div>
      <div className="flex items-center gap-4 no-drag">
        <button
          onClick={handleMinimize}
          className="text-text-secondary hover:text-white transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="text-text-secondary hover:text-white transition-colors"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="text-text-secondary hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
