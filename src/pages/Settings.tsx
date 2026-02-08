import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Folder, Check, Palette, Languages, Monitor, Layout, Power, RotateCcw, Info, Download, Upload, Trash2, Cpu, HardDrive } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';

const Settings = () => {
  const { preferences, updatePreferences } = useStore();
  const { showToast } = useToast();
  const [showSaved, setShowSaved] = useState(false);
  const [diskUsage, setDiskUsage] = useState<string>('Загрузка...');

  useEffect(() => {
    // Mock disk usage calculation
    if (window.electron) {
        // In a real scenario, we would ask main process for folder size
        setDiskUsage('~1.2 GB');
    } else {
        setDiskUsage('Неизвестно');
    }
  }, []);

  const handleSave = () => {
    // Settings are already saved in store (persisted to localStorage)
    // Here we can trigger any side effects if needed, like applying Java args immediately
    if (window.electron) {
        // Send settings update to main process if needed
    }
    setShowSaved(true);
    showToast('Настройки успешно сохранены!', 'success');
    setTimeout(() => setShowSaved(false), 2000);
  };

  const handleReset = () => {
    updatePreferences({
      theme: 'dark',
      accentColor: '#10B981',
      memoryAllocation: 4096,
      jvmArgs: '-Xmx4G -XX:+UseG1GC',
      windowWidth: 1280,
      windowHeight: 720,
      fullscreen: false,
      closeLauncherAfterStart: false
    });
    showToast('Настройки сброшены', 'info');
  };

  const handleClearCache = () => {
      showToast('Кэш очищен (эмуляция)', 'info');
  };

  const handlePresetChange = (preset: 'potato' | 'balanced' | 'ultra') => {
    let memory = 4096;
    let args = '-Xmx4G -XX:+UseG1GC';

    switch (preset) {
        case 'potato':
            memory = 2048;
            args = '-Xmx2G -XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:+UseZGC';
            break;
        case 'balanced':
            memory = 4096;
            args = '-Xmx4G -XX:+UseG1GC';
            break;
        case 'ultra':
            memory = 8192;
            args = '-Xmx8G -XX:+UseG1GC -XX:MaxGCPauseMillis=50';
            break;
    }

    updatePreferences({
        performancePreset: preset,
        memoryAllocation: memory,
        jvmArgs: args
    });
    showToast(`Применен пресет: ${preset}`, 'success');
  };

  const handleExportTheme = async () => {
    if (window.electron) {
        const themeData = {
            theme: preferences.theme,
            accentColor: preferences.accentColor
        };
        const result = await window.electron.ipcRenderer.invoke('save-theme', themeData);
        if (result.success) {
            showToast('Тема успешно экспортирована', 'success');
        }
    } else {
        showToast('Доступно только в приложении', 'warning');
    }
  };

  const handleImportTheme = async () => {
    if (window.electron) {
        const result = await window.electron.ipcRenderer.invoke('load-theme');
        if (result.success && result.themeData) {
            updatePreferences({
                theme: result.themeData.theme,
                accentColor: result.themeData.accentColor
            });
            showToast('Тема успешно применена', 'success');
        } else if (!result.canceled) {
            showToast('Ошибка при загрузке темы', 'error');
        }
    } else {
        showToast('Доступно только в приложении', 'warning');
    }
  };

  const themeOptions = [
    { value: 'dark', label: 'Темная (Default)', icon: <div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-700" /> },
    { value: 'light', label: 'Светлая', icon: <div className="w-3 h-3 rounded-full bg-white border border-gray-200" /> },
    { value: 'green', label: 'Minecraft Green', icon: <div className="w-3 h-3 rounded-full bg-green-900 border border-green-700" /> },
    { value: 'red', label: 'Nether Red', icon: <div className="w-3 h-3 rounded-full bg-red-900 border border-red-700" /> },
    { value: 'blue', label: 'Ocean Blue', icon: <div className="w-3 h-3 rounded-full bg-blue-900 border border-blue-700" /> },
    { value: 'purple', label: 'Ender Purple', icon: <div className="w-3 h-3 rounded-full bg-purple-900 border border-purple-700" /> },
    { value: 'orange', label: 'Magma Orange', icon: <div className="w-3 h-3 rounded-full bg-orange-900 border border-orange-700" /> },
  ];

  const languageOptions = [
    { value: 'ru', label: 'Русский', icon: <span className="text-xs">🇷🇺</span> },
    { value: 'en', label: 'English', icon: <span className="text-xs">🇺🇸</span> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between sticky top-0 z-30 py-4 bg-[#0A0A0B]/80 backdrop-blur-md -mx-4 px-4 border-b border-white/5">
        <div>
            <h1 className="text-3xl font-bold">Настройки</h1>
            <p className="text-text-secondary text-sm">Управление параметрами лаунчера и игры</p>
        </div>
        <div className="flex gap-2">
            <Button 
            onClick={handleReset}
            variant="outline"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            >
            Сбросить
            </Button>
            <Button 
            onClick={handleSave}
            leftIcon={<Save className="w-5 h-5" />}
            >
            Сохранить
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Settings */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* Game Settings */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-text-secondary uppercase text-xs tracking-wider flex items-center gap-2 pl-1">
                <Monitor className="w-4 h-4" />
                Настройки Игры
                </h2>
                <div className="glass-card p-6 rounded-2xl space-y-6 border border-white/5 bg-[#121214]/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Разрешение окна</label>
                        <div className="flex gap-2 items-center">
                        <input 
                            type="number" 
                            value={preferences.windowWidth}
                            onChange={(e) => updatePreferences({ windowWidth: parseInt(e.target.value) })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-center font-mono"
                            placeholder="W"
                        />
                        <span className="text-text-secondary font-mono">x</span>
                        <input 
                            type="number" 
                            value={preferences.windowHeight}
                            onChange={(e) => updatePreferences({ windowHeight: parseInt(e.target.value) })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-center font-mono"
                            placeholder="H"
                        />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Папка установки</label>
                        <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={preferences.gameDirectory || "Default"}
                            readOnly
                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-text-secondary text-sm truncate"
                        />
                        <Button size="icon" variant="secondary" title="Открыть папку">
                            <Folder className="w-4 h-4" />
                        </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => updatePreferences({ fullscreen: !preferences.fullscreen })}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${preferences.fullscreen ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-secondary'}`}>
                                <Monitor className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white group-hover:text-primary transition-colors">Полноэкранный режим</h3>
                                <p className="text-xs text-text-secondary">Запускать игру во весь экран</p>
                            </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.fullscreen ? 'bg-primary' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${preferences.fullscreen ? 'right-1' : 'left-1'}`} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => updatePreferences({ closeLauncherAfterStart: !preferences.closeLauncherAfterStart })}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${preferences.closeLauncherAfterStart ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-secondary'}`}>
                                <Power className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white group-hover:text-primary transition-colors">Авто-закрытие</h3>
                                <p className="text-xs text-text-secondary">Закрывать после запуска</p>
                            </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.closeLauncherAfterStart ? 'bg-primary' : 'bg-white/10'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${preferences.closeLauncherAfterStart ? 'right-1' : 'left-1'}`} />
                        </div>
                    </div>
                </div>
                </div>
            </section>

            {/* Java & Performance */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-text-secondary uppercase text-xs tracking-wider flex items-center gap-2 pl-1">
                <Cpu className="w-4 h-4" />
                Java и Производительность
                </h2>
                <div className="glass-card p-6 rounded-2xl space-y-8 border border-white/5 bg-[#121214]/50">
                
                {/* Presets */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => handlePresetChange('potato')}
                        className={`p-4 rounded-xl border transition-all text-center group ${preferences.performancePreset === 'potato' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                    >
                        <div className="text-2xl mb-1">🥔</div>
                        <div className="font-bold text-sm">Potato</div>
                        <div className="text-[10px] text-text-secondary group-hover:text-white/70">2GB RAM</div>
                    </button>
                    <button 
                        onClick={() => handlePresetChange('balanced')}
                        className={`p-4 rounded-xl border transition-all text-center group ${preferences.performancePreset === 'balanced' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                    >
                        <div className="text-2xl mb-1">⚖️</div>
                        <div className="font-bold text-sm">Balanced</div>
                        <div className="text-[10px] text-text-secondary group-hover:text-white/70">4GB RAM</div>
                    </button>
                    <button 
                        onClick={() => handlePresetChange('ultra')}
                        className={`p-4 rounded-xl border transition-all text-center group ${preferences.performancePreset === 'ultra' ? 'bg-primary/20 border-primary text-primary' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                    >
                        <div className="text-2xl mb-1">🚀</div>
                        <div className="font-bold text-sm">Ultra</div>
                        <div className="text-[10px] text-text-secondary group-hover:text-white/70">8GB RAM</div>
                    </button>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-end">
                        <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            Выделение памяти (RAM)
                        </label>
                        <span className="text-2xl font-bold text-primary font-mono">{preferences.memoryAllocation} MB</span>
                    </div>
                    <div className="px-1 relative pt-6 pb-2">
                        {/* Custom Slider Track */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
                            <div className="w-[25%] h-full border-r border-white absolute top-0 left-0"></div>
                            <div className="w-[50%] h-full border-r border-white absolute top-0 left-0"></div>
                            <div className="w-[75%] h-full border-r border-white absolute top-0 left-0"></div>
                        </div>
                        
                        <input 
                            type="range" 
                            min="1024" 
                            max="16384" 
                            step="512" 
                            value={preferences.memoryAllocation}
                            onChange={(e) => updatePreferences({ memoryAllocation: parseInt(e.target.value) })}
                            className="w-full h-3 bg-black/40 rounded-full appearance-none cursor-pointer accent-primary hover:accent-primary-hover transition-all"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-text-secondary uppercase mt-3 tracking-wider">
                            <span>1 GB</span>
                            <span>4 GB</span>
                            <span>8 GB</span>
                            <span>16 GB</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Путь к Java</label>
                        <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={preferences.javaPath || "Автоматически"} 
                            onChange={(e) => updatePreferences({ javaPath: e.target.value })}
                            className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-text-secondary focus:text-white focus:border-primary focus:outline-none transition-colors text-sm"
                        />
                        <Button size="icon" variant="secondary">
                            <Folder className="w-4 h-4" />
                        </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-secondary">Аргументы JVM</label>
                        <input 
                        type="text" 
                        value={preferences.jvmArgs || ''}
                        onChange={(e) => updatePreferences({ jvmArgs: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-text-secondary focus:text-white focus:outline-none focus:border-primary transition-colors font-mono text-sm"
                        placeholder="-Xmx4G -XX:+UseG1GC"
                        />
                    </div>
                </div>
                </div>
            </section>
          </div>

          {/* Right Column - Appearance & System */}
          <div className="space-y-8">
             {/* Appearance */}
             <section className="space-y-4">
                <h2 className="text-lg font-bold text-text-secondary uppercase text-xs tracking-wider flex items-center gap-2 pl-1">
                <Layout className="w-4 h-4" />
                Внешний вид
                </h2>
                <div className="glass-card p-6 rounded-2xl space-y-6 border border-white/5 bg-[#121214]/50">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-text-secondary block">Язык интерфейса</label>
                        <Select 
                            options={languageOptions} 
                            value="ru" 
                            onChange={() => {}} 
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-text-secondary block">Тема оформления</label>
                        <Select 
                            options={themeOptions} 
                            value={preferences.theme} 
                            onChange={(val) => updatePreferences({ theme: val as any })} 
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-text-secondary block">Акцентный цвет</label>
                        <div className="flex gap-3 items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <input 
                                type="color" 
                                value={preferences.accentColor}
                                onChange={(e) => updatePreferences({ accentColor: e.target.value })}
                                className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white uppercase tracking-wider">{preferences.accentColor}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                        <Button 
                            variant="secondary" 
                            onClick={handleExportTheme}
                            leftIcon={<Download className="w-4 h-4" />}
                            className="w-full"
                        >
                            Экспорт
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={handleImportTheme}
                            leftIcon={<Upload className="w-4 h-4" />}
                            className="w-full"
                        >
                            Импорт
                        </Button>
                    </div>
                </div>
             </section>

             {/* System Info */}
             <section className="space-y-4">
                <h2 className="text-lg font-bold text-text-secondary uppercase text-xs tracking-wider flex items-center gap-2 pl-1">
                <HardDrive className="w-4 h-4" />
                Система
                </h2>
                <div className="glass-card p-6 rounded-2xl space-y-4 border border-white/5 bg-[#121214]/50">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-sm text-text-secondary">Занято на диске</span>
                        <span className="text-sm font-mono text-white">{diskUsage}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-sm text-text-secondary">Версия лаунчера</span>
                        <span className="text-sm font-mono text-white">1.0.0-beta</span>
                    </div>
                    
                    <Button 
                        variant="danger" 
                        className="w-full mt-2" 
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={handleClearCache}
                    >
                        Очистить кэш
                    </Button>
                </div>
             </section>

             {/* Links */}
             <section className="space-y-2">
                 <div className="flex gap-2">
                     <a href="#" className="flex-1 bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/5 rounded-xl py-3 text-center text-sm font-medium transition-colors">
                         Discord
                     </a>
                     <a href="#" className="flex-1 bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/5 rounded-xl py-3 text-center text-sm font-medium transition-colors">
                         GitHub
                     </a>
                 </div>
             </section>
          </div>
      </div>
    </div>
  );
};

export default Settings;
