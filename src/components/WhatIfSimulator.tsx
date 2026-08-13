import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  SlidersHorizontal, 
  Sun, 
  Wind, 
  Moon, 
  TrendingDown, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Leaf,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { formatTL, formatUSD, formatEUR } from '../utils/formatters';

interface WhatIfSimulatorProps {
  currentMonthlyKwh?: number;
  currentUnitRate?: number;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  currentMonthlyKwh = 1133,
  currentUnitRate = 5.69
}) => {
  // AC Temperature Setpoint (°C) -> 21°C to 27°C (default 23°C)
  const [acTemp, setAcTemp] = useState<number>(23);

  // Night Shift percentage -> 0% to 50%
  const [nightShiftPct, setNightShiftPct] = useState<number>(25);

  // Solar PV capacity: 0 kWp (None), 5 kWp, 10 kWp
  const [solarCapacity, setSolarCapacity] = useState<number>(5);

  // Baseline Monthly Bill
  const taxMultiplier = 1.12;
  const baseCost = currentMonthlyKwh * currentUnitRate * taxMultiplier;

  // 1. AC Delta Calculation: each degree above 22°C saves ~7% of AC load (AC is ~60% of summer bill)
  // Baseline is 22°C (0% saving). 23°C = ~7% AC saving, 26°C = ~28% AC saving.
  const acLoadPortion = 0.60;
  const acDeltaFactor = (acTemp - 22) * 0.07; 
  const acKwhSavings = Math.max(0, currentMonthlyKwh * acLoadPortion * acDeltaFactor);
  const acTlSavings = acKwhSavings * currentUnitRate * taxMultiplier;

  // 2. Night Shift (T3) Calculation:
  // Daytime/Peak rate is ~5.69 TL, Night rate is ~3.15 TL (savings ~2.54 TL per kWh shifted)
  const shiftedKwh = (currentMonthlyKwh * 0.35) * (nightShiftPct / 100);
  const nightTlSavings = shiftedKwh * 2.54 * taxMultiplier;

  // 3. Solar PV Generation (Kemer has ~300 sunny days/yr, ~130 kWh/kWp/month in summer):
  const solarGenKwhPerKwp = 130;
  const solarMonthlyKwh = solarCapacity * solarGenKwhPerKwp;
  const solarEffectiveKwh = Math.min(currentMonthlyKwh, solarMonthlyKwh);
  const solarTlSavings = solarEffectiveKwh * currentUnitRate * taxMultiplier;

  // Total savings
  const totalKwhSaved = Math.min(currentMonthlyKwh * 0.95, acKwhSavings + solarEffectiveKwh);
  const totalTlSaved = Math.min(baseCost * 0.95, acTlSavings + nightTlSavings + solarTlSavings);
  const newProjectedCost = Math.max(baseCost * 0.05, baseCost - totalTlSaved);
  const savingPct = Math.round((totalTlSaved / baseCost) * 100);

  // Solar ROI: Cost is ~$900/kWp (~35,500 TL/kWp)
  const solarCapexTl = solarCapacity * 35500;
  const annualSolarSavingTl = solarTlSavings * 11; // 11 effective sunny months
  const solarPaybackYears = solarCapacity > 0 ? (solarCapexTl / annualSolarSavingTl).toFixed(1) : '0';

  // CO2 reduction: ~0.45 kg CO2 per kWh
  const co2SavedKg = Math.round(totalKwhSaved * 0.45);

  return (
    <div className="glass-card rounded-[2rem] p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Симулятор Оптимизации «What-If»
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Интерактивный
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Моделируйте сценарии управления виллой в Кемере и наблюдайте моментальный пересчет экономии
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/70 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-xs">
          <span className="text-slate-400">Базовый чек:</span>
          <span className="text-white font-bold">{formatTL(baseCost)} TL</span>
        </div>
      </div>

      {/* Main Grid: Controls vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sliders & Controls Column */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. AC Control */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wind className="w-4 h-4 text-sky-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Уставка Кондиционеров (AC)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {acTemp <= 22 ? 'Максимальное охлаждение (Пик)' : acTemp <= 24 ? 'Оптимальный комфорт' : 'Энергосберегающий ECO режим'}
                  </span>
                </div>
              </div>
              <span className="text-sm font-bold font-mono text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
                {acTemp}°C
              </span>
            </div>

            <input
              type="range"
              min={20}
              max={27}
              step={1}
              value={acTemp}
              onChange={(e) => setAcTemp(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>20°C (Холоднее / Дороже)</span>
              <span className="text-emerald-400 font-bold">
                {acTemp > 22 ? `-${Math.round(acDeltaFactor * 100)}% нагрузка AC` : 'Базовый расход'}
              </span>
              <span>27°C (ECO)</span>
            </div>
          </div>

          {/* 2. Night Shift Control */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Перенос нагрузки на ночной тариф T3</span>
                  <span className="text-[10px] text-slate-400 font-mono">Стирка, бойлер, зарядка авто с 22:00 до 06:00</span>
                </div>
              </div>
              <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                {nightShiftPct}% нагрузки
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={nightShiftPct}
              onChange={(e) => setNightShiftPct(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0% (Стандартный график)</span>
              <span className="text-emerald-400">
                Экономия ≈ {formatTL(nightTlSavings)} TL/мес
              </span>
              <span>50% (Макс. перенос)</span>
            </div>
          </div>

          {/* 3. Solar PV Capacity */}
          <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-white block">Солнечная станция (Solar Rooftop)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Генерация собственной энергии в Кемере</span>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-amber-400">
                {solarCapacity === 0 ? 'Без панелей' : `${solarCapacity} кВт·пик`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { kw: 0, label: 'Нет СЭС', desc: '0 кВт·ч/мес' },
                { kw: 5, label: '5 кВт PV', desc: '~650 кВт·ч/мес' },
                { kw: 10, label: '10 кВт PV', desc: '~1 300 кВт·ч/мес' },
              ].map((opt) => (
                <button
                  key={opt.kw}
                  type="button"
                  onClick={() => setSolarCapacity(opt.kw)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    solarCapacity === opt.kw
                      ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-md'
                      : 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <span className="font-bold text-xs block text-white">{opt.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>

            {solarCapacity > 0 && (
              <div className="flex items-center justify-between pt-2 text-[10px] font-mono border-t border-white/5 text-slate-300">
                <span>Оценка окупаемости СЭС: <strong className="text-amber-400 font-bold">{solarPaybackYears} года</strong></span>
                <span>Инвестиции: ≈ {formatTL(solarCapexTl)} TL</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/60 border border-white/10 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              Итог Моделирования
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              -{savingPct}% от чека
            </span>
          </div>

          {/* Main Financial Saving Highlight */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Потенциальная экономия в месяц</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
                +{formatTL(totalTlSaved)}
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">TL / мес</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 mt-1">
              <span>≈ {formatUSD(totalTlSaved)}</span>
              <span className="text-slate-600">•</span>
              <span>≈ {formatEUR(totalTlSaved)}</span>
            </div>
          </div>

          {/* Before / After Comparison */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>Текущий счет без оптимизации:</span>
              <span className="line-through text-slate-500">{formatTL(baseCost)} TL</span>
            </div>
            <div className="flex justify-between items-center text-white font-bold pt-1 border-t border-white/5">
              <span className="text-sky-300">Новый прогнозируемый чек:</span>
              <span className="text-base text-sky-300 font-extrabold">{formatTL(newProjectedCost)} TL</span>
            </div>
            <div className="text-[10px] text-slate-400 text-right">
              ≈ {formatUSD(newProjectedCost)} / {formatEUR(newProjectedCost)}
            </div>
          </div>

          {/* Detailed Contribution Breakdown */}
          <div className="space-y-2 text-xs font-mono">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Вклад каждого фактора:</span>
            
            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-sky-400" /> Термостат AC ({acTemp}°C):
              </span>
              <span className="text-emerald-400 font-bold">+{formatTL(acTlSavings)} TL</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-white/5">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-emerald-400" /> Ночной тариф T3:
              </span>
              <span className="text-emerald-400 font-bold">+{formatTL(nightTlSavings)} TL</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Генерация СЭС ({solarCapacity} кВт):
              </span>
              <span className="text-emerald-400 font-bold">+{formatTL(solarTlSavings)} TL</span>
            </div>
          </div>

          {/* Eco / Green Impact */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <Leaf className="w-4 h-4 text-emerald-400" /> Снижение CO₂ выбросов:
            </span>
            <strong className="text-emerald-400">-{co2SavedKg} кг / мес</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
