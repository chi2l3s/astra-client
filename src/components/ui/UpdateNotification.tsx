import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'progress' | 'downloaded' | 'error';
  progress?: number;
  info?: any;
  error?: string;
}

export const UpdateNotification = () => {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (window.electron) {
        const removeListener = window.electron.ipcRenderer.on('update-status', (data: UpdateStatus) => {
            console.log('Update status:', data);
            
            // Ignore checking/not-available to not annoy user
            if (data.status === 'checking' || data.status === 'not-available') return;
            
            setStatus(data);
            setIsVisible(true);
        });
        return () => removeListener();
    }
  }, []);

  const handleRestart = () => {
    if (window.electron) {
        window.electron.ipcRenderer.send('restart-app');
    }
  };

  const handleClose = () => {
      setIsVisible(false);
  };

  if (!status || !isVisible) return null;

  return (
    <AnimatePresence>
        <motion.div 
            initial={{ opacity: 0, y: 50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 50, x: 50 }}
            className="fixed bottom-6 right-6 z-50 w-80 bg-[#1A1A1C] border border-white/10 rounded-2xl shadow-2xl p-4 overflow-hidden"
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 text-primary font-bold">
                    <RefreshCw className={`w-4 h-4 ${status.status === 'progress' ? 'animate-spin' : ''}`} />
                    <span>Обновление</span>
                </div>
                <button onClick={handleClose} className="text-text-secondary hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {status.status === 'available' && (
                <div className="space-y-3">
                    <p className="text-sm text-text-secondary">Доступна новая версия лаунчера. Скачивание начнется автоматически.</p>
                </div>
            )}

            {status.status === 'progress' && (
                <div className="space-y-3">
                    <p className="text-sm text-text-secondary">Скачивание обновления...</p>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${status.progress || 0}%` }}
                        />
                    </div>
                </div>
            )}

            {status.status === 'downloaded' && (
                <div className="space-y-3">
                    <p className="text-sm text-text-secondary">Обновление готово к установке.</p>
                    <Button 
                        size="sm" 
                        onClick={handleRestart} 
                        className="w-full"
                        leftIcon={<Download className="w-4 h-4" />}
                    >
                        Перезапустить
                    </Button>
                </div>
            )}

            {status.status === 'error' && (
                <div className="space-y-3">
                    <p className="text-sm text-red-400">Ошибка обновления:</p>
                    <p className="text-xs text-text-secondary break-words">{status.error}</p>
                </div>
            )}
        </motion.div>
    </AnimatePresence>
  );
};
