import React, { useEffect, useState } from 'react';
import { Image, Maximize2, RefreshCw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Screenshot {
  name: string;
  path: string;
  date: string;
  data: string;
}

export const ScreenshotsWidget = () => {
  const { selectedVersion } = useStore();
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchScreenshots = async () => {
    if (!selectedVersion || !window.astra) return;

    setLoading(true);
    try {
      const data = await window.astra.files.listScreenshots(selectedVersion);
      setScreenshots(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScreenshots();
  }, [selectedVersion]);

  const openFile = (path: string) => {
    if (window.astra) {
      window.astra.files.openFile(path);
    }
  };

  if (!selectedVersion) return null;

  return (
    <div className="bg-black/20 rounded-3xl p-6 border border-white/5 flex flex-col gap-4 min-h-[300px]">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Image className="w-5 h-5 text-primary" />
          Галерея
        </h3>
        <button
          onClick={fetchScreenshots}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-text-secondary hover:text-white"
          disabled={loading}
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {loading && screenshots.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-text-secondary/50">Загрузка...</div>
      ) : screenshots.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-secondary/50 gap-2 border-2 border-dashed border-white/5 rounded-xl">
          <Image className="w-8 h-8 opacity-50" />
          <p className="text-sm">Нет скриншотов</p>
          <p className="text-xs text-center px-4">Сделайте скриншот в игре (F2), и он появится здесь</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {screenshots.map((shot, i) => (
              <motion.div
                key={shot.path}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.1 }}
                className="group relative aspect-video bg-black/50 rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-colors"
                onClick={() => openFile(shot.path)}
              >
                <img src={shot.data} alt={shot.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Maximize2 className="w-6 h-6 text-white drop-shadow-lg transform scale-75 group-hover:scale-100 transition-transform" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white/80 truncate font-mono">{shot.name}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
