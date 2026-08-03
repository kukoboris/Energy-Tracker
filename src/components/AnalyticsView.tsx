import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Sun, 
  Building2, 
  Home, 
  Lightbulb, 
  Check, 
  RefreshCw 
} from 'lucide-react';
import { Invoice, UserAccount } from '../types';
import { generateEnergyTips } from '../services/geminiService';

interface AnalyticsViewProps {
  account: UserAccount;
  invoices: Invoice[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ account, invoices }) => {
  const [selectedTariff, setSelectedTariff] = useState<'MESKEN' | 'COMMERCIAL' | 'SOLAR'>('MESKEN');
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Latest July 2026 Invoice stats
  const latestInvoice = invoices.find(i => i.period === '2026-07') || invoices[invoices.length - 1];

  const fetchAiSuggestions = async () => {
    setLoadingAi(true);
    const tips = await generateEnergyTips(
      latestInvoice.kwh,
      latestInvoice.total_amount_tl,
      latestInvoice.period
    );
    setAiTips(tips);
    setLoadingAi(false);
  };

  useEffect(() => {
    fetchAiSuggestions();
  }, []);

  // Tariff Calculations
  const baseKwh = latestInvoice.kwh;
  let simulatedCost = 0;
  let tariffLabel = '';

  if (selectedTariff === 'MESKEN') {
    simulatedCost = latestInvoice.total_amount_tl;
    tariffLabel = 'Standard Residential (Mesken AG)';
  } else if (selectedTariff === 'COMMERCIAL') {
    simulatedCost = Math.round(baseKwh * 7.45 * 1.18);
    tariffLabel = 'Commercial / Business Rate (Ticarethane)';
  } else if (selectedTariff === 'SOLAR') {
    simulatedCost = Math.round(baseKwh * 0.45 * 5.69); // 55% solar offset
    tariffLabel = 'Hybrid Solar Rooftop (55% Offset)';
  }

  // Cost structure breakdown estimation
  const netEnergyCost = Math.round(latestInvoice.total_amount_tl * 0.72);
  const distributionFee = Math.round(latestInvoice.total_amount_tl * 0.16);
  const municipalTax = Math.round(latestInvoice.total_amount_tl * 0.04);
  const kdvTax = Math.round(latestInvoice.total_amount_tl * 0.08);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <PieChart className="w-8 h-8 text-[#8b5cf6]" />
          Deep Energy Analytics & Cost Structure
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          Detailed cost breakdowns, tariff simulators, seasonal heatmaps, and AI efficiency recommendations
        </p>
      </div>

      {/* AI Smart Optimizer Section */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-r from-[#8b5cf6]/15 via-[#adc6ff]/10 to-transparent border-[#8b5cf6]/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8b5cf6] text-white flex items-center justify-center shadow-lg shadow-[#8b5cf6]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">AI Energy Optimization Advisor</h3>
              <p className="text-[11px] font-mono text-[#adc6ff]">
                Real-time analysis for {account.city} klimatic conditions ({latestInvoice.period})
              </p>
            </div>
          </div>

          <button
            onClick={fetchAiSuggestions}
            disabled={loadingAi}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>Refresh Advice</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {aiTips.map((tip, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#161e2e]/80 border border-white/10 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#adc6ff]/10 text-[#adc6ff] flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold">
                  0{idx + 1}
                </div>
                <p className="text-xs text-[#dce1fb] leading-relaxed">{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Row 2: Tariff Simulator & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tariff Simulator */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#adc6ff]" />
            Tariff Plan Simulator
          </h3>
          <p className="text-xs text-[#94a3b8] mb-6">
            Compare monthly bill for {baseKwh} kWh under different utility tariffs
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setSelectedTariff('MESKEN')}
              className={`p-4 rounded-2xl border text-center transition-all ${
                selectedTariff === 'MESKEN'
                  ? 'bg-[#adc6ff]/15 border-[#adc6ff] text-white shadow-lg'
                  : 'bg-[#151b2d] border-[#424754] text-[#94a3b8] hover:text-white'
              }`}
            >
              <Home className="w-5 h-5 mx-auto mb-2 text-[#adc6ff]" />
              <span className="text-xs font-bold block">Mesken AG</span>
              <span className="text-[10px] opacity-60">Residential</span>
            </button>

            <button
              onClick={() => setSelectedTariff('COMMERCIAL')}
              className={`p-4 rounded-2xl border text-center transition-all ${
                selectedTariff === 'COMMERCIAL'
                  ? 'bg-[#8b5cf6]/15 border-[#8b5cf6] text-white shadow-lg'
                  : 'bg-[#151b2d] border-[#424754] text-[#94a3b8] hover:text-white'
              }`}
            >
              <Building2 className="w-5 h-5 mx-auto mb-2 text-[#8b5cf6]" />
              <span className="text-xs font-bold block">Commercial</span>
              <span className="text-[10px] opacity-60">Business Tariff</span>
            </button>

            <button
              onClick={() => setSelectedTariff('SOLAR')}
              className={`p-4 rounded-2xl border text-center transition-all ${
                selectedTariff === 'SOLAR'
                  ? 'bg-[#4edea3]/15 border-[#4edea3] text-white shadow-lg'
                  : 'bg-[#151b2d] border-[#424754] text-[#94a3b8] hover:text-white'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-2 text-[#4edea3]" />
              <span className="text-xs font-bold block">Solar Roof</span>
              <span className="text-[10px] opacity-60">55% Offset</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-[#151b2d] border border-[#424754] space-y-3">
            <div className="flex justify-between items-center text-xs text-[#94a3b8]">
              <span>Active Selection:</span>
              <span className="font-bold text-white">{tariffLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">Estimated Monthly Bill:</span>
              <span className="text-2xl font-extrabold font-mono text-[#adc6ff]">
                {simulatedCost.toLocaleString('ru-RU')} <span className="text-xs font-normal text-[#94a3b8]">TL</span>
              </span>
            </div>
            {selectedTariff === 'SOLAR' && (
              <p className="text-[11px] text-[#4edea3] pt-2 border-t border-white/5 font-mono">
                ✓ Potential monthly savings: {(latestInvoice.total_amount_tl - simulatedCost).toLocaleString('ru-RU')} TL
              </p>
            )}
          </div>
        </div>

        {/* Cost Structure Breakdown */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#4edea3]" />
            Itemized Bill Cost Composition
          </h3>
          <p className="text-xs text-[#94a3b8] mb-6">
            Detailed allocation of current {latestInvoice.total_amount_tl.toLocaleString('ru-RU')} TL statement
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#adc6ff]">Active Net Energy (72%)</span>
                <span className="font-mono text-white">{netEnergyCost.toLocaleString('ru-RU')} TL</span>
              </div>
              <div className="h-2 w-full bg-[#191f31] rounded-full overflow-hidden">
                <div className="h-full bg-[#adc6ff] w-[72%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#8b5cf6]">Grid Distribution Fee (16%)</span>
                <span className="font-mono text-white">{distributionFee.toLocaleString('ru-RU')} TL</span>
              </div>
              <div className="h-2 w-full bg-[#191f31] rounded-full overflow-hidden">
                <div className="h-full bg-[#8b5cf6] w-[16%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#4edea3]">KDV Value Added Tax 8%</span>
                <span className="font-mono text-white">{kdvTax.toLocaleString('ru-RU')} TL</span>
              </div>
              <div className="h-2 w-full bg-[#191f31] rounded-full overflow-hidden">
                <div className="h-full bg-[#4edea3] w-[8%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#f59e0b]">Municipal Energy Fund 4%</span>
                <span className="font-mono text-white">{municipalTax.toLocaleString('ru-RU')} TL</span>
              </div>
              <div className="h-2 w-full bg-[#191f31] rounded-full overflow-hidden">
                <div className="h-full bg-[#f59e0b] w-[4%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal Monthly Heatmap Card */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
        <h3 className="text-lg font-bold text-white mb-1">12-Month Consumption Matrix</h3>
        <p className="text-xs text-[#94a3b8] mb-6">Comparing monthly volume intensity between 2025 and 2026</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {invoices.map((inv) => {
            const isHigh = inv.kwh > 1000;
            const isMid = inv.kwh > 500 && inv.kwh <= 1000;
            return (
              <div
                key={inv.id}
                className={`p-3.5 rounded-2xl border text-center transition-all hover:scale-105 ${
                  isHigh
                    ? 'bg-[#f43f5e]/15 border-[#f43f5e]/30'
                    : isMid
                    ? 'bg-[#f59e0b]/15 border-[#f59e0b]/30'
                    : 'bg-[#4edea3]/10 border-[#4edea3]/20'
                }`}
              >
                <span className="text-[10px] font-mono font-bold text-[#94a3b8] uppercase block">
                  {inv.period}
                </span>
                <span className="text-base font-extrabold font-mono text-white block mt-1">
                  {inv.kwh.toFixed(0)} <span className="text-[10px] font-normal text-[#94a3b8]">kWh</span>
                </span>
                <span className="text-[10px] font-mono text-[#adc6ff] block mt-1">
                  {inv.total_amount_tl.toLocaleString('ru-RU')} TL
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
