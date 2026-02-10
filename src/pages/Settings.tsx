import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Folder,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Cpu,
  HardDrive,
  Monitor,
  Layout,
  Power,
  Shield,
  Bell,
  Cloud,
  Speaker,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Slider } from '../components/ui/Slider';
import { useToast } from '../context/ToastContext';

const Settings = () => {
  const { preferences, updatePreferences } = useStore();
  const { showToast } = useToast();
  const [diskUsage, setDiskUsage] = useState<string>('Загрузка...');
  const lastSyncRef = useRef(0);

  useEffect(() => {
    if (window.astra) {
      setDiskUsage('~1.2 GB');
    } else {
      setDiskUsage('Неизвестно');
    }
  }, []);

  const syncPreferences = (prefs: Partial<typeof preferences>) => {
    if (!window.astra?.settings?.update) return;
    const now = Date.now();
    if (now - lastSyncRef.current < 200) return;
    lastSyncRef.current = now;
    window.astra.settings.update({ ...preferences, ...prefs });
  };

  const updateAndSync = (prefs: Partial<typeof preferences>) => {
    updatePreferences(prefs);
    syncPreferences(prefs);
  };

  const handleSave = () => {
    syncPreferences({});
    showToast('Настройки успешно сохранены!', 'success');
  };

  const handleReset = () => {
    updateAndSync({
      theme: 'dark',
      accentColor: '#10B981',
      memoryAllocation: 4096,
      jvmArgs: '-Xmx4G -XX:+UseG1GC',
      windowWidth: 1280,
      windowHeight: 720,
      fullscreen: false,
      closeLauncherAfterStart: false,
      performancePreset: 'balanced',
      language: 'ru',
      autoUpdates: true,
      updateChannel: 'stable',
      startOnBoot: false,
      minimizeToTray: true,
      reduceMotion: false,
      enableSounds: true,
      showNews: true,
      telemetry: false,
      crashReports: true,
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

    updateAndSync({
      performancePreset: preset,
      memoryAllocation: memory,
      jvmArgs: args,
    });
    showToast(`Применен пресет: ${preset}`, 'success');
  };

  const handleExportTheme = async () => {
    if (window.astra) {
      const themeData = {
        theme: preferences.theme,
        accentColor: preferences.accentColor,
      };
      const result = await window.astra.theme.save(themeData);
      if (result.success) {
        showToast('Тема успешно экспортирована', 'success');
      }
    } else {
      showToast('Доступно только в приложении', 'warning');
    }
  };

  const handleImportTheme = async () => {
    if (window.astra) {
      const result = await window.astra.theme.load();
      if (result.success && result.themeData) {
        updateAndSync({
          theme: result.themeData.theme,
          accentColor: result.themeData.accentColor,
        });
        showToast('Тема успешно применена', 'success');
      } else if (!result.canceled) {
        showToast('Ошибка при загрузке темы', 'error');
      }
    } else {
      showToast('Доступно только в приложении', 'warning');
    }
  };

  const handleOpenFolder = async () => {
    if (window.astra) {
      await window.astra.folders.openAppData();
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
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'English' },
  ];

  const updateChannels = [
    { value: 'stable', label: 'Stable' },
    { value: 'beta', label: 'Beta' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between sticky top-0 z-30 py-4 bg-[#0A0A0B]/80 backdrop-blur-md -mx-4 px-4 border-b border-white/5">
        <div>
          <h1 className="text-3xl font-bold">Настройки</h1>
          <p className="text-text-secondary text-sm">Центр управления лаунчером и игрой</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleReset} variant="outline" leftIcon={<RotateCcw className="w-4 h-4" />}>
            Сбросить
          </Button>
          <Button onClick={handleSave} leftIcon={<Save className="w-5 h-5" />}>
            Сохранить
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 space-y-10">
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 pl-1">
              <Monitor className="w-4 h-4" />
              Игра
            </h2>
            <div className="glass-card p-6 rounded-2xl space-y-6 border border-white/5 bg-[#121214]/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Разрешение окна</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={preferences.windowWidth}
                      onChange={(e) => updateAndSync({ windowWidth: parseInt(e.target.value) })}
                      className="text-center font-mono"
                      placeholder="W"
                    />
                    <span className="text-text-secondary font-mono">x</span>
                    <Input
                      type="number"
                      value={preferences.windowHeight}
                      onChange={(e) => updateAndSync({ windowHeight: parseInt(e.target.value) })}
                      className="text-center font-mono"
                      placeholder="H"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Папка установки</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={preferences.gameDirectory || 'Default'}
                      readOnly
                      className="flex-1 text-text-secondary text-sm truncate"
                    />
                    <Button size="icon" variant="secondary" title="Открыть папку" onClick={handleOpenFolder}>
                      <Folder className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                  onClick={() => updateAndSync({ fullscreen: !preferences.fullscreen })}
                >
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

                <div
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                  onClick={() => updateAndSync({ closeLauncherAfterStart: !preferences.closeLauncherAfterStart })}
                >
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

          <section className="space-y-4">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 pl-1">
              <Cpu className="w-4 h-4" />
              Производительность
            </h2>
            <div className="glass-card p-6 rounded-2xl space-y-8 border border-white/5 bg-[#121214]/50">
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
                  <span className="text-2xl font-bold text-primary font-mono">{Number(preferences.memoryAllocation)}</span>
                </div>
                <div className="pt-2">
                  <Slider
                    min={1024}
                    max={16384}
                    step={512}
                    value={preferences.memoryAllocation}
                    onChange={(val) => updateAndSync({ memoryAllocation: val })}
                    showTrackMarkers
                    marks={[
                      { value: 1024, label: '1 GB' },
                      { value: 4096, label: '4 GB' },
                      { value: 8192, label: '8 GB' },
                      { value: 16384, label: '16 GB' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Путь к Java</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={preferences.javaPath || 'Автоматически'}
                      onChange={(e) => updateAndSync({ javaPath: e.target.value })}
                      className="flex-1 text-sm"
                      containerClassName="flex-1"
                    />
                    <Button size="icon" variant="secondary">
                      <Folder className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">Аргументы JVM</label>
                  <Input
                    type="text"
                    value={preferences.jvmArgs || ''}
                    onChange={(e) => updateAndSync({ jvmArgs: e.target.value })}
                    className="font-mono text-sm"
                    placeholder="-Xmx4G -XX:+UseG1GC"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-10">
          <section className="space-y-4">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 pl-1">
              <Layout className="w-4 h-4" />
              Интерфейс
            </h2>
            <div className="glass-card p-6 rounded-2xl space-y-6 border border-white/5 bg-[#121214]/50">
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-secondary block">Язык интерфейса</label>
                <Select
                  options={languageOptions}
                  value={preferences.language}
                  onChange={(val) => updateAndSync({ language: val as any })}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-text-secondary block">Тема оформления</label>
                <Select
                  options={themeOptions}
                  value={preferences.theme}
                  onChange={(val) => updateAndSync({ theme: val as any })}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-text-secondary block">Акцентный цвет</label>
                <div className="flex gap-3 items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={preferences.accentColor}
                    onChange={(e) => updateAndSync({ accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white uppercase tracking-wider">{preferences.accentColor}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2 border-t border-white/5">
                <div
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => updateAndSync({ reduceMotion: !preferences.reduceMotion })}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Уменьшить анимации
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.reduceMotion ? 'bg-primary' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.reduceMotion ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
                <div
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => updateAndSync({ enableSounds: !preferences.enableSounds })}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Speaker className="w-4 h-4 text-primary" />
                    Звуки интерфейса
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.enableSounds ? 'bg-primary' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.enableSounds ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
                <div
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => updateAndSync({ showNews: !preferences.showNews })}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Bell className="w-4 h-4 text-primary" />
                    Показывать новости
                  </div>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.showNews ? 'bg-primary' : 'bg-white/10'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.showNews ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <Button variant="secondary" onClick={handleExportTheme} leftIcon={<Download className="w-4 h-4" />} className="w-full">
                  Экспорт
                </Button>
                <Button variant="secondary" onClick={handleImportTheme} leftIcon={<Upload className="w-4 h-4" />} className="w-full">
                  Импорт
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 pl-1">
              <Cloud className="w-4 h-4" />
              Лаунчер
            </h2>
            <div className="glass-card p-6 rounded-2xl space-y-4 border border-white/5 bg-[#121214]/50">
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-secondary block">Канал обновлений</label>
                <Select
                  options={updateChannels}
                  value={preferences.updateChannel}
                  onChange={(val) => updateAndSync({ updateChannel: val as any })}
                  className="w-full"
                />
              </div>

              <div
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => updateAndSync({ autoUpdates: !preferences.autoUpdates })}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Cloud className="w-4 h-4 text-primary" />
                  Автообновления
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.autoUpdates ? 'bg-primary' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.autoUpdates ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => updateAndSync({ startOnBoot: !preferences.startOnBoot })}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Power className="w-4 h-4 text-primary" />
                  Запуск при старте системы
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.startOnBoot ? 'bg-primary' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.startOnBoot ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => updateAndSync({ minimizeToTray: !preferences.minimizeToTray })}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Bell className="w-4 h-4 text-primary" />
                  Сворачивать в трей
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.minimizeToTray ? 'bg-primary' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.minimizeToTray ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 pl-1">
              <Shield className="w-4 h-4" />
              Приватность
            </h2>
            <div className="glass-card p-6 rounded-2xl space-y-4 border border-white/5 bg-[#121214]/50">
              <div
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => updateAndSync({ telemetry: !preferences.telemetry })}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-primary" />
                  Телеметрия
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.telemetry ? 'bg-primary' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.telemetry ? 'right-1' : 'left-1'}`} />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => updateAndSync({ crashReports: !preferences.crashReports })}
              >
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-primary" />
                  Отчеты о сбоях
                </div>
                <div className={`w-10 h-6 rounded-full relative transition-colors ${preferences.crashReports ? 'bg-primary' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.crashReports ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2 pl-1">
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

              <Button variant="danger" className="w-full mt-2" leftIcon={<Trash2 className="w-4 h-4" />} onClick={handleClearCache}>
                Очистить кэш
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
