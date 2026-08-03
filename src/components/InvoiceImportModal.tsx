import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Download, 
  Plus, 
  RefreshCw,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Invoice } from '../types';
import { extractInvoiceFromContent } from '../services/geminiService';

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
        setParseError('Could not recognize invoice structure in file. Try using the sample CSV format.');
      }
    } catch (err) {
      console.error(err);
      setParseError('Failed to parse file format. Please upload a valid CSV, JSON, or invoice text document.');
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
          setParseError('AI could not extract invoice details from image. Please enter manually or try CSV.');
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
      <div className="glass-card bg-[#0c1324] border border-[#424754] rounded-[2.5rem] max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full bg-[#191f31] border border-[#424754] text-[#94a3b8] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-[#adc6ff]/15 text-[#adc6ff] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Import & Upload Invoices</h2>
              <p className="text-xs text-[#94a3b8]">
                Upload CSV, JSON, or scanned bill documents to import electricity statements
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between border-b border-[#424754] pb-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-[#adc6ff] text-[#001a42]'
                  : 'bg-[#151b2d] text-[#94a3b8] hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>File Import / OCR</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'manual'
                  ? 'bg-[#adc6ff] text-[#001a42]'
                  : 'bg-[#151b2d] text-[#94a3b8] hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Manual Entry</span>
            </button>
          </div>

          <button
            onClick={handleDownloadSampleCSV}
            className="flex items-center gap-1.5 text-xs text-[#adc6ff] hover:underline font-mono"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sample CSV</span>
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
                  ? 'border-[#4edea3] bg-[#4edea3]/10'
                  : 'border-[#424754] bg-[#151b2d]/60 hover:border-[#adc6ff] hover:bg-[#151b2d]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e.target.files)}
                accept=".csv,.json,.txt,image/*"
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-[#191f31] border border-[#424754] text-[#adc6ff] flex items-center justify-center mx-auto mb-3 shadow-inner">
                {parsing ? <RefreshCw className="w-6 h-6 animate-spin text-[#4edea3]" /> : <Upload className="w-6 h-6" />}
              </div>

              <h4 className="text-sm font-bold text-white mb-1">
                {parsing ? 'Scanning & Parsing Document...' : 'Drag & Drop Invoice Files Here'}
              </h4>
              <p className="text-xs text-[#94a3b8] max-w-sm mx-auto">
                Supports CSV batch files, JSON statements, or AI document scanning for images (PNG, JPG)
              </p>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c1324] border border-[#424754] text-[10px] font-mono text-[#adc6ff]">
                <Sparkles className="w-3 h-3 text-[#4edea3]" /> Powered by Gemini AI Document Vision
              </div>
            </div>

            {parseError && (
              <div className="p-3 bg-[#f43f5e]/15 border border-[#f43f5e]/30 rounded-2xl flex items-center gap-2 text-xs text-[#f43f5e]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}
          </div>
        )}

        {/* Manual Form Tab */}
        {activeTab === 'manual' && (
          <form onSubmit={handleAddManualItem} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Period (YYYY-MM)</label>
                <input
                  type="text"
                  required
                  value={manualPeriod}
                  onChange={(e) => setManualPeriod(e.target.value)}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Bill Date</label>
                <input
                  type="text"
                  required
                  value={manualBillDate}
                  onChange={(e) => setManualBillDate(e.target.value)}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Due Date</label>
                <input
                  type="text"
                  required
                  value={manualDueDate}
                  onChange={(e) => setManualDueDate(e.target.value)}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Usage (kWh)</label>
                <input
                  type="number"
                  required
                  value={manualKwh}
                  onChange={(e) => setManualKwh(Number(e.target.value))}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">Unit Rate (TL/kWh)</label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={manualRate}
                  onChange={(e) => setManualRate(Number(e.target.value))}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#adc6ff] text-[#001a42] text-xs font-bold hover:bg-white transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Import Staging Queue</span>
            </button>
          </form>
        )}

        {/* Preview / Staged Queue List */}
        {stagedInvoices.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#424754] space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#adc6ff]">
                Ready for Import ({stagedInvoices.length} Statements)
              </h4>
              <button
                onClick={() => setStagedInvoices([])}
                className="text-[10px] text-[#f43f5e] hover:underline"
              >
                Clear Queue
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-2">
              {stagedInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-[#151b2d] border border-[#424754] rounded-2xl flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-[#4edea3]" />
                    <div>
                      <span className="font-bold text-white mr-3">{inv.period}</span>
                      <span className="text-[#94a3b8]">{inv.kwh} kWh @ {inv.unit_rate_tl} TL</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#adc6ff]">{inv.total_amount_tl.toLocaleString('ru-RU')} TL</span>
                    <button
                      onClick={() => handleRemoveStagedItem(inv.id)}
                      className="p-1 rounded text-[#f43f5e] hover:bg-[#f43f5e]/10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmImport}
              className="w-full py-3 rounded-2xl bg-[#4edea3] text-[#002113] text-xs font-bold hover:bg-[#6ffbbe] transition-all shadow-lg shadow-[#4edea3]/20 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Import {stagedInvoices.length} Invoices to Database</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
