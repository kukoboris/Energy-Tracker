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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-sky-500/10">
            <Zap className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white block">Enerji Pro</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">Панель управления</span>
          </div>
        </div>
        <button 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-4 space-y-1.5">
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="pt-6 pb-2 px-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-mono">Интеграции</span>
        </div>

        <button
          onClick={() => {
            setCurrentTab('googlesheet');
            setMobileOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold ${
            currentTab === 'googlesheet'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span>Google Таблицы</span>
        </button>

        {onLogout && (
          <button
            onClick={() => {
              setMobileOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 cursor-pointer mt-4"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти из аккаунта</span>
          </button>
        )}
      </nav>

      {/* Usage Limit Bento Widget */}
      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5">
          <div className="flex justify-between items-center mb-2 font-mono">
            <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Годовой Лимит</p>
            <span className="text-[10px] text-sky-400 font-bold">{percentUsed}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500" 
              style={{ width: `${percentUsed}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-mono">
            {(account.currentUsageKwh / 1000).toFixed(1)}k / {(account.usageLimitKwh / 1000).toFixed(0)}k кВт·ч
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 h-screen z-50">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="w-72 h-full bg-slate-950 border-r border-white/10 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
