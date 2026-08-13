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
  FileSpreadsheet,
  Zap,
  DollarSign
} from 'lucide-react';
import { Invoice } from '../types';
import { InvoiceImportModal } from './InvoiceImportModal';

interface InvoicesViewProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onAddInvoice: (invoice: Invoice) => void;
  onImportInvoices?: (invoices: Invoice[]) => void;
  onPayInvoice: (invoiceId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onSelectInvoice,
  onAddInvoice,
  onImportInvoices,
  onPayInvoice
}) => {
  const [search, setSearch] = useState('');
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
  let processed = invoices.filter((inv) => {
    const matchesSearch = 
      inv.period.toLowerCase().includes(search.toLowerCase()) ||
      inv.bill_date.includes(search) ||
      inv.total_amount_tl.toString().includes(search);
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
            <FileText className="w-8 h-8 text-[#adc6ff]" />
            Счета и Управление Начислениями
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Просмотр, фильтрация, оплата и экспорт всех счетов по счетчику № 0767090390
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#191f31] border border-[#424754] text-[#adc6ff] text-xs font-bold hover:bg-[#1f2d42] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Экспорт CSV</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#191f31] border border-[#424754] text-[#4edea3] text-xs font-bold hover:bg-[#1f2d42] transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Импорт / Загрузка</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#adc6ff] text-[#001a42] text-xs font-bold hover:shadow-[0_0_20px_rgba(173,198,255,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить Счет</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border-[#4edea3]/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Всего Оплачено</span>
            <CheckCircle className="w-4 h-4 text-[#4edea3]" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {totalPaid.toLocaleString('ru-RU')} <span className="text-xs text-[#94a3b8] font-normal">TL</span>
          </p>
          <p className="text-[10px] text-[#4edea3] mt-1 font-mono">
            {invoices.filter(i => i.status === 'PAID').length} счетов закрыто
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border-[#f59e0b]/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Ожидают Оплаты</span>
            <Clock className="w-4 h-4 text-[#f59e0b]" />
          </div>
          <p className="text-2xl font-bold font-mono text-[#f59e0b]">
            {totalPending.toLocaleString('ru-RU')} <span className="text-xs text-[#94a3b8] font-normal">TL</span>
          </p>
          <p className="text-[10px] text-[#f59e0b] mt-1 font-mono">
            {invoices.filter(i => i.status === 'PENDING').length} к оплате
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border-[#adc6ff]/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Суммарный Расход</span>
            <Zap className="w-4 h-4 text-[#adc6ff]" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {totalKwh.toLocaleString('ru-RU')} <span className="text-xs text-[#94a3b8] font-normal">кВт·ч</span>
          </p>
          <p className="text-[10px] text-[#adc6ff] mt-1 font-mono">
            Общее показание за весь период
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border-[#8b5cf6]/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Средний Счет в Месяц</span>
            <DollarSign className="w-4 h-4 text-[#8b5cf6]" />
          </div>
          <p className="text-2xl font-bold font-mono text-white">
            {avgMonthlyCost.toLocaleString('ru-RU')} <span className="text-xs text-[#94a3b8] font-normal">TL/мес</span>
          </p>
          <p className="text-[10px] text-[#8b5cf6] mt-1 font-mono">
            За 19 периодов учета
          </p>
        </div>
      </div>

      {/* Control Bar & Filter Bar */}
      <div className="glass-card p-4 rounded-2xl flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по периоду, дате, сумме..."
            className="w-full bg-[#151b2d] border border-[#424754] rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#adc6ff] text-white font-mono placeholder:text-[#94a3b8]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status Tabs */}
          <div className="flex p-1 bg-[#151b2d] rounded-xl border border-[#424754]">
            {(['ALL', 'PAID', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  statusFilter === st
                    ? 'bg-[#adc6ff] text-[#001a42]'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {st === 'ALL' ? 'Все' : st === 'PAID' ? 'Оплачен' : 'К оплате'}
              </button>
            ))}
          </div>

          {/* Year Filter */}
          <div className="flex p-1 bg-[#151b2d] rounded-xl border border-[#424754]">
            {(['ALL', '2026', '2025'] as const).map((yr) => (
              <button
                key={yr}
                onClick={() => setYearFilter(yr)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  yearFilter === yr
                    ? 'bg-[#adc6ff] text-[#001a42]'
                    : 'text-[#94a3b8] hover:text-white'
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
            className="flex items-center gap-2 px-3 py-2 bg-[#151b2d] border border-[#424754] rounded-xl text-xs text-[#adc6ff] font-bold hover:bg-[#1f2d42]"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="capitalize">Сортировка: {sortField === 'period' ? 'Период' : sortField === 'kwh' ? 'Расход' : 'Сумма'}</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest border-b border-[#424754] bg-[#151b2d]/60">
                <th className="py-4 px-5">Период</th>
                <th className="py-4 px-5">Дата Счета</th>
                <th className="py-4 px-5">Срок Оплаты</th>
                <th className="py-4 px-5">Расход (кВт·ч)</th>
                <th className="py-4 px-5">Тариф</th>
                <th className="py-4 px-5">Энергия</th>
                <th className="py-4 px-5">Итого</th>
                <th className="py-4 px-5 text-center">Статус</th>
                <th className="py-4 px-5 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#424754]">
              {processed.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-white/[0.03] transition-colors group"
                >
                  <td 
                    onClick={() => onSelectInvoice(inv)}
                    className="py-4 px-5 font-bold text-white font-mono text-sm cursor-pointer hover:text-[#adc6ff]"
                  >
                    {inv.period}
                  </td>
                  <td className="py-4 px-5 text-[#94a3b8] text-xs font-mono">{inv.bill_date}</td>
                  <td className="py-4 px-5 text-[#94a3b8] text-xs font-mono">{inv.due_date}</td>
                  <td className="py-4 px-5 text-[#adc6ff] font-bold font-mono text-sm">
                    {inv.kwh.toLocaleString('ru-RU')}
                  </td>
                  <td className="py-4 px-5 text-[#94a3b8] font-mono text-xs">
                    {inv.unit_rate_tl.toFixed(3)} TL
                  </td>
                  <td className="py-4 px-5 text-[#94a3b8] font-mono text-sm">
                    {Math.round(inv.net_amount_tl).toLocaleString('ru-RU')} TL
                  </td>
                  <td className="py-4 px-5 font-bold text-white font-mono text-base">
                    {inv.total_amount_tl.toLocaleString('ru-RU')} <span className="text-[10px] opacity-40 font-normal">TL</span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    {inv.status === 'PENDING' ? (
                      <span className="px-2.5 py-1 rounded-md bg-[#f59e0b]/10 text-[#f59e0b] text-[9px] font-bold uppercase tracking-wider border border-[#f59e0b]/20">
                        К оплате
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-[#4edea3]/10 text-[#4edea3] text-[9px] font-bold uppercase tracking-wider border border-[#4edea3]/20">
                        Оплачен
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right space-x-2">
                    {inv.status === 'PENDING' && (
                      <button
                        onClick={() => onPayInvoice(inv.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#4edea3] text-[#002113] text-xs font-bold hover:bg-[#6ffbbe] transition-colors"
                      >
                        Оплатить
                      </button>
                    )}
                    <button
                      onClick={() => onSelectInvoice(inv)}
                      className="px-3 py-1.5 rounded-lg bg-[#191f31] border border-[#424754] text-[#adc6ff] text-xs font-bold hover:bg-[#1f2d42] transition-colors"
                    >
                      PDF
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card bg-[#161e2e] border border-[#424754] p-6 rounded-3xl max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#adc6ff]" />
              Добавить Показания Счета
            </h3>
            <p className="text-xs text-[#94a3b8] mb-6">
              Ручной ввод данных нового счета по электроэнергии.
            </p>

            <form onSubmit={handleCreateInvoiceSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Период (ГГГГ-ММ)</label>
                <input
                  type="text"
                  required
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Дата Счета</label>
                  <input
                    type="text"
                    required
                    value={newBillDate}
                    onChange={(e) => setNewBillDate(e.target.value)}
                    className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Срок Оплаты</label>
                  <input
                    type="text"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Расход (кВт·ч)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newKwh}
                    onChange={(e) => setNewKwh(Number(e.target.value))}
                    className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Тариф (TL/кВт·ч)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(Number(e.target.value))}
                    className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#191f31] rounded-xl border border-white/5 text-xs text-[#94a3b8] font-mono">
                <div className="flex justify-between">
                  <span>Энергия:</span>
                  <span>{Math.round(newKwh * newRate)} TL</span>
                </div>
                <div className="flex justify-between font-bold text-white mt-1">
                  <span>Итого с налогами (+12%):</span>
                  <span className="text-[#adc6ff]">{Math.round(newKwh * newRate * 1.12)} TL</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#191f31] text-[#94a3b8] text-xs font-bold hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#adc6ff] text-[#001a42] text-xs font-bold hover:bg-white"
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
