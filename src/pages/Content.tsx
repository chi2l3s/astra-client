import React, { useState, useEffect, useCallback } from 'react';
import { Package, Map, Image as ImageIcon, Box, Search, Trash2, FolderOpen, Download, Globe, Filter, Star, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../context/ToastContext';
import { modrinthService, ModrinthProject } from '../services/modrinth';
import { Skeleton } from '../components/ui/Skeleton';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
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
  const [sortBy, setSortBy] = useState('relevance');
  const [selectedModVersion, setSelectedModVersion] = useState<string | null>(null);
  const { showToast } = useToast();
  const { selectedVersion } = useStore();

  const [installedFiles, setInstalledFiles] = useState<any[]>([]);

  // Determine target folder based on activeTab
  const getTargetFolder = () => {
    if (activeTab === 'resourcepacks') return 'resourcepacks';
    if (activeTab === 'worlds') return 'saves';
    return 'mods';
  };

  const loadInstalledFiles = useCallback(async () => {
    if (viewMode === 'installed' && selectedVersion && window.electron) {
      setIsLoading(true);
      try {
        const folder = getTargetFolder();
        const files = await window.electron.ipcRenderer.invoke('get-installed-files', {
          versionId: selectedVersion,
          folder
        });
        setInstalledFiles(files);
      } catch (error) {
        console.error('Failed to load installed files:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [viewMode, selectedVersion, activeTab]);

  useEffect(() => {
    loadInstalledFiles();
  }, [loadInstalledFiles]);

  const handleDelete = async (filePath: string) => {
    if (window.electron) {
      window.electron.ipcRenderer.send('delete-file', { filePath });
      showToast('Файл удален', 'success');
      loadInstalledFiles();
    }
  };

  const handleOpenFolder = () => {
    if (window.electron && selectedVersion) {
      const folder = getTargetFolder();
      window.electron.ipcRenderer.send('open-version-folder', { 
        versionId: selectedVersion, 
        folder 
      });
    }
  };

  const handleSearch = useCallback(async () => {
    if (viewMode === 'browse') {
      setIsLoading(true);
      try {
        const query = searchQuery.trim() || ''; 
        
        let facets = '';
        if (activeTab === 'mods') {
          facets = '[["project_type:mod"]]';
        } else if (activeTab === 'resourcepacks') {
          facets = '[["project_type:resourcepack"]]';
        } else if (activeTab === 'worlds') {
           facets = '[["project_type:modpack"]]'; 
        }

        const results = await modrinthService.searchProjects(query, 20, 0, facets);
        setSearchResults(results);
      } catch (e) {
        showToast('Ошибка при загрузке контента', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchQuery, viewMode, activeTab, showToast]);

  useEffect(() => {
    // Initial load
    handleSearch();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

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

        if (activeTab === 'mods') {
           return v.loaders.includes('fabric'); 
        }
        return true;
      });

      if (compatibleVersion) {
        const file = compatibleVersion.files.find((f: any) => f.primary) || compatibleVersion.files[0];
        
        showToast(`Скачивание ${file.filename}...`, 'info');
        
        if (window.electron) {
          window.electron.ipcRenderer.send('install-mod', {
            url: file.url,
            filename: file.filename,
            versionId: selectedVersion,
            folder: targetFolder
          });
          
          showToast(`${project.title} успешно установлен!`, 'success');
        } else {
          showToast('Установка доступна только в приложении', 'warning');
        }
      } else {
        showToast(`Нет совместимой версии ${targetType}а для Minecraft ${versionNumber}`, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Ошибка при установке', 'error');
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Управление контентом</h1>
          
          <div className="flex bg-black/20 rounded-xl p-1.5 border border-white/10 gap-1">
            <Button
              size="sm"
              variant={viewMode === 'installed' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('installed')}
            >
              Установлено
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'browse' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('browse')}
              leftIcon={<Globe className="w-4 h-4" />}
            >
              Modrinth
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 p-1 bg-black/20 rounded-xl w-fit border border-white/10">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              leftIcon={<tab.icon className="w-4 h-4" />}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-card flex-1 rounded-3xl flex flex-col min-h-0 border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 flex gap-4 bg-black/20">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder={`Поиск ${TABS.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-primary/50 focus:bg-black/30 transition-all"
            />
          </div>
          
          <div className="w-48">
             <Select 
               options={SORT_OPTIONS}
               value={sortBy}
               onChange={setSortBy}
               className="w-full"
               variant="default"
             />
          </div>

          <Button 
            variant="secondary"
            onClick={handleOpenFolder}
            leftIcon={<FolderOpen className="w-5 h-5" />}
            className="hidden md:flex"
          >
            Папка
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gradient-to-b from-transparent to-black/20">
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
                              {new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(project.downloads)}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 pr-10">
                          {project.description}
                        </p>
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

                        <Button 
                          onClick={() => handleInstall(project)}
                          variant="secondary"
                          size="sm"
                          leftIcon={<Download className="w-4 h-4" />}
                        >
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
            </div>
          ) : (
            // Installed View
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
                      {activeTab === 'mods' ? <Package className="w-8 h-8" /> : 
                       activeTab === 'worlds' ? <Map className="w-8 h-8" /> : 
                       <Box className="w-8 h-8" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-white truncate">{file.name}</h3>
                      <p className="text-text-secondary text-xs mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    <Button 
                      onClick={() => handleDelete(file.path)}
                      variant="danger"
                      size="icon"
                      title="Удалить"
                    >
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