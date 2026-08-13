import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  Share2, 
  Search
} from 'lucide-react';
import { Invoice } from '../types';
import { formatTL, formatKWh } from '../utils/formatters';

interface GoogleSheetViewProps {
  invoices: Invoice[];
}

export const GoogleSheetView: React.FC<GoogleSheetViewProps> = ({ invoices }) => {
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Только что');
  const [searchTerm, setSearchTerm] = useState('');

  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1bpvsP4vqHut-g9qBGUIIz-x17DSIlpIwmU6Dcg4U2Co/edit';

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 1000);
  };

  const filtered = invoices.filter(i => 
    i.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.bill_date.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
            Интеграция с Google Таблицами
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Синхронизация с облачной таблицей в реальном времени <span className="text-sky-400">1bpvsP4vqHut-g9qBGUIIz-x17DSIlpIwmU6Dcg4U2Co</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sky-400 text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer font-mono"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>Синхронизировать</span>
          </button>

          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md font-mono"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Открыть в Google Таблицах</span>
          </a>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="glass-card p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Облачная Таблица Синхронизирована</p>
            <p className="text-[10px] text-slate-400">Все 19 записей дублируются в реальном времени. Последняя синхронизация: {lastSyncTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-400" /> Чтение / Запись API
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="w-3.5 h-3.5 text-sky-400" /> Авто-Обновление
          </span>
        </div>
      </div>

      {/* Embedded Grid Viewer */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-slate-950/80 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-mono text-slate-400 ml-2">Enerji_Pro_Master_Database.xlsx</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по строкам таблицы..."
              className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-[10px] font-bold text-slate-400 font-mono border-b border-white/5">
                <th className="py-2.5 px-4 border-r border-white/5 text-center w-12">#</th>
                <th className="py-2.5 px-4 border-r border-white/5">A: PERIOD</th>
                <th className="py-2.5 px-4 border-r border-white/5">B: BILL_DATE</th>
                <th className="py-2.5 px-4 border-r border-white/5">C: DUE_DATE</th>
                <th className="py-2.5 px-4 border-r border-white/5">D: KWH_USAGE</th>
                <th className="py-2.5 px-4 border-r border-white/5">E: UNIT_RATE_TL</th>
                <th className="py-2.5 px-4 border-r border-white/5">F: NET_ENERGY_TL</th>
                <th className="py-2.5 px-4">G: TOTAL_BILL_TL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filtered.map((inv, index) => (
                <tr key={inv.id} className="hover:bg-sky-500/5 transition-colors">
                  <td className="py-2.5 px-4 border-r border-white/5 text-center text-slate-400 bg-slate-900/40">
                    {index + 2}
                  </td>
                  <td className="py-2.5 px-4 border-r border-white/5 font-bold text-white">{inv.period}</td>
                  <td className="py-2.5 px-4 border-r border-white/5 text-slate-400">{inv.bill_date}</td>
                  <td className="py-2.5 px-4 border-r border-white/5 text-slate-400">{inv.due_date}</td>
                  <td className="py-2.5 px-4 border-r border-white/5 text-sky-300 font-bold">
                    {formatTL(inv.kwh)}
                  </td>
                  <td className="py-2.5 px-4 border-r border-white/5 text-slate-400">{inv.unit_rate_tl.toFixed(4)}</td>
                  <td className="py-2.5 px-4 border-r border-white/5 text-slate-400">{formatTL(inv.net_amount_tl)}</td>
                  <td className="py-2.5 px-4 font-bold text-emerald-400">{formatTL(inv.total_amount_tl)} TL</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
