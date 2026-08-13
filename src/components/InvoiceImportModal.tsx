import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Sparkles, 
  AlertCircle, 
  Download, 
  Plus, 
  RefreshCw, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';
import { Invoice } from '../types';
import { extractInvoiceFromContent } from '../services/geminiService';
import { formatTL } from '../utils/formatters';

interface InvoiceImportModalProps {
  onClose: () => void;
  onImportInvoices: (invoices: Invoice[]) => void;
}

export const InvoiceImportModal: React.FC<InvoiceImportModalProps> = ({
  onClose,
  onImportInvoices
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Staged Invoices for Preview
  const [stagedInvoices, setStagedInvoices] = useState<Invoice[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Form State
  const [manualPeriod, setManualPeriod] = useState('2026-08');
  const [manualBillDate, setManualBillDate] = useState('26.08.2026');
  const [manualDueDate, setManualDueDate] = useState('05.09.2026');
  const [manualKwh, setManualKwh] = useState<number>(1150);
  const [manualRate, setManualRate] = useState<number>(5.69);

  // Download Sample CSV
  const handleDownloadSampleCSV = () => {
    const csvContent = 
      'Period,Bill Date,Due Date,kWh,Rate TL,Net Amount TL,Total Bill TL,Status\n' +
      '2026-08,26.08.2026,05.09.2026,1180,5.69,6714,7520,PENDING\n' +
      '2026-09,26.09.2026,05.10.2026,920,5.75,5290,5925,PENDING\n' +
      '2026-10,26.10.2026,05.11.2026,840,5.75,4830,5410,PENDING\n';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sample_Electricity_Invoices_Import.csv';
    a.click();
  };

  // Handle CSV/JSON/Text parsing
  const processTextFile = async (content: string, fileName: string) => {
    try {
      if (fileName.endsWith('.json')) {
        const parsed = JSON.parse(content);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        const converted: Invoice[] = list.map((item, idx) => {
          const kwh = Number(item.kwh || item.usage || 1000);
          const rate = Number(item.unit_rate_tl || item.rate || 5.69);
          const net = item.net_amount_tl || Math.round(kwh * rate);
          const total = item.total_amount_tl || Math.round(net * 1.12);
          return {
            id: `inv-imp-${Date.now()}-${idx}`,
            period: item.period || '2026-08',
            bill_date: item.bill_date || item.billDate || '26.08.2026',
            due_date: item.due_date || item.dueDate || '05.09.2026',
            kwh,
            daily_avg_kwh: Number((kwh / 31).toFixed(2)),
            unit_rate_tl: rate,
            net_amount_tl: net,
            total_amount_tl: total,
            tax_amount_tl: total - net,
            status: (item.status === 'PAID' ? 'PAID' : 'PENDING')
          };
        });
        setStagedInvoices(prev => [...prev, ...converted]);
        return;
      }

      // Process CSV
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const rows: Invoice[] = [];
        const hasHeader = lines[0].toLowerCase().includes('period') || lines[0].toLowerCase().includes('kwh');
        const startIndex = hasHeader ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length >= 4) {
            const period = cols[0] || '2026-08';
            const bill_date = cols[1] || '26.08.2026';
            const due_date = cols[2] || '05.09.2026';
            const kwh = Number(cols[3]) || 1000;
            const rate = Number(cols[4]) || 5.69;
            const net = cols[5] ? Number(cols[5]) : Math.round(kwh * rate);
            const total = cols[6] ? Number(cols[6]) : Math.round(net * 1.12);
            const status = cols[7] && cols[7].toUpperCase() === 'PAID' ? 'PAID' : 'PENDING';

            rows.push({
              id: `inv-imp-${Date.now()}-${i}`,
              period,
              bill_date,
              due_date,
              kwh,
              daily_avg_kwh: Number((kwh / 31).toFixed(2)),
              unit_rate_tl: rate,
              net_amount_tl: net,
              total_amount_tl: total,
              tax_amount_tl: total - net,
              status
            });
          }
        }

        if (rows.length > 0) {
          setStagedInvoices(prev => [...prev, ...rows]);
          return;
        }
      }

      // Try AI extraction fallback for plain text files
      const aiResult = await extractInvoiceFromContent(content);
      if (aiResult) {
        const net = Math.round(aiResult.kwh * aiResult.unit_rate_tl);
        setStagedInvoices(prev => [
          ...prev,
          {
            id: `inv-imp-${Date.now()}`,
            period: aiResult.period,
            bill_date: aiResult.bill_date,
            due_date: aiResult.due_date,
            kwh: aiResult.kwh,
            daily_avg_kwh: Number((aiResult.kwh / 31).toFixed(2)),
            unit_rate_tl: aiResult.unit_rate_tl,
            net_amount_tl: net,
            total_amount_tl: aiResult.total_amount_tl,
            tax_amount_tl: aiResult.total_amount_tl - net,
            status: 'PENDING'
          }
        ]);
      } else {
        setParseError('Не удалось распознать структуру счета. Попробуйте CSV шаблон.');
      }
    } catch (err) {
      console.error(err);
      setParseError('Ошибка чтения файла. Загрузите корректный CSV, JSON или документ счета.');
    }
  };

  // Handle File Input
  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setParsing(true);
    setParseError(null);

    const file = files[0];
    const isImage = file.type.startsWith('image/');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const aiResult = await extractInvoiceFromContent(base64, file.type);
        setParsing(false);

        if (aiResult) {
          const net = Math.round(aiResult.kwh * aiResult.unit_rate_tl);
          setStagedInvoices(prev => [
            ...prev,
            {
              id: `inv-imp-${Date.now()}`,
              period: aiResult.period,
              bill_date: aiResult.bill_date,
              due_date: aiResult.due_date,
              kwh: aiResult.kwh,
              daily_avg_kwh: Number((aiResult.kwh / 31).toFixed(2)),
              unit_rate_tl: aiResult.unit_rate_tl,
              net_amount_tl: net,
              total_amount_tl: aiResult.total_amount_tl,
              tax_amount_tl: aiResult.total_amount_tl - net,
              status: 'PENDING'
            }
          ]);
        } else {
          setParseError('ИИ не удалось извлечь данные с изображения. Введите вручную или загрузите CSV.');
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        await processTextFile(text, file.name);
        setParsing(false);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    const net = Math.round(manualKwh * manualRate);
    const tax = Math.round(net * 0.12);
    const total = net + tax;

    const newItem: Invoice = {
      id: `inv-imp-${Date.now()}`,
      period: manualPeriod,
      bill_date: manualBillDate,
      due_date: manualDueDate,
      kwh: manualKwh,
      daily_avg_kwh: Number((manualKwh / 31).toFixed(2)),
      unit_rate_tl: manualRate,
      net_amount_tl: net,
      total_amount_tl: total,
      tax_amount_tl: tax,
      status: 'PENDING'
    };

    setStagedInvoices(prev => [...prev, newItem]);
    setActiveTab('upload');
  };

  const handleRemoveStagedItem = (id: string) => {
    setStagedInvoices(prev => prev.filter(i => i.id !== id));
  };

  const handleConfirmImport = () => {
    if (stagedInvoices.length > 0) {
      onImportInvoices(stagedInvoices);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card bg-slate-950 border border-white/10 rounded-[2.5rem] max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Импорт и Загрузка Счетов</h2>
              <p className="text-xs text-slate-400">
                Загружайте CSV, JSON или сканы документов для импорта счетов за электроэнергию
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 font-mono">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Импорт из Файла / OCR</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-sky-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Ручной Ввод</span>
            </button>
          </div>

          <button
            onClick={handleDownloadSampleCSV}
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:underline cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Образец CSV</span>
          </button>
        </div>

        {/* File Dropzone Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : 'border-white/10 bg-slate-900/60 hover:border-sky-400 hover:bg-slate-900'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e.target.files)}
                accept=".csv,.json,.txt,image/*"
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 text-sky-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                {parsing ? <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" /> : <Upload className="w-6 h-6" />}
              </div>

              <h4 className="text-sm font-bold text-white mb-1">
                {parsing ? 'Сканирование и Распознавание...' : 'Перетащите Файлы Счетов Сюда'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Поддерживаются пакеты CSV, JSON или сканы изображений (PNG, JPG) с поддержкой ИИ
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-white/10 text-[10px] font-mono text-sky-300">
                <Sparkles className="w-3 h-3 text-emerald-400" /> На базе Gemini AI Vision
              </div>
            </div>

            {parseError && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-2 text-xs text-rose-300 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{parseError}</span>
              </div>
            )}
          </div>
        )}

        {/* Manual Form Tab */}
        {activeTab === 'manual' && (
          <form onSubmit={handleAddManualItem} className="space-y-4 font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Период (ГГГГ-ММ)</label>
                <input
                  type="text"
                  required
                  value={manualPeriod}
                  onChange={(e) => setManualPeriod(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Дата Счета</label>
                <input
                  type="text"
                  required
                  value={manualBillDate}
                  onChange={(e) => setManualBillDate(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Срок Оплаты</label>
                <input
                  type="text"
                  required
                  value={manualDueDate}
                  onChange={(e) => setManualDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Расход (кВт·ч)</label>
                <input
                  type="number"
                  required
                  value={manualKwh}
                  onChange={(e) => setManualKwh(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Тариф (TL/кВт·ч)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={manualRate}
                  onChange={(e) => setManualRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить в Очередь Импорта</span>
            </button>
          </form>
        )}

        {/* Preview / Staged Queue List */}
        {stagedInvoices.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-4 font-mono">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Готово к Импорту ({stagedInvoices.length} Счетов)
              </h4>
              <button
                onClick={() => setStagedInvoices([])}
                className="text-[10px] text-rose-400 hover:underline cursor-pointer"
              >
                Очистить Очередь
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-2">
              {stagedInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="font-bold text-white mr-3">{inv.period}</span>
                      <span className="text-slate-400">{inv.kwh} кВт·ч по {inv.unit_rate_tl} TL</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sky-400">{formatTL(inv.total_amount_tl)} TL</span>
                    <button
                      onClick={() => handleRemoveStagedItem(inv.id)}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmImport}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Подтвердить и Импортировать {stagedInvoices.length} Счетов</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
