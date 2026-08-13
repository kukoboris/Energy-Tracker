import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Upload,
  Plus, 
  CheckCircle, 
  Clock, 
  ArrowUpDown, 
  Zap, 
  DollarSign
} from 'lucide-react';
import { Invoice } from '../types';
import { InvoiceImportModal } from './InvoiceImportModal';
import { formatTL, formatUSD, formatEUR, formatKWh } from '../utils/formatters';

interface InvoicesViewProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onAddInvoice: (invoice: Invoice) => void;
  onImportInvoices?: (invoices: Invoice[]) => void;
  onPayInvoice: (invoiceId: string) => void;
  searchQuery?: string;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onSelectInvoice,
  onAddInvoice,
  onImportInvoices,
  onPayInvoice,
  searchQuery = ''
}) => {
  const [search, setSearch] = useState(searchQuery);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [yearFilter, setYearFilter] = useState<'ALL' | '2026' | '2025'>('ALL');
  const [sortField, setSortField] = useState<'period' | 'kwh' | 'total_amount_tl'>('period');
  const [sortAsc, setSortAsc] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // New Invoice Form State
  const [newPeriod, setNewPeriod] = useState('2026-08');
  const [newBillDate, setNewBillDate] = useState('26.08.2026');
  const [newDueDate, setNewDueDate] = useState('05.09.2026');
  const [newKwh, setNewKwh] = useState<number>(1200);
  const [newRate, setNewRate] = useState<number>(5.69);

  // Computed summary metrics
  const totalPaid = invoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + i.total_amount_tl, 0);

  const totalPending = invoices
    .filter(i => i.status === 'PENDING')
    .reduce((sum, i) => sum + i.total_amount_tl, 0);

  const totalKwh = invoices.reduce((sum, i) => sum + i.kwh, 0);
  const avgMonthlyCost = Math.round(invoices.reduce((sum, i) => sum + i.total_amount_tl, 0) / invoices.length);

  // Filtering & Sorting
  const processed = invoices.filter((inv) => {
    const term = search.toLowerCase();
    const matchesSearch = 
      inv.period.toLowerCase().includes(term) ||
      inv.bill_date.includes(term) ||
      inv.total_amount_tl.toString().includes(term) ||
      inv.kwh.toString().includes(term);
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesYear = yearFilter === 'ALL' || inv.period.startsWith(yearFilter);
    return matchesSearch && matchesStatus && matchesYear;
  });

  processed.sort((a, b) => {
    let comp = 0;
    if (sortField === 'period') comp = a.period.localeCompare(b.period);
    else if (sortField === 'kwh') comp = a.kwh - b.kwh;
    else if (sortField === 'total_amount_tl') comp = a.total_amount_tl - b.total_amount_tl;
    return sortAsc ? comp : -comp;
  });

  const handleExportCSV = () => {
    const headers = 'Period,Bill Date,Due Date,kWh,Daily Avg kWh,Rate TL,Net Amount TL,Total Amount TL,Status\n';
    const rows = processed
      .map(i => `${i.period},${i.bill_date},${i.due_date},${i.kwh},${i.daily_avg_kwh},${i.unit_rate_tl},${i.net_amount_tl},${i.total_amount_tl},${i.status}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Enerji_Invoices_Export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const net = Math.round(newKwh * newRate);
    const tax = Math.round(net * 0.12);
    const total = net + tax;

    const created: Invoice = {
      id: `inv-${Date.now()}`,
      period: newPeriod,
      bill_date: newBillDate,
      due_date: newDueDate,
      kwh: newKwh,
      daily_avg_kwh: Number((newKwh / 31).toFixed(2)),
      unit_rate_tl: newRate,
      net_amount_tl: net,
      total_amount_tl: total,
      tax_amount_tl: tax,
      status: 'PENDING'
    };

    onAddInvoice(created);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-sky-400" />
            Счета и Управление Начислениями
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Просмотр, фильтрация, оплата и экспорт всех счетов по счетчику № 0767090390
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-sky-400 text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer font-mono"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт CSV</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-emerald-400 text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer font-mono"
          >
            <Upload className="w-4 h-4" />
            <span>Импорт / Загрузка</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold shadow-md transition-all cursor-pointer font-mono"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить Счет</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Всего Оплачено</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatTL(totalPaid)} <span className="text-xs text-slate-400 font-normal">TL</span>
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>≈ {formatUSD(totalPaid)}</span>
            <span className="text-emerald-400">{invoices.filter(i => i.status === 'PAID').length} счетов</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ожидают Оплаты</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {formatTL(totalPending)} <span className="text-xs text-amber-400/70 font-normal">TL</span>
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>≈ {formatUSD(totalPending)}</span>
            <span className="text-amber-400 font-bold">{invoices.filter(i => i.status === 'PENDING').length} к оплате</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Суммарный Расход</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatTL(totalKwh)} <span className="text-xs text-slate-400 font-normal">кВт·ч</span>
          </p>
          <p className="text-[10px] text-sky-400 mt-1">
            За весь период наблюдений
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Средний Счет</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {formatTL(avgMonthlyCost)} <span className="text-xs text-slate-400 font-normal">TL/мес</span>
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>≈ {formatUSD(avgMonthlyCost)}</span>
            <span>19 периодов</span>
          </div>
        </div>
      </div>

      {/* Control Bar & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по периоду, дате, сумме..."
            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-sky-400 text-white font-mono placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto font-mono">
          {/* Status Tabs */}
          <div className="flex p-1 bg-slate-900 rounded-xl border border-white/10">
            {(['ALL', 'PAID', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Все' : st === 'PAID' ? 'Оплачен' : 'К оплате'}
              </button>
            ))}
          </div>

          {/* Year Filter */}
          <div className="flex p-1 bg-slate-900 rounded-xl border border-white/10">
            {(['ALL', '2026', '2025'] as const).map((yr) => (
              <button
                key={yr}
                onClick={() => setYearFilter(yr)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  yearFilter === yr
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {yr === 'ALL' ? 'Все годы' : yr}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <button
            onClick={() => {
              if (sortField === 'period') setSortField('total_amount_tl');
              else if (sortField === 'total_amount_tl') setSortField('kwh');
              else setSortField('period');
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-sky-300 font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Сортировка: {sortField === 'period' ? 'Период' : sortField === 'kwh' ? 'Расход' : 'Сумма'}</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 bg-slate-950/80">
                <th className="py-4 px-5">Период</th>
                <th className="py-4 px-5">Дата Счета</th>
                <th className="py-4 px-5">Срок Оплаты</th>
                <th className="py-4 px-5">Расход</th>
                <th className="py-4 px-5">Тариф</th>
                <th className="py-4 px-5">Энергия</th>
                <th className="py-4 px-5">Итого к оплате</th>
                <th className="py-4 px-5 text-center">Статус</th>
                <th className="py-4 px-5 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {processed.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  <td 
                    onClick={() => onSelectInvoice(inv)}
                    className="py-4 px-5 font-bold text-white text-sm cursor-pointer group-hover:text-sky-400"
                  >
                    {inv.period}
                  </td>
                  <td className="py-4 px-5 text-slate-400">{inv.bill_date}</td>
                  <td className="py-4 px-5 text-slate-400">{inv.due_date}</td>
                  <td className="py-4 px-5 text-sky-300 font-bold">
                    {formatTL(inv.kwh)} кВт·ч
                  </td>
                  <td className="py-4 px-5 text-slate-400">
                    {inv.unit_rate_tl.toFixed(3)} TL
                  </td>
                  <td className="py-4 px-5 text-slate-300">
                    {formatTL(inv.net_amount_tl)} TL
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-bold text-white text-sm block">
                      {formatTL(inv.total_amount_tl)} TL
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      ≈ {formatUSD(inv.total_amount_tl)} • {formatEUR(inv.total_amount_tl)}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    {inv.status === 'PENDING' ? (
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                        К оплате
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                        Оплачен
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right space-x-2">
                    {inv.status === 'PENDING' && (
                      <button
                        onClick={() => onPayInvoice(inv.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Оплатить
                      </button>
                    )}
                    <button
                      onClick={() => onSelectInvoice(inv)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-sky-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Квитанция
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Statement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-slate-950 border border-white/10 p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-400" />
              Добавить Показания Счета
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Ручной ввод данных нового счета по электроэнергии.
            </p>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Период (ГГГГ-ММ)</label>
                <input
                  type="text"
                  required
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Дата Счета</label>
                  <input
                    type="text"
                    required
                    value={newBillDate}
                    onChange={(e) => setNewBillDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Срок Оплаты</label>
                  <input
                    type="text"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Расход (кВт·ч)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newKwh}
                    onChange={(e) => setNewKwh(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Тариф (TL/кВт·ч)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs text-slate-400 font-mono">
                <div className="flex justify-between">
                  <span>Энергия:</span>
                  <span>{Math.round(newKwh * newRate)} TL</span>
                </div>
                <div className="flex justify-between font-bold text-white mt-1">
                  <span>Итого с налогами (+12%):</span>
                  <span className="text-sky-400">{Math.round(newKwh * newRate * 1.12)} TL</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs font-bold hover:text-white cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Создать Счет
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <InvoiceImportModal
          onClose={() => setShowImportModal(false)}
          onImportInvoices={(newInvoices) => {
            if (onImportInvoices) {
              onImportInvoices(newInvoices);
            } else {
              newInvoices.forEach(inv => onAddInvoice(inv));
            }
          }}
        />
      )}
    </div>
  );
};
