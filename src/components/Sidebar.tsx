import React from 'react';
import { 
  Zap, 
  LayoutDashboard, 
  FileText, 
  PieChart, 
  Users, 
  FileSpreadsheet, 
  BellRing,
  X,
  LogOut
} from 'lucide-react';
import { UserAccount } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  account: UserAccount;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  account,
  mobileOpen,
  setMobileOpen,
  onLogout
}) => {
  const percentUsed = Math.min(Math.round((account.currentUsageKwh / account.usageLimitKwh) * 100), 100);

  const navItems = [
    { id: 'dashboard', label: 'Обзор (Дашборд)', icon: LayoutDashboard },
    { id: 'invoices', label: 'Счета и реестр', icon: FileText },
    { id: 'analytics', label: 'Аналитика расхода', icon: PieChart },
    { id: 'alerts', label: 'Правила и лимиты', icon: BellRing },
    { id: 'accounts', label: 'Параметры и счетчик', icon: Users },
  ];

  const content = (
    <div className="flex flex-col h-full">
      {/* Brand Logo */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#adc6ff] to-[#4cd7f6] flex items-center justify-center text-[#001a42] shadow-lg shadow-[#adc6ff]/20">
            <Zap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white block">Enerji Pro</span>
            <span className="text-[10px] text-[#94a3b8] font-mono uppercase tracking-wider block">Панель управления</span>
          </div>
        </div>
        <button 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive
                  ? 'bg-[#adc6ff]/10 text-[#adc6ff] border border-[#adc6ff]/20 shadow-[0_0_15px_rgba(173,198,255,0.1)]'
                  : 'text-[#c2c6d6] hover:bg-[#1f2d42] hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-6 pb-2 px-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Интеграции</span>
        </div>

        <button
          onClick={() => {
            setCurrentTab('googlesheet');
            setMobileOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
            currentTab === 'googlesheet'
              ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 shadow-[0_0_15px_rgba(78,222,163,0.1)]'
              : 'text-[#c2c6d6] hover:bg-[#1f2d42] hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 text-[#4edea3]" />
          <span>Google Таблицы</span>
        </button>

        {onLogout && (
          <button
            onClick={() => {
              setMobileOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium text-[#f43f5e] hover:bg-[#f43f5e]/10 cursor-pointer mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span>Выйти из аккаунта</span>
          </button>
        )}
      </nav>

      {/* Usage Limit Bento Widget */}
      <div className="p-4 mt-auto">
        <div className="glass-card p-4 rounded-2xl bg-[#adc6ff]/5 border-[#adc6ff]/10">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-[#adc6ff] uppercase tracking-wider">Годовой Лимит</p>
            <span className="text-[10px] font-mono text-[#adc6ff] font-bold">{percentUsed}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#191f31] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#adc6ff] to-[#4cd7f6] transition-all duration-500" 
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-[#c2c6d6] mt-2 font-mono">
            {(account.currentUsageKwh / 1000).toFixed(1)}k / {(account.usageLimitKwh / 1000).toFixed(0)}k кВт·ч
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-[#424754] bg-[#0c1324]/80 backdrop-blur-xl sticky top-0 h-screen z-50">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="w-72 h-full bg-[#0c1324] border-r border-[#424754] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
