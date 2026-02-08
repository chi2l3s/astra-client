import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export const DownloadManager: React.FC = () => {
  const { downloads } = useStore();
  
  if (!downloads) return null;
  
  const activeDownloads = Object.values(downloads);

  if (activeDownloads.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {activeDownloads.map((download) => (
          <motion.div
            key={download.versionId}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="w-80 bg-background-secondary/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg text-primary">
                  {download.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm">Minecraft {download.versionId}</h4>
                  <p className="text-xs text-text-secondary">
                    {download.status === 'downloading' ? 'Скачивание файлов...' : 
                     download.status === 'completed' ? 'Установка завершена' : 'Ожидание...'}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="absolute left-0 top-0 h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${download.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            <div className="flex justify-between mt-2 text-xs text-text-secondary font-mono">
              <span>{Math.round(download.progress)}%</span>
              <span>{download.status === 'downloading' ? 'Загрузка...' : 'Готово'}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
