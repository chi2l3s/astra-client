import React, { useEffect, useState } from 'react';
import { Search, Download, Clock, CheckCircle2, Loader2, Share2 } from 'lucide-react';
import { minecraftService } from '../services/minecraft';
import { MinecraftVersion } from '../types';
import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';

const Versions = () => {
  const [versions, setVersions] = useState<MinecraftVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'release' | 'snapshot'>('release');
  const { showToast } = useToast();

  const { installedVersions, downloads, startDownload, updateDownloadProgress, completeDownload } = useStore();

  const handleExportMods = async (versionId: string) => {
    if (window.astra) {
      const files = await window.astra.files.listInstalled(versionId, 'mods');
      const modNames = files.map((f: any) => f.name).join('\n');

      if (!modNames) {
        showToast('Моды не найдены для этой версии', 'info');
        return;
      }

      navigator.clipboard.writeText(modNames);
      showToast('Список модов скопирован в буфер обмена!', 'success');
    } else {
      showToast('Функция недоступна в браузере', 'warning');
    }
  };

  useEffect(() => {
    const loadVersions = async () => {
      setLoading(true);
      const data = await minecraftService.getVersions();
      setVersions(data);
      setLoading(false);
    };
    loadVersions();
  }, []);

  const handleDownload = async (versionId: string) => {
    startDownload(versionId);

    if (window.astra) {
      await window.astra.game.installVersion(versionId);
    } else {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          completeDownload(versionId);
        } else {
          updateDownloadProgress(versionId, progress);
        }
      }, 500);
    }
  };

  const filteredVersions = versions.filter((v) => {
    const matchesSearch = v.id.toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === 'all' || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Управление версиями</h1>

        <div className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="relative flex-1">
            <Input
              leftIcon={<Search className="w-5 h-5 text-text-secondary" />}
              type="text"
              placeholder="Поиск версии..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <div className="flex bg-black/20 rounded-lg p-1 border border-white/10 gap-1">
            {(['release', 'snapshot', 'all'] as const).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={typeFilter === type ? 'primary' : 'ghost'}
                onClick={() => setTypeFilter(type)}
                className="capitalize"
              >
                {type === 'release' ? 'Релизы' : type === 'snapshot' ? 'Снапшоты' : 'Все'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-medium text-text-secondary">
          <div className="col-span-4">Версия</div>
          <div className="col-span-3">Тип</div>
          <div className="col-span-3">Дата выхода</div>
          <div className="col-span-2 text-right">Действия</div>
        </div>

        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-text-secondary">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              Загрузка списка версий...
            </div>
          ) : (
            filteredVersions.slice(0, 50).map((version) => {
              const isInstalled = installedVersions.some((v) => v.id === version.id);
              const downloadStatus = downloads[version.id];
              const isDownloading = downloadStatus?.status === 'downloading';

              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={version.id}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 border-b border-white/5 transition-colors group relative overflow-hidden"
                >
                  {isDownloading && (
                    <div
                      className="absolute inset-0 bg-primary/10 transition-all duration-300 pointer-events-none"
                      style={{ width: `${downloadStatus.progress}%` }}
                    />
                  )}

                  <div className="col-span-4 font-medium text-white flex items-center gap-3 relative z-10">
                    <span className={`w-2 h-2 rounded-full ${version.type === 'release' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    {version.id}
                  </div>
                  <div className="col-span-3 text-text-secondary capitalize relative z-10">{version.type}</div>
                  <div className="col-span-3 text-text-secondary flex items-center gap-2 relative z-10">
                    <Clock className="w-4 h-4" />
                    {new Date(version.releaseTime).toLocaleDateString()}
                  </div>
                  <div className="col-span-2 flex justify-end relative z-10">
                    {isDownloading ? (
                      <div className="flex items-center gap-2 text-primary font-medium text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {Math.round(downloadStatus.progress)}%
                      </div>
                    ) : isInstalled ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => handleExportMods(version.id)}
                          title="Экспортировать список модов"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2 text-primary font-medium text-sm">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="hidden sm:inline">Установлено</span>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleDownload(version.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Скачать версию"
                      >
                        <Download className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Versions;
