import React from 'react';
import { X, Printer, Download, CheckCircle, Clock, Zap, Building, FileCheck } from 'lucide-react';
import { Invoice, UserAccount } from '../types';

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
      <div className="glass-card bg-[#0c1324] border border-[#424754] rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-full bg-[#191f31] border border-[#424754] text-[#94a3b8] hover:text-white hover:bg-[#1f2d42] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#424754] pb-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#adc6ff] to-[#4cd7f6] flex items-center justify-center text-[#001a42] shadow-md">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">КВИТАНЦИЯ ОБ ЭЛЕКТРОЭНЕРГИИ</h2>
              <p className="text-[11px] font-mono text-[#adc6ff]">
                ID Документа: {invoice.id.toUpperCase()} • Период: {invoice.period}
              </p>
            </div>
          </div>
        </div>

        {/* Bill Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#151b2d] rounded-2xl border border-[#424754] mb-6 font-mono text-xs">
          <div>
            <span className="text-[10px] text-[#94a3b8] uppercase block">Дата Счета</span>
            <span className="font-bold text-white">{invoice.bill_date}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#94a3b8] uppercase block">Срок Оплаты</span>
            <span className="font-bold text-[#adc6ff]">{invoice.due_date}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#94a3b8] uppercase block">№ Счетчика</span>
            <span className="font-bold text-white">{account.meterNumber}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#94a3b8] uppercase block">Тариф</span>
            <span className="font-bold text-[#4edea3]">{account.tariff}</span>
          </div>
        </div>

        {/* Customer Address Info */}
        <div className="p-4 bg-[#191f31]/60 rounded-2xl border border-white/5 mb-6 space-y-1">
          <p className="text-xs font-bold text-white">{account.name}</p>
          <p className="text-xs text-[#94a3b8]">{account.address}</p>
          <p className="text-xs text-[#94a3b8]">{account.city}</p>
        </div>

        {/* Itemized Calculation Table */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Детализация Начислений</h3>
          
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-2 border-b border-[#424754]/50">
              <span className="text-[#dce1fb]">
                Активная Энергия ({invoice.kwh.toLocaleString('ru-RU')} кВт·ч по {invoice.unit_rate_tl.toFixed(4)} TL)
              </span>
              <span className="font-bold text-white">{net.toLocaleString('ru-RU')} TL</span>
            </div>

            <div className="flex justify-between py-2 border-b border-[#424754]/50">
              <span className="text-[#94a3b8]">Среднесуточное Потребление</span>
              <span className="text-white">{invoice.daily_avg_kwh} кВт·ч/день</span>
            </div>

            <div className="flex justify-between py-2 border-b border-[#424754]/50">
              <span className="text-[#94a3b8]">Распределение и Налоги (12%)</span>
              <span className="text-white">{tax.toLocaleString('ru-RU')} TL</span>
            </div>

            <div className="flex justify-between py-3 text-sm font-bold pt-2">
              <span className="text-white">ИТОГО К ОПЛАТЕ</span>
              <span className="text-xl text-[#adc6ff]">
                {invoice.total_amount_tl.toLocaleString('ru-RU')} TL
              </span>
            </div>
          </div>
        </div>

        {/* Status & Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#424754]">
          <div className="flex items-center gap-2">
            {invoice.status === 'PAID' ? (
              <span className="px-3 py-1.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] text-xs font-bold flex items-center gap-1.5 border border-[#4edea3]/30">
                <CheckCircle className="w-4 h-4" /> Счет Оплачен
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] text-xs font-bold flex items-center gap-1.5 border border-[#f59e0b]/30">
                <Clock className="w-4 h-4" /> Ожидает Оплаты
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#191f31] border border-[#424754] text-[#adc6ff] text-xs font-bold hover:bg-[#1f2d42] transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Печать / PDF</span>
            </button>

            {invoice.status === 'PENDING' && (
              <button
                onClick={() => {
                  onPayInvoice(invoice.id);
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4edea3] text-[#002113] text-xs font-bold hover:bg-[#6ffbbe] transition-all shadow-md"
              >
                <FileCheck className="w-4 h-4" />
                <span>Оплатить {invoice.total_amount_tl.toLocaleString('ru-RU')} TL</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
