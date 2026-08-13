import React from 'react';
import { X, Printer, CheckCircle, Clock, Zap, FileCheck } from 'lucide-react';
import { Invoice, UserAccount } from '../types';
import { formatTL, formatUSD, formatEUR, formatKWh } from '../utils/formatters';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  account: UserAccount;
  onClose: () => void;
  onPayInvoice: (invoiceId: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  account,
  onClose,
  onPayInvoice
}) => {
  const handlePrint = () => {
    window.print();
  };

  const tax = invoice.tax_amount_tl || Math.round(invoice.net_amount_tl * 0.12);
  const net = Math.round(invoice.net_amount_tl);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-card bg-slate-950 border border-white/10 rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-white/10 pb-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-400 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">КВИТАНЦИЯ ОБ ЭЛЕКТРОЭНЕРГИИ</h2>
              <p className="text-[11px] font-mono text-sky-400">
                ID Документа: {invoice.id.toUpperCase()} • Период: {invoice.period}
              </p>
            </div>
          </div>
        </div>

        {/* Bill Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-900/80 rounded-2xl border border-white/5 mb-6 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Дата Счета</span>
            <span className="font-bold text-white">{invoice.bill_date}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Срок Оплаты</span>
            <span className="font-bold text-sky-400">{invoice.due_date}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">№ Счетчика</span>
            <span className="font-bold text-white">{account.meterNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Тариф</span>
            <span className="font-bold text-emerald-400">{account.tariff}</span>
          </div>
        </div>

        {/* Customer Address Info */}
        <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 mb-6 space-y-1">
          <p className="text-xs font-bold text-white">{account.name}</p>
          <p className="text-xs text-slate-400">{account.address}</p>
          <p className="text-xs text-slate-400">{account.city}</p>
        </div>

        {/* Itemized Calculation Table */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Детализация Начислений</h3>
          
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-300">
                Активная Энергия ({formatKWh(invoice.kwh)} по {invoice.unit_rate_tl.toFixed(4)} TL)
              </span>
              <span className="font-bold text-white">{formatTL(net)} TL</span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">Среднесуточное Потребление</span>
              <span className="text-white">{invoice.daily_avg_kwh} кВт·ч/день</span>
            </div>

            <div className="flex justify-between py-2 border-b border-white/5">
              <span className="text-slate-400">Распределение и Налоги (12%)</span>
              <span className="text-white">{formatTL(tax)} TL</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between py-3 text-sm font-bold pt-2 border-t border-white/10">
              <span className="text-white">ИТОГО К ОПЛАТЕ</span>
              <div className="text-right">
                <span className="text-2xl text-sky-400 font-mono">
                  {formatTL(invoice.total_amount_tl)} TL
                </span>
                <span className="text-xs text-slate-400 font-mono block">
                  ≈ {formatUSD(invoice.total_amount_tl)} • {formatEUR(invoice.total_amount_tl)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status & Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 font-mono">
          <div className="flex items-center gap-2">
            {invoice.status === 'PAID' ? (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4" /> Счет Оплачен
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-amber-500/20">
                <Clock className="w-4 h-4" /> Ожидает Оплаты
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-200 text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Печать / PDF</span>
            </button>

            {invoice.status === 'PENDING' && (
              <button
                onClick={() => {
                  onPayInvoice(invoice.id);
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>Оплатить {formatTL(invoice.total_amount_tl)} TL</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
