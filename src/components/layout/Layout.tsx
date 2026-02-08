import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';
import { Background3D } from './Background3D';
import { DownloadManager } from '../ui/DownloadManager';
import { UpdateNotification } from '../ui/UpdateNotification';
import { useStore } from '../../store/useStore';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, showSidebar: explicitShowSidebar }) => {
  const { updateDownloadProgress, completeDownload } = useStore();
  const location = useLocation();

  const showSidebar = explicitShowSidebar !== undefined 
    ? explicitShowSidebar 
    : location.pathname !== '/login';

  useEffect(() => {
    if (window.electron) {
      const handleProgress = (data: { version: string, progress: number }) => {
        updateDownloadProgress(data.version, data.progress);
      };

      const handleComplete = (data: { version: string }) => {
        completeDownload(data.version);
      };

      const removeProgress = window.electron.ipcRenderer.on('install-progress', handleProgress);
      const removeComplete = window.electron.ipcRenderer.on('install-complete', handleComplete);

      return () => {
        removeProgress();
        removeComplete();
      };
    }
  }, [updateDownloadProgress, completeDownload]);

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden text-text-primary">
      <TitleBar />
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && <Sidebar />}
        <main className="flex-1 relative overflow-hidden">
          <Background3D />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
          
          <div className="relative h-full overflow-y-auto p-8 custom-scrollbar">
             {children}
          </div>
          
          <DownloadManager />
          <UpdateNotification />
        </main>
      </div>
    </div>
  );
};
