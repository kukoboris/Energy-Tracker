import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Check, 
  CheckCheck, 
  Trash2,
  Command,
  FileText,
  DollarSign,
  ArrowRight,
  Zap
} from 'lucide-react';
import { UserAccount, NotificationItem, Invoice } from '../types';
import { FX_RATES, formatTL, formatUSD, formatEUR } from '../utils/formatters';

interface HeaderProps {
  account: UserAccount;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenMobileMenu: () => void;
  onSelectAccountTab?: () => void;
  onLogout?: () => void;
  invoices?: Invoice[];
  onSelectInvoice?: (invoice: Invoice) => void;
  onNavigateTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  notifications,
  setNotifications,
  searchQuery,
  setSearchQuery,
  onOpenMobileMenu,
  onSelectAccountTab,
  onLogout,
  invoices = [],
  onSelectInvoice,
  onNavigateTab
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Keyboard shortcut Cmd+K / Ctrl+K or /
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowNotifications(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (showCommandPalette) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showCommandPalette]);

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Filtered invoices for search
  const searchResults = searchQuery.trim()
    ? invoices.filter(inv => 
        inv.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.bill_date.includes(searchQuery) ||
        inv.total_amount_tl.toString().includes(searchQuery) ||
        inv.kwh.toString().includes(searchQuery)
      )
    : [];

  return (
    <>
      <header className="h-20 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8">
        {/* Left: Mobile Menu & Property Info */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              {account.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-mono text-slate-400">
                № {account.meterNumber} • {account.city}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: FX Rate Pill, Search, Notifications, User */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* FX Rates Indicator */}
          <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-white/5 text-[11px] font-mono text-slate-400">
            <span className="text-sky-400 font-bold">FX:</span>
            <span>$1 = {FX_RATES.USD} TL</span>
            <span className="text-slate-600">•</span>
            <span>€1 = {FX_RATES.EUR} TL</span>
          </div>

          {/* Quick Search Button / Command Trigger */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-3 bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 px-3.5 py-2 rounded-full text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-sm group"
            title="Быстрый поиск счетов и навигация (Cmd+K)"
          >
            <Search className="w-4 h-4 text-sky-400 group-hover:text-sky-300 transition-colors" />
            <span className="text-xs font-mono hidden sm:inline text-slate-400">
              Поиск счетов, периода...
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded-md border border-white/10 text-slate-300">
              ⌘K
            </kbd>
          </button>

          {/* Notifications Button & Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Уведомления"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-950 font-mono">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-sm glass-card bg-slate-950/95 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">Уведомления</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-mono font-bold">
                        {unreadCount} новых
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-sky-400 hover:text-sky-300 transition-colors font-medium cursor-pointer"
                      >
                        Прочитать все
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors font-medium cursor-pointer ml-1"
                      >
                        Очистить
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Bell className="w-7 h-7 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">Все уведомления прочитаны</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && toggleRead(n.id)}
                        className={`p-3 rounded-xl border text-xs transition-all relative group ${
                          n.read
                            ? 'bg-slate-900/40 border-white/5 text-slate-400'
                            : 'bg-sky-500/10 border-sky-500/30 text-slate-200 cursor-pointer hover:bg-sky-500/15'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                          {n.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                          {n.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
                          {n.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                          
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-white truncate text-xs">{n.title}</p>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-300 break-words">{n.message}</p>
                            <span className="text-[9px] font-mono text-slate-400 mt-1 block">{n.timestamp}</span>
                          </div>
                        </div>

                        {/* Quick Item Actions */}
                        <div className="absolute top-2.5 right-2 flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => toggleRead(n.id, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-sky-400 hover:bg-white/5 transition-colors cursor-pointer"
                            title={n.read ? 'Сделать непрочитанным' : 'Отметить прочитанным'}
                          >
                            {n.read ? <Check className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => deleteNotification(n.id, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Account Avatar */}
          <button
            onClick={onSelectAccountTab}
            className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center font-bold text-xs text-sky-400 hover:border-sky-400 transition-all shadow-md cursor-pointer font-mono"
            title="Параметры аккаунта и счетчика"
          >
            KK
          </button>
        </div>
      </header>

      {/* Global Command Palette / Search Modal (Cmd+K) */}
      {showCommandPalette && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4"
          onClick={() => setShowCommandPalette(false)}
        >
          <div 
            className="glass-card bg-slate-950/95 border border-white/15 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <Search className="w-5 h-5 text-sky-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск счетов (напр. '2026-07', 'Июль', '7185', '1133')..."
                className="w-full bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-slate-500 font-mono"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-400 border border-white/10">
                ESC
              </kbd>
            </div>

            {/* Quick Suggestions & Results */}
            <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar space-y-3">
              {searchQuery.trim() === '' ? (
                <div className="space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Быстрые разделы
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'dashboard', label: 'Обзор (Дашборд)', desc: 'Главная панель и KPI' },
                      { id: 'invoices', label: 'Счета и реестр', desc: 'Все 19 квитанций' },
                      { id: 'analytics', label: 'Аналитика расхода', desc: 'Сравнение и графики' },
                      { id: 'alerts', label: 'Правила и лимиты', desc: 'Настройка порогов' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onNavigateTab?.(tab.id);
                          setShowCommandPalette(false);
                        }}
                        className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-sky-500/30 hover:bg-slate-900 text-left transition-all group cursor-pointer"
                      >
                        <span className="font-bold text-white block group-hover:text-sky-300">{tab.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{tab.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-mono text-xs">
                  Ничего не найдено по запросу «{searchQuery}»
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-1">
                    Найдено счетов: {searchResults.length}
                  </div>
                  {searchResults.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        onSelectInvoice?.(inv);
                        setShowCommandPalette(false);
                      }}
                      className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-sky-500/40 hover:bg-slate-900 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xs font-mono">
                          {inv.period.split('-')[1]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white font-mono group-hover:text-sky-300">
                            Период: {inv.period}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {inv.kwh.toLocaleString('ru-RU')} кВт·ч • Срок: {inv.due_date}
                          </p>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <p className="text-xs font-bold text-white">
                          {formatTL(inv.total_amount_tl)} TL
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {inv.status === 'PAID' ? 'Оплачен' : 'К оплате'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
