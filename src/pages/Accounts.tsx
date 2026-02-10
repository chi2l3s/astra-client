import React, { useState } from 'react';
import { Plus, User, LogOut, Shield, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { useToast } from '../context/ToastContext';
import { Account } from '../types';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const Accounts = () => {
  const { accounts, activeAccount, addAccount, removeAccount, setActiveAccount } = useStore();
  const { showToast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleMicrosoftLogin = async () => {
    setIsLoggingIn(true);
    showToast('Открываю окно входа Microsoft...', 'info');

    try {
      if (window.astra) {
        const result = await window.astra.auth.loginMicrosoft();
        if (result.success) {
          const newAccount: Account = {
            ...result.account,
          };
          addAccount(newAccount);
          setActiveAccount(newAccount.id);
          setIsAdding(false);
          showToast(`Добро пожаловать, ${result.account.username}!`, 'success');
        } else {
          showToast(result.error || 'Ошибка входа через Microsoft', 'error');
        }
      } else {
        showToast('Вход доступен только в приложении', 'warning');
      }
    } catch {
      showToast('Произошла ошибка при входе', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAddOffline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const newAccount: Account = {
      id: crypto.randomUUID(),
      type: 'offline',
      username: newUsername,
      uuid: crypto.randomUUID(),
      isActive: false,
      avatarUrl: `https://minotar.net/helm/${newUsername}/100.png`,
    };

    addAccount(newAccount);
    if (accounts.length === 0) {
      setActiveAccount(newAccount.id);
    }
    setNewUsername('');
    setIsAdding(false);
    showToast(`Аккаунт ${newUsername} создан`, 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Аккаунты</h1>
        <Button onClick={() => setIsAdding(true)} leftIcon={<Plus className="w-5 h-5" />}>
          Добавить аккаунт
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {accounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                'glass-card p-6 rounded-2xl relative group transition-all duration-300',
                activeAccount?.id === account.id ? 'border-primary/50 ring-1 ring-primary/50' : 'hover:bg-white/5'
              )}
            >
              {activeAccount?.id === account.id && (
                <div className="absolute top-4 right-4 text-primary">
                  <Check className="w-6 h-6" />
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/20 border border-white/10">
                  <img src={account.avatarUrl} alt={account.username} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{account.username}</h3>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    {account.type === 'microsoft' ? (
                      <span className="flex items-center gap-1 text-blue-400">
                        <Shield className="w-3 h-3" /> Microsoft
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-text-secondary">
                        <User className="w-3 h-3" /> Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                {activeAccount?.id !== account.id && (
                  <Button
                    onClick={() => {
                      setActiveAccount(account.id);
                      showToast(`Аккаунт ${account.username} выбран`, 'info');
                    }}
                    variant="secondary"
                    className="flex-1"
                    size="sm"
                  >
                    Выбрать
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (window.astra && account.type === 'microsoft') {
                      window.astra.auth.logoutMicrosoft(account.id);
                    }
                    removeAccount(account.id);
                    showToast('Аккаунт удален', 'info');
                  }}
                  variant="danger"
                  size="icon"
                  className={activeAccount?.id === account.id ? 'ml-auto' : ''}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {accounts.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center text-text-secondary glass-card rounded-2xl border-dashed">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Нет добавленных аккаунтов</p>
            <p className="text-sm opacity-70">Добавьте аккаунт чтобы начать играть</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoggingIn && setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-card p-6 rounded-2xl shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6">Добавить аккаунт</h2>

              <div className="space-y-4">
                <button
                  onClick={handleMicrosoftLogin}
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-3 bg-[#00A4EF] hover:bg-[#0078D7] disabled:opacity-70 disabled:cursor-wait text-white p-3 rounded-xl font-medium transition-colors relative overflow-hidden"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 21 21" fill="currentColor">
                      <path d="M10.5 0C4.70097 0 0 4.70097 0 10.5C0 16.299 4.70097 21 10.5 21C16.299 21 21 16.299 21 10.5C21 4.70097 16.299 0 10.5 0ZM10.5 19.9995C5.25363 19.9995 1.00049 15.7464 1.00049 10.5C1.00049 5.25363 5.25363 1.00049 10.5 1.00049C15.7464 1.00049 19.9995 5.25363 19.9995 10.5C19.9995 15.7464 15.7464 19.9995 10.5 19.9995Z" />
                      <path d="M11.458 5.95801H9.5415V9.5415H5.95801V11.458H9.5415V15.0415H11.458V11.458H15.0415V9.5415H11.458V5.95801Z" />
                    </svg>
                  )}
                  {isLoggingIn ? 'Вход в Microsoft...' : 'Microsoft Account'}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-text-secondary text-sm">ИЛИ</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <form onSubmit={handleAddOffline} className="space-y-4">
                  <div>
                    <Input
                      label="Никнейм"
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Steve"
                      disabled={isLoggingIn}
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsAdding(false)}
                      disabled={isLoggingIn}
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                    <Button type="submit" disabled={!newUsername.trim() || isLoggingIn} className="flex-1">
                      Создать Offline
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accounts;
