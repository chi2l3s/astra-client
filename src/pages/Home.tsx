import React, { useState, useEffect } from 'react';
import { Play, Gamepad2, ChevronDown, User, GitCommit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { GameConsole } from '../components/ui/GameConsole';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { BlurText } from '../components/ui/animations/BlurText';
import { CountUp } from '../components/ui/animations/CountUp';

import { ShinyButton } from '../components/ui/animations/ShinyButton';

import { ScreenshotsWidget } from '../components/ui/ScreenshotsWidget';
import { ServerList } from '../components/ui/ServerList';

const Home = () => {
  const { user, activeAccount, accounts, selectedVersion, installedVersions, setSelectedVersion, setActiveAccount, downloads, preferences, playStats, recordSession } = useStore();
  const navigate = useNavigate();
  const [showConsole, setShowConsole] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Check if selected version is downloading
  const isDownloading = selectedVersion && downloads[selectedVersion]?.status === 'downloading';

  // Auto-select latest installed version if none selected
  useEffect(() => {
    if (!selectedVersion && installedVersions.length > 0) {
      setSelectedVersion(installedVersions[installedVersions.length - 1].id);
    }
  }, [installedVersions, selectedVersion, setSelectedVersion]);

  const [news, setNews] = useState<{tag: string, title: string, body: string, date: string}[]>([]);

  useEffect(() => {
    // Fetch latest news from a source (e.g. Minecraft RSS or GitHub Releases)
    // For now, let's fetch GitHub Releases as an example
    const fetchNews = async () => {
        try {
            const response = await fetch('https://api.github.com/repos/chi2l3s/astra-client/releases');
            if (response.ok) {
                const data = await response.json();
                const latest = data.slice(0, 2).map((release: any) => ({
                    tag: release.tag_name,
                    title: release.name || release.tag_name,
                    body: release.body || 'Нет описания',
                    date: new Date(release.published_at).toLocaleDateString()
                }));
                setNews(latest);
            } else {
                // Fallback if no releases found yet or API limit
                 setNews([
                    {
                        tag: 'News',
                        title: 'Добро пожаловать в Astra Client',
                        body: 'Лаунчер находится в активной разработке. Следите за обновлениями!',
                        date: new Date().toLocaleDateString()
                    }
                 ]);
            }
        } catch (e) {
             setNews([
                    {
                        tag: 'News',
                        title: 'Добро пожаловать в Astra Client',
                        body: 'Лаунчер находится в активной разработке. Следите за обновлениями!',
                        date: new Date().toLocaleDateString()
                    }
             ]);
        }
    };

    fetchNews();
  }, []);

  const handleLaunch = () => {
    if (!activeAccount) {
      return;
    }
    if (!selectedVersion) {
      return;
    }
    
    // Check if version is actually installed before launching
    const isInstalled = installedVersions.some(v => v.id === selectedVersion);
    if (!isInstalled) {
       // If somehow selected but not installed (e.g. removed), redirect to versions
       navigate('/versions');
       return;
    }

    setIsRunning(true);
    setShowConsole(true);
    setStartTime(Date.now()); // Start timer
    setLogs(['Инициализация запуска...', `Выбранная версия: ${selectedVersion}`, `Аккаунт: ${activeAccount.username}`]);
    if (window.electron) {
      window.electron.ipcRenderer.send('launch-game', {
        version: selectedVersion,
        auth: activeAccount,
        memory: preferences.memoryAllocation // Use from preferences
      });

      // Listen for logs
      const removeListener = window.electron.ipcRenderer.on('game-log', (log: string) => {
        setLogs(prev => [...prev, log]);
      });

      // Listen for exit
      const removeExitListener = window.electron.ipcRenderer.on('game-exit', (code: number) => {
        setLogs(prev => [...prev, `Process exited with code ${code}`]);
        setIsRunning(false);
        
        // Calculate duration and save stats
        if (startTime) {
            const durationMs = Date.now() - startTime;
            const durationMinutes = Math.floor(durationMs / 1000 / 60);
            // Record even if less than a minute (as 0 or 1)
            recordSession(durationMinutes > 0 ? durationMinutes : 1); 
            setStartTime(null);
        }
      });

      // Cleanup listeners on unmount or re-run would be ideal, 
      // but for simplicity in this component we rely on the backend to keep streaming
    } else {
      // Fallback for browser mode (simulation)
      simulateLaunch();
    }
  };

  const simulateLaunch = () => {
    setStartTime(Date.now()); // Start timer for simulation too
    const steps = [
      '[INFO] Building configuration...',
      '[INFO] Checking Java environment...',
      '[INFO] Verified Java 17.0.1',
      '[INFO] Downloading missing assets...',
      '[INFO] Unpacking natives...',
      '[INFO] Launching game process...',
      '[INFO] Setting up OpenGL context...',
      '[INFO] Loading textures...',
      '[INFO] Sound system started.',
      'Minecraft 1.20.4 started successfully.'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(interval);
        // setIsRunning(false); // Keep running to simulate game open
        
        // For simulation, let's finish "game" after 5 seconds
        setTimeout(() => {
            setIsRunning(false);
            if (startTime) {
                const durationMs = Date.now() - startTime;
                const durationMinutes = Math.floor(durationMs / 1000 / 60);
                recordSession(durationMinutes > 0 ? durationMinutes : 1);
                setStartTime(null);
            }
        }, 5000);

      } else {
        setLogs(prev => [...prev, steps[i]]);
        i++;
      }
    }, 800);
  };

  const versionOptions = installedVersions.map(v => ({
    value: v.id,
    label: v.id,
    icon: <Gamepad2 className="w-4 h-4 text-primary" />
  }));

  const accountOptions = accounts.map(a => ({
    value: a.id,
    label: a.username,
    icon: <div className="w-5 h-5 rounded overflow-hidden"><img src={a.avatarUrl} alt="" className="w-full h-full object-cover" /></div>
  }));

  // Add "Add Account" option
  const accountOptionsWithAdd = [
    ...accountOptions,
    { value: 'add_new', label: 'Добавить аккаунт...', icon: <User className="w-4 h-4 text-primary" /> }
  ];

  const handleAccountChange = (val: string) => {
    if (val === 'add_new') {
      navigate('/accounts');
    } else {
      setActiveAccount(val);
    }
  };

  return (
    <div className="space-y-8 relative min-h-full flex flex-col">
      <header className="flex justify-between items-end">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
             <BlurText 
                text={`Привет, ${activeAccount?.username || 'Стив'}!`} 
                className="text-4xl font-bold text-white"
                delay={0.1}
             />
          </div>
          <BlurText 
            text="Готов покорять кубические миры?" 
            className="text-text-secondary text-base font-normal"
            delay={0.2}
            duration={0.8}
          />
        </div>
      </header>

      {/* Hero Section / Content Area */}
      <div className="flex-1 grid grid-cols-3 gap-6">
         <div className="col-span-2 relative rounded-3xl overflow-hidden group border border-white/5 bg-black/40 flex flex-col">
            {/* Stats Overlay */}
            <div className="absolute top-6 left-8 right-8 flex gap-8 z-20">
                <div>
                   <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Время в игре</div>
                   <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1">
                      <CountUp value={Math.floor(playStats.totalPlayTime / 60)} />
                      <span className="text-sm text-text-secondary">ч</span> 
                      <CountUp value={playStats.totalPlayTime % 60} />
                      <span className="text-sm text-text-secondary">м</span>
                   </div>
                </div>
                <div>
                   <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Запусков</div>
                   <div className="text-2xl font-bold font-mono text-white">
                     <CountUp value={playStats.launchCount} />
                   </div>
                </div>
            </div>

            <div className="absolute inset-0 p-8 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-black/60 z-10">
               <h2 className="text-3xl font-bold mb-2">Что нового?</h2>
               <div className="space-y-4">
                 {news.map((item, index) => (
                    <div key={index} className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-primary text-sm font-bold">
                                <GitCommit className="w-4 h-4" />
                                <span>{item.tag}</span>
                            </div>
                            <span className="text-xs text-text-secondary">{item.date}</span>
                        </div>
                        <h3 className="text-white font-medium mb-1">{item.title}</h3>
                        <p className="text-sm text-text-secondary line-clamp-2">{item.body}</p>
                    </div>
                 ))}
                 {news.length === 0 && (
                     <div className="text-text-secondary">Загрузка новостей...</div>
                 )}
               </div>
            </div>
            <img 
              src="./changelog.png" 
              alt="Background" 
              className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
            />
         </div>
         
         <div className="col-span-1 flex flex-col gap-6">
             <div className="bg-black/20 rounded-3xl p-6 border border-white/5 flex flex-col gap-4 max-h-[400px]">
                 <ServerList />
             </div>

             <ScreenshotsWidget />
         </div>
       </div>

      {/* Bottom Bar (Launch Controls) */}
      <div className="sticky -bottom-8 bg-background-secondary/80 backdrop-blur-xl border-t border-white/10 p-6 -mx-8 -mb-8 mt-auto flex items-center justify-between gap-8 z-20">
         <div className="flex items-center gap-6 flex-1">
            {/* Account Selector */}
            <div className="w-64">
              <label className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1.5 block">Аккаунт</label>
              <Select 
                options={accountOptionsWithAdd}
                value={activeAccount?.id || ''}
                onChange={handleAccountChange}
                placeholder="Выберите аккаунт"
                className="w-full"
                direction="up"
              />
            </div>

            {/* Version Selector */}
            <div className="w-64">
               <label className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1.5 block">Версия</label>
               {installedVersions.length > 0 ? (
                 <Select 
                   options={versionOptions}
                   value={selectedVersion || ''}
                   onChange={setSelectedVersion}
                   placeholder="Выберите версию"
                   className="w-full"
                   direction="up"
                 />
               ) : (
                 <Button 
                   variant="secondary"
                   onClick={() => navigate('/versions')}
                   className="w-full justify-between"
                   rightIcon={<ChevronDown className="w-4 h-4" />}
                 >
                   Нет установленных версий
                 </Button>
               )}
            </div>
         </div>

         {/* Launch Button */}
         <ShinyButton 
            onClick={handleLaunch}
            disabled={isRunning || isDownloading || !activeAccount || !selectedVersion}
            className={`
              min-w-[240px] text-xl font-bold py-4
              ${(!isRunning && !isDownloading) ? 'bg-gradient-to-r from-primary to-primary-hover shadow-lg shadow-primary/20 hover:shadow-primary/40 border-0' : ''}
            `}
          >
            {isRunning ? (
                <span className="flex items-center gap-2">ЗАПУСК...</span>
            ) : isDownloading ? (
                <span className="flex items-center gap-2">СКАЧИВАНИЕ...</span>
            ) : (
                <span className="flex items-center gap-2">
                    <Play className="w-6 h-6 fill-current" /> ИГРАТЬ
                </span>
            )}
          </ShinyButton>
      </div>

      <GameConsole 
        isOpen={showConsole} 
        onClose={() => setShowConsole(false)} 
        logs={logs} 
      />
    </div>
  );
};

export default Home;
