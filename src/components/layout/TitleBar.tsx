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
    <div className="h-8 bg-background flex items-center px-4 select-none border-b border-white/5">
      <div className="draggable flex-1 text-xs font-medium text-text-secondary tracking-wider">
        ASTRA LAUNCHER
      </div>
      <div className="flex items-center gap-3 no-drag shrink-0">
        <button
          type="button"
          onClick={handleMinimize}
          className="w-8 h-8 rounded-md text-text-secondary hover:text-white transition-colors flex items-center justify-center"
          aria-label="Свернуть"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          className="w-8 h-8 rounded-md text-text-secondary hover:text-white transition-colors flex items-center justify-center"
          aria-label="Развернуть"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="w-8 h-8 rounded-md text-text-secondary hover:text-red-500 transition-colors flex items-center justify-center"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
