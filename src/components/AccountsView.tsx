import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Zap, 
  Check, 
  Plus, 
  ShieldCheck, 
  Sliders, 
  FileText,
  Save
} from 'lucide-react';
import { UserAccount } from '../types';

interface AccountsViewProps {
  account: UserAccount;
  onUpdateAccount: (updated: UserAccount) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ account, onUpdateAccount }) => {
  const [activeMeterId, setActiveMeterId] = useState('meter-1');
  const [formName, setFormName] = useState(account.name);
  const [formMeter, setFormMeter] = useState(account.meterNumber);
  const [formAddress, setFormAddress] = useState(account.address);
  const [formCity, setFormCity] = useState(account.city);
  const [formLimit, setFormLimit] = useState(account.usageLimitKwh);
  const [isSavedToast, setIsSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAccount({
      ...account,
      name: formName,
      meterNumber: formMeter,
      address: formAddress,
      city: formCity,
      usageLimitKwh: formLimit
    });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const meters = [
    { id: 'meter-1', number: '0767090390', title: 'Главный счетчик - Кемер', active: true, usage: '7 407 кВт·ч' },
    { id: 'meter-2', number: '0767090412', title: 'Вилла - Лара', active: false, usage: '3 120 кВт·ч' },
    { id: 'meter-3', number: '0767090881', title: 'Офис - Муратпаша', active: false, usage: '1 890 кВт·ч' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-sky-400" />
          Управление Аккаунтом и Счетчиками
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Управление подписками на объекты, настройка счетчиков, лимитов потребления и портфеля объектов
        </p>
      </div>

      {/* Save Confirmation Toast */}
      {isSavedToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 font-mono">
          <Check className="w-4 h-4" />
          <span>Параметры аккаунта успешно сохранены в профиле Enerji Pro!</span>
        </div>
      )}

      {/* Grid: Multi-meter list vs Account Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi Meter Selector */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Счетчики Объектов</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-bold font-mono">
              3 Активно
            </span>
          </div>

          <div className="space-y-3">
            {meters.map((m) => (
              <div
                key={m.id}
                onClick={() => setActiveMeterId(m.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeMeterId === m.id
                    ? 'bg-sky-500/10 border-sky-400 text-white shadow-lg'
                    : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-white block">{m.title}</span>
                  {activeMeterId === m.id && <Check className="w-4 h-4 text-sky-400" />}
                </div>
                <p className="text-[11px] font-mono text-sky-300">№ {m.number}</p>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">Текущий расход: {m.usage}</p>
              </div>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/10 text-xs text-slate-400 hover:text-white hover:border-sky-400 transition-all cursor-pointer font-mono">
            <Plus className="w-4 h-4" />
            <span>Привязать Новый Счетчик</span>
          </button>
        </div>

        {/* Account Details Form */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Детали Подписки и Счетчика
          </h3>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                  Имя Владельца
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                  Номер Счетчика
                </label>
                <input
                  type="text"
                  required
                  value={formMeter}
                  onChange={(e) => setFormMeter(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                  Зарегистрированный Адрес
                </label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1 font-mono">
                  Город / Регион
                </label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Quota Slider */}
            <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  Годовой Лимит Потребления
                </span>
                <span className="text-sky-400 font-bold">{formLimit.toLocaleString('ru-RU')} кВт·ч</span>
              </div>
              <input
                type="range"
                min="5000"
                max="25000"
                step="500"
                value={formLimit}
                onChange={(e) => setFormLimit(Number(e.target.value))}
                className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 font-mono">
                Включает предупреждение при превышении 75% установленного годового лимита.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-white/5 font-mono">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Договор PDF</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить Изменения</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
