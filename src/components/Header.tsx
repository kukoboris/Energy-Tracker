import React, { useState } from 'react';
import { Menu, Search, Bell, CheckCircle, AlertTriangle, Info, X, LogOut } from 'lucide-react';
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-20 border-b border-[#424754] bg-[#0c1324]/50 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2.5 rounded-xl bg-[#191f31] border border-[#424754] text-[#dce1fb] hover:bg-[#1f2d42]"
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
            placeholder="Search invoices, period..."
            className="bg-transparent border-none text-xs focus:outline-none w-36 lg:w-48 placeholder:text-[#94a3b8] text-white font-mono"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#94a3b8] hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center border border-[#424754] hover:bg-[#1f2d42] transition-colors"
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
            <div className="absolute right-0 mt-3 w-80 sm:w-96 glass-card bg-[#161e2e]/95 border border-[#424754] rounded-2xl p-4 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-3 border-b border-[#424754] mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#f43f5e]/20 text-[#f43f5e] text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-[#adc6ff] hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <p className="text-xs text-[#94a3b8] text-center py-4">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        n.read
                          ? 'bg-[#191f31]/50 border-white/5 text-[#94a3b8]'
                          : 'bg-[#adc6ff]/10 border-[#adc6ff]/20 text-white'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0 mt-0.5" />}
                        {n.type === 'alert' && <AlertTriangle className="w-4 h-4 text-[#f43f5e] shrink-0 mt-0.5" />}
                        {n.type === 'info' && <Info className="w-4 h-4 text-[#adc6ff] shrink-0 mt-0.5" />}
                        {n.type === 'success' && <CheckCircle className="w-4 h-4 text-[#4edea3] shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <p className="font-bold text-white mb-0.5">{n.title}</p>
                          <p className="text-[11px] leading-relaxed text-[#c2c6d6]">{n.message}</p>
                          <span className="text-[9px] font-mono text-[#94a3b8] mt-1.5 block">{n.timestamp}</span>
                        </div>
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
