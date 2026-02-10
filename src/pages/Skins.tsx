import React, { useState } from 'react';
import { Upload, Save, Shirt, Download, Search, Loader2, Check } from 'lucide-react';
import { SkinViewer } from '../components/ui/SkinViewer';
import { useStore } from '../store/useStore';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const SKIN_LIBRARY = [
  { id: 'steve', name: 'Steve', url: 'https://textures.minecraft.net/texture/31f477eb1a7b83f53c852ebe45056fb491626f55567303310023d537a85d2' },
  { id: 'alex', name: 'Alex', url: 'https://textures.minecraft.net/texture/c66002012891d4e414c251480072793e1763787f707337915351390435c523' },
  { id: 'techno', name: 'Technoblade', url: 'https://textures.minecraft.net/texture/9776d6560b411d3167195325b3997193f4164328574768345722353381014b' },
  { id: 'dream', name: 'Dream', url: 'https://textures.minecraft.net/texture/1795c72e276229566373801e00782782797e884102c776077977405786735' },
  { id: 'philza', name: 'Philza', url: 'https://textures.minecraft.net/texture/e5b667954572973797c2310115c544837537330776384594619379633391' },
];

const Skins = () => {
  const { activeAccount } = useStore();
  const { showToast } = useToast();
  const [skinUrl, setSkinUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [modelType, setModelType] = useState<'classic' | 'slim'>('classic');

  const currentSkin = skinUrl || (activeAccount?.username ? `https://minotar.net/skin/${activeAccount.username}` : undefined);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSkinUrl(event.target.result as string);
          setLoading(false);
          showToast('Скин успешно загружен из файла', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applySkin = (url: string, name?: string) => {
    setLoading(true);
    setSkinUrl(url);
    setTimeout(() => {
      setLoading(false);
      showToast(`Скин ${name || ''} выбран`, 'success');
    }, 500);
  };

  const handleSearchSkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setLoading(true);
    showToast(`Поиск скина игрока ${searchQuery}...`, 'info');

    const url = `https://minotar.net/skin/${searchQuery}`;

    try {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setSkinUrl(url);
        setLoading(false);
        setIsSearching(false);
        showToast(`Скин игрока ${searchQuery} найден`, 'success');
      };
      img.onerror = () => {
        setLoading(false);
        setIsSearching(false);
        showToast(`Игрок ${searchQuery} не найден`, 'error');
      };
    } catch {
      setLoading(false);
      setIsSearching(false);
      showToast('Ошибка при поиске скина', 'error');
    }
  };

  const handleSaveSkin = async () => {
    if (!skinUrl) {
      showToast('Сначала выберите скин', 'warning');
      return;
    }

    if (!activeAccount || activeAccount.type !== 'microsoft') {
      showToast('Требуется авторизация через Microsoft (Лицензия)', 'error');
      return;
    }

    setLoading(true);
    showToast('Загрузка скина на серверы Mojang...', 'info');

    if (window.astra) {
      try {
        const result = await window.astra.skins.upload({
          accountId: activeAccount.id,
          skinData: skinUrl,
          variant: modelType,
        });

        if (result.success) {
          showToast('Скин успешно обновлен!', 'success');
        } else {
          showToast(`Ошибка: ${result.error}`, 'error');
        }
      } catch {
        showToast('Ошибка соединения с лаунчером', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      showToast('Доступно только в приложении', 'warning');
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Скины и Плащи</h1>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl font-medium transition-colors cursor-pointer border border-white/10">
            <Upload className="w-5 h-5" />
            Загрузить файл
            <input type="file" accept=".png" className="hidden" onChange={handleFileUpload} />
          </label>
          <Button onClick={handleSaveSkin} leftIcon={<Save className="w-5 h-5" />}>
            Применить
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-primary" />
              Настройки модели
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-text-secondary">Тип модели</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={modelType === 'classic' ? 'outline' : 'ghost'}
                    className={modelType === 'classic' ? 'text-primary border-primary bg-primary/10 hover:bg-primary/20' : ''}
                    onClick={() => setModelType('classic')}
                  >
                    Classic (4px)
                  </Button>
                  <Button
                    variant={modelType === 'slim' ? 'outline' : 'ghost'}
                    className={modelType === 'slim' ? 'text-primary border-primary bg-primary/10 hover:bg-primary/20' : ''}
                    onClick={() => setModelType('slim')}
                  >
                    Slim (3px)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-text-secondary">Активный плащ</label>
                <div className="h-32 bg-black/20 rounded-xl border border-white/10 flex items-center justify-center text-text-secondary">
                  Нет активного плаща
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-4">Библиотека скинов</h2>

            <form onSubmit={handleSearchSkin} className="relative mb-4">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Никнейм игрока..."
                rightIcon={
                  <button type="submit" disabled={isSearching} className="p-1 text-text-secondary hover:text-white transition-colors">
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </button>
                }
              />
            </form>

            <div className="grid grid-cols-4 gap-2">
              {SKIN_LIBRARY.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => applySkin(skin.url, skin.name)}
                  className="group relative aspect-square bg-black/20 rounded-lg border border-white/10 hover:border-primary cursor-pointer transition-all overflow-hidden"
                  title={skin.name}
                >
                  <img src={`https://www.mc-heads.net/avatar/${skin.name}`} alt={skin.name} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden relative border border-white/10 bg-gradient-to-br from-background-secondary/50 to-background/50">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button size="icon" variant="secondary" className="bg-black/40 backdrop-blur-md hover:bg-white/10">
              <Download className="w-5 h-5" />
            </Button>
          </div>

          <div className="w-full h-full min-h-[500px] relative">
            {loading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            )}
            <SkinViewer skinUrl={currentSkin} />
          </div>

          <div className="absolute bottom-4 left-0 w-full text-center text-sm text-text-secondary pointer-events-none">
            Левая кнопка мыши - Вращение
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skins;
