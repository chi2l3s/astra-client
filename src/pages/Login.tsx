import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Shield, ArrowRight, Loader2, Gamepad2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Account } from '../types';

const Login = () => {
  const navigate = useNavigate();
  const { addAccount, setActiveAccount } = useStore();
  const { showToast } = useToast();
  
  const [mode, setMode] = useState<'select' | 'offline'>('select');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    
    try {
      if (window.electron) {
        const result = await window.electron.ipcRenderer.invoke('login-microsoft');
        
        if (result.success) {
          const newAccount: Account = {
            id: crypto.randomUUID(),
            type: 'microsoft',
            username: result.account.username,
            uuid: result.account.uuid,
            isActive: false,
            avatarUrl: `https://minotar.net/helm/${result.account.username}/100.png`
          };
          
          addAccount(newAccount);
          setActiveAccount(newAccount.id);
          showToast(`Добро пожаловать, ${result.account.username}!`, 'success');
          navigate('/');
        } else {
          showToast('Ошибка входа через Microsoft', 'error');
        }
      } else {
        // Fallback for browser dev mode (mock login)
        setTimeout(() => {
          const mockName = "DevUser_" + Math.floor(Math.random() * 1000);
           const newAccount: Account = {
            id: crypto.randomUUID(),
            type: 'microsoft',
            username: mockName,
            uuid: crypto.randomUUID(),
            isActive: false,
            avatarUrl: `https://minotar.net/helm/${mockName}/100.png`
          };
          addAccount(newAccount);
          setActiveAccount(newAccount.id);
          showToast(`[DEV] Вход выполнен: ${mockName}`, 'success');
          navigate('/');
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      showToast('Произошла ошибка при входе', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOfflineLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      const newAccount: Account = {
        id: crypto.randomUUID(),
        type: 'offline',
        username: username,
        uuid: crypto.randomUUID(),
        isActive: false,
        avatarUrl: `https://minotar.net/helm/${username}/100.png`
      };

      addAccount(newAccount);
      setActiveAccount(newAccount.id);
      setIsLoading(false);
      showToast(`Добро пожаловать, ${username}!`, 'success');
      navigate('/');
    }, 800);
  };

  return (
    <div className="flex items-center justify-center min-h-full w-full">
      <div className="w-full max-w-md p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-lg shadow-primary/30 mb-4">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Astra Client
            </h1>
            <p className="text-text-secondary mt-2 text-sm">
              Войдите, чтобы начать игру
            </p>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'select' ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <button
                  onClick={handleMicrosoftLogin}
                  disabled={isLoading}
                  className="w-full group relative flex items-center justify-between p-4 rounded-xl bg-[#2F2F2F] hover:bg-[#3F3F3F] border border-white/5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 21 21" fill="currentColor">
                        <path d="M10.5 0C4.70097 0 0 4.70097 0 10.5C0 16.299 4.70097 21 10.5 21C16.299 21 21 16.299 21 10.5C21 4.70097 16.299 0 10.5 0ZM10.5 19.9995C5.25363 19.9995 1.00049 15.7464 1.00049 10.5C1.00049 5.25363 5.25363 1.00049 10.5 1.00049C15.7464 1.00049 19.9995 5.25363 19.9995 10.5C19.9995 15.7464 15.7464 19.9995 10.5 19.9995Z" />
                        <path d="M11.458 5.95801H9.5415V9.5415H5.95801V11.458H9.5415V15.0415H11.458V11.458H15.0415V9.5415H11.458V5.95801Z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">Microsoft</div>
                      <div className="text-xs text-text-secondary">Лицензионный аккаунт</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-text-secondary text-xs uppercase tracking-wider">или</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button
                  onClick={() => setMode('offline')}
                  disabled={isLoading}
                  className="w-full group relative flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-text-secondary group-hover:text-white transition-colors" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-white">Offline</div>
                      <div className="text-xs text-text-secondary">Пиратский аккаунт</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white transition-colors" />
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="offline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleOfflineLogin}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary ml-1">Никнейм</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Введите никнейм"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-12 py-3 text-white placeholder-text-secondary focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode('select')}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Назад
                  </Button>
                  <Button
                    type="submit"
                    className="flex-[2]"
                    disabled={!username.trim() || isLoading}
                    isLoading={isLoading}
                    rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
                  >
                    Войти
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
        
        <p className="text-center text-xs text-text-secondary mt-8 opacity-50">
          Astra Client v1.0.0
        </p>
      </div>
    </div>
  );
};

export default Login;
