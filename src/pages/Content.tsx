import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Map, Box, Search, Trash2, FolderOpen, Download, Globe, Star, Calendar, Upload, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { modrinthService, ModrinthProject } from '../services/modrinth';
import { Skeleton } from '../components/ui/Skeleton';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useStore } from '../store/useStore';

const TABS = [
  { id: 'mods', label: 'Моды', icon: Package },
  { id: 'worlds', label: 'Миры', icon: Map },
  { id: 'resourcepacks', label: 'Ресурспаки', icon: Box },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Релевантность' },
  { value: 'downloads', label: 'Популярные' },
  { value: 'newest', label: 'Новые' },
  { value: 'updated', label: 'Обновленные' },
];

const Content = () => {
  const [activeTab, setActiveTab] = useState('mods');
  const [viewMode, setViewMode] = useState<'installed' | 'browse'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ModrinthProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const { showToast } = useToast();
  const { selectedVersion } = useStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 50;

  const [installedFiles, setInstalledFiles] = useState<any[]>([]);
  const [modUpdates, setModUpdates] = useState<Record<string, { file: any; project: ModrinthProject }>>({});

  const getTargetFolder = () => {
    if (activeTab === 'resourcepacks') return 'resourcepacks';
    if (activeTab === 'worlds') return 'saves';
    return 'mods';
  };

  const loadInstalledFiles = useCallback(async () => {
    if (viewMode === 'installed' && selectedVersion && window.astra) {
      setIsLoading(true);
      try {
        const folder = getTargetFolder();
        const files = await window.astra.files.listInstalled(selectedVersion, folder);
        const filtered = activeTab === 'worlds' ? files.filter((f: any) => f.isDirectory) : files;
        setInstalledFiles(filtered);
      } catch {
      } finally {
        setIsLoading(false);
      }
    }
  }, [viewMode, selectedVersion, activeTab]);

  useEffect(() => {
    loadInstalledFiles();
  }, [loadInstalledFiles]);

  useEffect(() => {
    setModUpdates({});
  }, [activeTab, viewMode, selectedVersion]);

  const handleDelete = async (filePath: string) => {
    if (window.astra) {
      await window.astra.files.deleteFile(filePath);
      showToast('Файл удален', 'success');
      loadInstalledFiles();
    }
  };

  const handleOpenFolder = () => {
    if (window.astra && selectedVersion) {
      const folder = getTargetFolder();
      window.astra.folders.openVersionFolder(selectedVersion, folder);
    }
  };

  const handleImportModpack = async () => {
    if (!window.astra || !selectedVersion) {
      showToast('Доступно только в приложении и при выбранной версии', 'warning');
      return;
    }
    const result = await window.astra.modpack.import(selectedVersion);
    if (result?.success) {
      showToast('Модпак импортирован', 'success');
      loadInstalledFiles();
    } else if (!result?.canceled) {
      showToast(result?.error || 'Ошибка импорта', 'error');
    }
  };

  const handleExportModpack = async () => {
    if (!window.astra || !selectedVersion) {
      showToast('Доступно только в приложении и при выбранной версии', 'warning');
      return;
    }
    const result = await window.astra.modpack.export(selectedVersion);
    if (result?.success) {
      showToast('Модпак экспортирован', 'success');
    } else if (!result?.canceled) {
      showToast(result?.error || 'Ошибка экспорта', 'error');
    }
  };

  const normalizeModName = (filename: string) => {
    const base = filename.replace(/\.jar$/i, '');
    const cleaned = base.replace(/[-_]?v?\d+(\.\d+)+.*$/i, '');
    return cleaned.replace(/[_-]+/g, ' ').trim();
  };

  const checkModUpdates = async () => {
    if (viewMode !== 'installed' || activeTab !== 'mods') return;
    if (!selectedVersion) {
      showToast('Сначала выберите версию Minecraft', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      const updates: Record<string, { file: any; project: ModrinthProject }> = {};
      const versionNumber = selectedVersion.replace(/[^0-9.]/g, '');
      for (const file of installedFiles) {
        const query = normalizeModName(file.name);
        if (!query) continue;
        const [project] = await modrinthService.searchProjects(query, 1, 0, '[["project_type:mod"]]', 'relevance');
        if (!project) continue;
        const versions = await modrinthService.getProjectVersions(project.slug);
        const compatible = versions.find((v: any) => {
          const matchesGame = v.game_versions?.includes(versionNumber);
          const matchesLoader = Array.isArray(v.loaders) ? v.loaders.includes('fabric') : true;
          return matchesGame && matchesLoader;
        });
        if (!compatible) continue;
        const latestFile = compatible.files?.find((f: any) => f.primary) || compatible.files?.[0];
        if (!latestFile || latestFile.filename === file.name) continue;
        updates[file.path] = { file: latestFile, project };
      }
      setModUpdates(updates);
      showToast(Object.keys(updates).length ? 'Найдены обновления' : 'Обновлений нет', 'info');
    } catch {
      showToast('Ошибка при проверке обновлений', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateAllMods = async () => {
    if (!window.astra || !selectedVersion) return;
    const entries = Object.entries(modUpdates);
    if (entries.length === 0) {
      showToast('Обновлений нет', 'info');
      return;
    }
    for (const [filePath, update] of entries) {
      try {
        await window.astra.files.installFromUrl({
          url: update.file.url,
          filename: update.file.filename,
          versionId: selectedVersion,
          folder: 'mods',
        });
        await window.astra.files.deleteFile(filePath);
      } catch {
      }
    }
    setModUpdates({});
    loadInstalledFiles();
    showToast('Моды обновлены', 'success');
  };

  const getFacets = () => {
    if (activeTab === 'mods') return '[["project_type:mod"]]';
    if (activeTab === 'resourcepacks') return '[["project_type:resourcepack"]]';
    if (activeTab === 'worlds') return '[["project_type:modpack"]]';
    return '';
  };

  const fetchProjects = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (viewMode !== 'browse') return;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      try {
        const query = searchQuery.trim() || '';
        const facets = getFacets();
        const results = await modrinthService.searchProjects(query, pageSize, nextOffset, facets, sortBy as any);
        setHasMore(results.length === pageSize);
        setOffset(nextOffset);
        setSearchResults((prev) => {
          if (!append) return results;
          const existing = new Set(prev.map((p) => p.id));
          const merged = [...prev, ...results.filter((p) => !existing.has(p.id))];
          return merged;
        });
      } catch {
        showToast('Ошибка при загрузке контента', 'error');
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeTab, searchQuery, sortBy, showToast, viewMode]
  );

  useEffect(() => {
    if (viewMode !== 'browse') return;
    setHasMore(true);
    setOffset(0);
    const timer = setTimeout(() => {
      fetchProjects(0, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, sortBy, viewMode, fetchProjects]);

  const loadMore = useCallback(
    (nextPage: number) => {
      if (isLoading || isLoadingMore || !hasMore) return;
      const nextOffset = nextPage * pageSize;
      fetchProjects(nextOffset, true);
    },
    [fetchProjects, hasMore, isLoading, isLoadingMore, pageSize]
  );

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || viewMode !== 'browse') return;
    if (isLoading || isLoadingMore || !hasMore) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 240) {
      loadMore(Math.floor((offset + pageSize) / pageSize));
    }
  };

  const handleInstall = async (project: ModrinthProject) => {
    if (!selectedVersion) {
      showToast('Пожалуйста, выберите версию Minecraft в главном меню', 'error');
      return;
    }

    let targetFolder = 'mods';
    let targetType = 'мод';

    if (activeTab === 'resourcepacks') {
      targetFolder = 'resourcepacks';
      targetType = 'ресурспак';
    } else if (activeTab === 'worlds') {
      targetFolder = 'saves';
      targetType = 'мир';
    }

    showToast(`Поиск совместимой версии для ${project.title}...`, 'info');

    try {
      const versions = await modrinthService.getProjectVersions(project.slug);
      const versionNumber = selectedVersion.replace(/[^0-9.]/g, '');

      const compatibleVersion = versions.find((v: any) => {
        const matchesGameVersion = v.game_versions.includes(versionNumber);
        if (!matchesGameVersion) return false;
        if (activeTab === 'mods') return v.loaders.includes('fabric');
        return true;
      });

      if (compatibleVersion) {
        if (activeTab === 'mods' && compatibleVersion.dependencies?.length > 0) {
          showToast(`Проверка зависимостей для ${project.title}...`, 'info');
          for (const dep of compatibleVersion.dependencies) {
            if (dep.dependency_type === 'required') {
              try {
                let depVersion = null;
                if (dep.version_id) {
                  depVersion = await modrinthService.getVersion(dep.version_id);
                } else if (dep.project_id) {
                  const depVersions = await modrinthService.getProjectVersions(dep.project_id);
                  depVersion = depVersions.find((v: any) => {
                    return v.game_versions.includes(versionNumber) && v.loaders.includes('fabric');
                  });
                }

                if (depVersion) {
                  const depFile = depVersion.files.find((f: any) => f.primary) || depVersion.files[0];
                  showToast(`Установка зависимости: ${depFile.filename}...`, 'info');
                  if (window.astra) {
                    await window.astra.files.installFromUrl({
                      url: depFile.url,
                      filename: depFile.filename,
                      versionId: selectedVersion,
                      folder: targetFolder,
                    });
                  }
                }
              } catch {
              }
            }
          }
        }

        const file = compatibleVersion.files.find((f: any) => f.primary) || compatibleVersion.files[0];

        showToast(`Скачивание ${file.filename}...`, 'info');

        if (window.astra) {
          await window.astra.files.installFromUrl({
            url: file.url,
            filename: file.filename,
            versionId: selectedVersion,
            folder: targetFolder,
          });
          showToast(`${project.title} успешно установлен!`, 'success');
        } else {
          showToast('Установка доступна только в приложении', 'warning');
        }
      } else {
        showToast(`Нет совместимой версии ${targetType}а для Minecraft ${versionNumber}`, 'error');
      }
    } catch {
      showToast('Ошибка при установке', 'error');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Управление контентом</h1>

          <div className="flex bg-black/20 rounded-xl p-1.5 border border-white/10 gap-1">
            <Button size="sm" variant={viewMode === 'installed' ? 'secondary' : 'ghost'} onClick={() => setViewMode('installed')}>
              Установлено
            </Button>
            <Button size="sm" variant={viewMode === 'browse' ? 'primary' : 'ghost'} onClick={() => setViewMode('browse')} leftIcon={<Globe className="w-4 h-4" />}>
              Modrinth
            </Button>
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-black/20 rounded-xl w-fit border border-white/10">
          {TABS.map((tab) => (
            <Button key={tab.id} variant={activeTab === tab.id ? 'primary' : 'ghost'} onClick={() => setActiveTab(tab.id)} leftIcon={<tab.icon className="w-4 h-4" />}>
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-card flex-1 rounded-3xl flex flex-col min-h-0 border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex gap-4 bg-black/20">
          <div className="relative flex-1 group">
            <Input
              leftIcon={<Search className="w-5 h-5 text-text-secondary group-focus-within:text-primary transition-colors" />}
              type="text"
              placeholder={`Поиск ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="focus:bg-black/30"
            />
          </div>

          <div className="w-48">
            <Select options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} className="w-full" variant="default" />
          </div>

          <Button variant="secondary" onClick={handleOpenFolder} leftIcon={<FolderOpen className="w-5 h-5" />} className="hidden md:flex">
            Папка
          </Button>
          <Button variant="secondary" onClick={handleImportModpack} leftIcon={<Download className="w-5 h-5" />}>
            Импорт
          </Button>
          <Button variant="secondary" onClick={handleExportModpack} leftIcon={<Upload className="w-5 h-5" />}>
            Экспорт
          </Button>
          {activeTab === 'mods' && viewMode === 'installed' && (
            <Button variant="secondary" onClick={checkModUpdates} leftIcon={<RefreshCw className="w-5 h-5" />}>
              Проверить обновления
            </Button>
          )}
          {activeTab === 'mods' && viewMode === 'installed' && Object.keys(modUpdates).length > 0 && (
            <Button variant="primary" onClick={updateAllMods} leftIcon={<Download className="w-5 h-5" />}>
              Обновить все
            </Button>
          )}
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gradient-to-b from-transparent to-black/20">
          {viewMode === 'browse' ? (
            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-6 w-1/3 rounded-lg" />
                        <Skeleton className="h-4 w-2/3 rounded-lg" />
                        <div className="flex gap-2">
                          <Skeleton className="h-4 w-20 rounded-lg" />
                          <Skeleton className="h-4 w-20 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  searchResults.map((project) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={project.id}
                    className="flex gap-6 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                    {project.icon_url ? (
                      <img src={project.icon_url} alt={project.title} className="w-24 h-24 rounded-2xl object-cover bg-black/20 shadow-lg" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg">
                        <Package className="w-10 h-10" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">{project.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/20">
                                {project.categories?.[0] || 'Mod'}
                              </span>
                              <span className="text-xs text-text-secondary flex items-center gap-1">
                                by <span className="text-white hover:underline cursor-pointer">{project.author}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                            <Download className="w-4 h-4 text-primary" />
                            <span className="font-mono font-bold text-sm">
                              {new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(project.downloads)}
                            </span>
                          </div>
                        </div>

                        <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 pr-10">{project.description}</p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex gap-4 text-xs text-text-secondary">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(project.date_modified).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5" />
                            {project.follows} follows
                          </span>
                        </div>

                        <Button onClick={() => handleInstall(project)} variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                          Установить
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                  ))
                )}

                {!isLoading && searchResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-text-secondary opacity-60">
                    <Package className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">Ничего не найдено</p>
                    <p className="text-sm">Попробуйте изменить запрос</p>
                  </div>
                )}

                {isLoadingMore && (
                  <div className="flex items-center justify-center py-6 text-text-secondary">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mr-3" />
                    Загрузка...
                  </div>
                )}
              </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
                  <p>Загрузка файлов...</p>
                </div>
              ) : installedFiles.length > 0 ? (
                installedFiles.map((file) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={file.path}
                    className="flex gap-6 p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-primary/30 transition-all group items-center"
                  >
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {activeTab === 'mods' ? <Package className="w-8 h-8" /> : activeTab === 'worlds' ? <Map className="w-8 h-8" /> : <Box className="w-8 h-8" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-white truncate">{file.name}</h3>
                      <p className="text-text-secondary text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      {activeTab === 'mods' && modUpdates[file.path] && (
                        <p className="text-xs text-primary mt-1">
                          Обновление доступно: {modUpdates[file.path].file.filename}
                        </p>
                      )}
                    </div>

                    <Button onClick={() => handleDelete(file.path)} variant="danger" size="icon" title="Удалить">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-text-secondary opacity-60">
                  <Package className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">
                    Нет установленных {activeTab === 'mods' ? 'модов' : activeTab === 'worlds' ? 'миров' : 'ресурспаков'}
                  </p>
                  <p className="text-sm">Перейдите в Modrinth чтобы скачать что-нибудь!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Content;
