import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, CheckCircle, AlertTriangle, Info, X, LogOut, Check, CheckCheck, Trash2 } from 'lucide-react';
import { UserAccount, NotificationItem } from '../types';

interface HeaderProps {
  account: UserAccount;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenMobileMenu: () => void;
  onSelectAccountTab?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  account,
  notifications,
  setNotifications,
  searchQuery,
  setSearchQuery,
  onOpenMobileMenu,
  onSelectAccountTab,
  onLogout
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

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

  // Close notifications on click outside or press Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  return (
    <header className="h-20 border-b border-[#424754] bg-[#0c1324]/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2.5 rounded-xl bg-[#191f31] border border-[#424754] text-[#dce1fb] hover:bg-[#1f2d42] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            {account.name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span className="text-[11px] font-mono text-[#94a3b8] uppercase">
              № {account.meterNumber} • {account.city}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Bar */}
        <div className="hidden sm:flex items-center gap-2 bg-[#23293c]/60 border border-[#424754] px-3.5 py-2 rounded-full focus-within:border-[#adc6ff] transition-all">
          <Search className="w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск счетов, периода..."
            className="bg-transparent border-none text-xs focus:outline-none w-36 lg:w-48 placeholder:text-[#94a3b8] text-white font-mono"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#94a3b8] hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Notifications Button */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center border border-[#424754] hover:bg-[#1f2d42] transition-colors cursor-pointer"
            title="Уведомления"
          >
            <Bell className="w-5 h-5 text-[#dce1fb]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#f43f5e] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0c1324] animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-96 max-w-sm glass-card bg-[#161e2e]/98 border border-[#424754] rounded-2xl p-4 shadow-2xl z-50 max-h-[80vh] flex flex-col">
              {/* Header with Title and Actions */}
              <div className="flex items-center justify-between pb-3 border-b border-[#424754] mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Уведомления</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#f43f5e]/20 text-[#f43f5e] text-[10px] font-bold">
                      {unreadCount} новых
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-[#adc6ff] hover:text-white transition-colors font-medium cursor-pointer"
                      title="Прочитать все"
                    >
                      Прочитать все
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-[#94a3b8] hover:text-[#f43f5e] transition-colors font-medium cursor-pointer ml-1"
                      title="Очистить все"
                    >
                      Очистить
                    </button>
                  )}
                  {/* Close button */}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
                    title="Закрыть окно"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List of Notifications */}
              <div className="space-y-2.5 overflow-y-auto custom-scrollbar pr-1 flex-1 min-h-0">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-[#94a3b8]">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">Нет уведомлений</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && toggleRead(n.id)}
                      className={`p-3 rounded-xl border text-xs transition-all relative group ${
                        n.read
                          ? 'bg-[#191f31]/40 border-white/5 text-[#94a3b8]'
                          : 'bg-[#adc6ff]/10 border-[#adc6ff]/30 text-white cursor-pointer hover:bg-[#adc6ff]/15'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />}
                        {n.type === 'alert' && <AlertTriangle className="w-4 h-4 text-[#f43f5e] shrink-0 mt-0.5" />}
                        {n.type === 'info' && <Info className="w-4 h-4 text-[#adc6ff] shrink-0 mt-0.5" />}
                        {n.type === 'success' && <CheckCircle className="w-4 h-4 text-[#4edea3] shrink-0 mt-0.5" />}
                        
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-white truncate">{n.title}</p>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-[#adc6ff] shrink-0" title="Непрочитано" />
                            )}
                          </div>
                          <p className="text-[11px] leading-relaxed text-[#c2c6d6] break-words">{n.message}</p>
                          <span className="text-[9px] font-mono text-[#94a3b8] mt-1.5 block">{n.timestamp}</span>
                        </div>
                      </div>

                      {/* Item Quick Actions */}
                      <div className="absolute top-2.5 right-2 flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => toggleRead(n.id, e)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            n.read
                              ? 'text-[#94a3b8] hover:text-[#adc6ff] hover:bg-white/10'
                              : 'text-[#adc6ff] hover:text-white hover:bg-[#adc6ff]/20'
                          }`}
                          title={n.read ? 'Отметить как непрочитанное' : 'Отметить как прочитанное'}
                        >
                          {n.read ? <Check className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={(e) => deleteNotification(n.id, e)}
                          className="p-1 rounded-md text-[#94a3b8] hover:text-[#f43f5e] hover:bg-[#f43f5e]/10 transition-colors cursor-pointer"
                          title="Удалить уведомление"
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

        {/* User Profile Avatar */}
        <button
          onClick={onSelectAccountTab}
          className="w-10 h-10 rounded-full bg-[#191f31] border border-[#424754] flex items-center justify-center font-bold text-[#adc6ff] hover:border-[#adc6ff] transition-all shadow-md cursor-pointer"
          title="Account Settings"
        >
          KK
        </button>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-10 h-10 rounded-full bg-[#191f31] border border-[#424754] hover:border-[#f43f5e]/50 hover:bg-[#f43f5e]/10 text-[#94a3b8] hover:text-[#f43f5e] flex items-center justify-center transition-all shadow-md cursor-pointer"
            title="Выйти из системы"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
