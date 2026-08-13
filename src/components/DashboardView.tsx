import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Zap,
  TrendingUp,
  Calculator,
  Sparkles,
  Wallet,
  Receipt,
  MapPin,
  FileDown,
  Sun,
  Snowflake,
  Leaf,
  Layers,
  BarChart3,
  Calendar,
  CheckCircle2,
  SlidersHorizontal,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Flame
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Invoice, UserAccount } from '../types';
import { AiForecastCard } from './AiForecastCard';
import { KemerWeatherCard } from './KemerWeatherCard';
import { WhatIfSimulator } from './WhatIfSimulator';
import { formatTL, formatUSD, formatEUR, formatKWh } from '../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  account: UserAccount;
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onNavigateToInvoices: () => void;
}

type HubTab = 'YOY' | 'CLIMATE' | 'TARIFF_PHASES' | 'AI_FORECAST';

export const DashboardView: React.FC<DashboardViewProps> = ({
  account,
  invoices,
  onSelectInvoice,
  onNavigateToInvoices
}) => {
  const [hubTab, setHubTab] = useState<HubTab>('YOY');

  // Chart data for 2025 vs 2026 YoY
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const data2025 = [735, 647, 361, 242, 251, 378, 1181];
  const data2026 = [1511, 939, 756, 281, 143, 288, 1133];

  const barChartData = {
    labels: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл'],
    datasets: [
      {
        label: '2025 Базовый',
        data: data2025,
        backgroundColor: 'rgba(148, 163, 184, 0.3)',
        borderRadius: 6,
        barThickness: 14,
      },
      {
        label: '2026 Текущий',
        data: data2026,
        backgroundColor: '#38bdf8',
        borderRadius: 6,
        barThickness: 14,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' as const },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
        padding: 10,
        borderColor: 'rgba(56, 189, 248, 0.2)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11, weight: 600 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 }, stepSize: 500 },
      },
    },
  };

  // Latest invoice (July 2026)
  const latestInvoice = invoices.find(i => i.period === '2026-07') || invoices[invoices.length - 1];

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* TIER 1: HERO PORTFOLIO HEADER & 4 TOP METRIC CARDS */}
      {/* ========================================================================= */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-card p-6 sm:p-8 rounded-[2rem] relative"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Обзор Энергетического Портфеля
              </h1>
              <span className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-bold uppercase tracking-widest font-mono">
                Вилла • Кемер
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                {account.address}, {account.city}
              </span>
              <div className="flex gap-2 sm:gap-3 mt-1.5 font-mono text-[11px]">
                <span className="font-bold py-1 px-3 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-md">
                  {account.tariff}
                </span>
                <span className="font-bold py-1 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  Счетчик № {account.meterNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-mono">
            <div className="px-4 py-3 rounded-2xl bg-slate-900/60 border border-white/5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Расход 2025 (Год)
              </p>
              <p className="text-xl font-bold text-slate-200">
                {formatTL(account.totalConsumption2025Tl)} <span className="text-xs text-slate-400 font-normal">TL</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {formatTL(account.totalConsumption2025Kwh)} кВт·ч
              </p>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 shadow-sm">
              <p className="text-[10px] font-bold text-sky-300 uppercase tracking-wider mb-0.5">
                Расход 2026 (7 мес)
              </p>
              <p className="text-xl font-bold text-sky-300">
                {formatTL(account.totalConsumption2026Tl)} <span className="text-xs text-sky-400 font-normal">TL</span>
              </p>
              <p className="text-[10px] text-sky-400/80 mt-0.5">
                {formatTL(account.totalConsumption2026Kwh)} кВт·ч (≈ {formatUSD(account.totalConsumption2026Tl)})
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4 Top KPI Cards */}
      <div className="bento-grid">
        {/* KPI 1: Current Bill */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="glass-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Текущий счет (Июль)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="py-2">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {formatTL(latestInvoice.total_amount_tl)}
              </h3>
              <span className="text-sm font-bold text-amber-400 font-mono">TL</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1 flex items-center justify-between">
              <span>≈ {formatUSD(latestInvoice.total_amount_tl)} • {formatEUR(latestInvoice.total_amount_tl)}</span>
              <span className="text-amber-400 font-bold">+68.7% YoY</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
            <span>Срок оплаты</span>
            <span className="text-white">{latestInvoice.due_date}</span>
          </div>
        </motion.div>

        {/* KPI 2: Consumption */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Расход (Июль)
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="py-2">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                {formatTL(latestInvoice.kwh)}
              </h3>
              <span className="text-sm font-bold text-sky-400 font-mono">кВт·ч</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1 flex items-center justify-between">
              <span>Среднесуточный: {latestInvoice.daily_avg_kwh} кВт·ч</span>
              <span className="text-emerald-400 font-bold">-4.0% YoY</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
            <span>Сезон</span>
            <span className="text-sky-300">Пик Охлаждения (AC)</span>
          </div>
        </motion.div>

        {/* KPI 3: YoY Volume Growth */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="glass-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Рост YTD (7 мес)
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="py-2">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                +20.3%
              </h3>
              <span className="text-sm font-bold text-sky-400 font-mono">кВт·ч</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">
              5 055 против 4 201 кВт·ч в 2025
            </div>
          </div>
          <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
            <span>Дельта затрат</span>
            <span className="text-amber-400 font-bold">+145.7% TL</span>
          </div>
        </motion.div>

        {/* KPI 4: Unit Rate */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-card p-5 sm:p-6 rounded-3xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
              Тариф за кВт·ч
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="py-2">
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                5.69
              </h3>
              <span className="text-sm font-bold text-emerald-400 font-mono">TL</span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1 flex items-center justify-between">
              <span>≈ $0.14 / кВт·ч</span>
              <span className="text-rose-400 font-bold">+104% YoY</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono">
            <span>База 2025</span>
            <span className="text-slate-300">2.79 TL/кВт·ч</span>
          </div>
        </motion.div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 2: INTERACTIVE ANALYTICS HUB (PROJECTION TABS) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Hub Tab Switcher Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              Аналитический Центр Проекций
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Исследуйте энергопотребление с разных точек зрения
            </p>
          </div>

          <div className="flex p-1 bg-slate-900/90 rounded-2xl border border-white/5 self-start sm:self-auto font-mono text-xs overflow-x-auto max-w-full">
            {[
              { id: 'YOY', label: 'Динамика YoY', icon: BarChart3 },
              { id: 'CLIMATE', label: 'Погода и Климат', icon: Sun },
              { id: 'TARIFF_PHASES', label: 'Фазы T1-T2-T3', icon: Wallet },
              { id: 'AI_FORECAST', label: 'AI Прогноз', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = hubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setHubTab(tab.id as HubTab)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer font-bold whitespace-nowrap ${
                    isActive
                      ? 'bg-sky-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 1: YoY Dynamics */}
        {hubTab === 'YOY' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* YoY Chart Card */}
            <div className="lg:col-span-8 glass-card p-6 sm:p-8 rounded-[2rem] space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Сравнение Потребления по Месяцам (кВт·ч)
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 font-mono">
                    2025 Базовый vs 2026 Фактический
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-500/50" /> 2025
                  </span>
                  <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" /> 2026
                  </span>
                </div>
              </div>

              <div className="h-56 w-full">
                <Bar data={barChartData} options={barChartOptions} />
              </div>

              {/* Monthly YoY Delta Grid */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
                  Динамика объемов по месяцам YoY (%):
                </span>
                <div className="grid grid-cols-7 gap-1.5 text-center font-mono">
                  {[
                    { m: 'Янв', diff: '+106%', isUp: true },
                    { m: 'Фев', diff: '+45%', isUp: true },
                    { m: 'Мар', diff: '+109%', isUp: true },
                    { m: 'Апр', diff: '+16%', isUp: true },
                    { m: 'Май', diff: '-43%', isUp: false },
                    { m: 'Июн', diff: '-24%', isUp: false },
                    { m: 'Июл', diff: '-4%', isUp: false },
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      className={`p-2 rounded-xl border text-[10px] space-y-0.5 ${
                        item.isUp 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold'
                      }`}
                    >
                      <span className="text-[9px] font-bold text-slate-400 block">{item.m}</span>
                      <span className="font-extrabold block">{item.diff}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* YoY Analytics Insights Side Card */}
            <div className="lg:col-span-4 glass-card p-6 sm:p-8 rounded-[2rem] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Ключевые Выводы YoY</h4>
                    <span className="text-[10px] text-slate-400 font-mono">7 месяцев аудита</span>
                  </div>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Зимний пик (Обогрев):</span>
                    <p className="text-slate-200 text-[11px] leading-relaxed">
                      В I кв. расход вырос на <strong className="text-rose-400">+105%</strong> из-за усиленного электрического отопления.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[9px] text-emerald-400 uppercase font-bold block">Летняя оптимизация AC:</span>
                    <p className="text-slate-200 text-[11px] leading-relaxed">
                      В мае–июле достигнуто чистое снижение потребления на <strong className="text-emerald-400">-13.6%</strong> по сравнению с 2025 г.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <span className="text-[9px] text-amber-400 uppercase font-bold block">Главный драйвер чека:</span>
                    <p className="text-slate-200 text-[11px] leading-relaxed">
                      Рост финальной суммы (+145.7%) вызван удвоением базового тарифа с 2.79 до 5.69 TL/кВт·ч.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Объем: 5 051 кВт·ч</span>
                <span className="text-sky-300 font-bold">Сумма: 28 770 TL</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Climate & Weather */}
        {hubTab === 'CLIMATE' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-6">
              <KemerWeatherCard />
            </div>

            {/* Seasonal Profile Comparison */}
            <div className="lg:col-span-6 glass-card p-6 sm:p-8 rounded-[2rem] space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Климатический Профиль Виллы</h3>
                      <p className="text-[10px] text-slate-400 font-mono">3 сезона нагрузки</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                    ~68% чека — климат
                  </span>
                </div>

                {/* Season Items */}
                <div className="space-y-3 font-mono text-xs">
                  {/* Winter */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sky-400 font-bold flex items-center gap-1.5">
                        <Snowflake className="w-3.5 h-3.5" /> Зима (Обогрев)
                      </span>
                      <span className="text-white font-bold">1 511 кВт·ч/мес</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-400 h-full w-[100%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Конвекторы / Теплый пол</span>
                      <span className="text-sky-300">Пик (100%) • ~8 597 TL</span>
                    </div>
                  </div>

                  {/* Summer */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400 font-bold flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5" /> Лето (Охлаждение)
                      </span>
                      <span className="text-white font-bold">1 133 кВт·ч/мес</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full w-[75%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Сплит-системы AC</span>
                      <span className="text-amber-300">75% от пика • ~6 446 TL</span>
                    </div>
                  </div>

                  {/* Off-season */}
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5" /> Межсезонье (Весна/Осень)
                      </span>
                      <span className="text-white font-bold">212 кВт·ч/мес</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-[14%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Базовая бытовая техника</span>
                      <span className="text-emerald-300">Минимум (14%) • ~1 206 TL</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-slate-400">
                <span>Амплитуда колебаний: <strong className="text-white">7.1x</strong></span>
                <span className="text-sky-300">Метеостанция Kemer</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: 3-Tariff Phase Breakdown */}
        {hubTab === 'TARIFF_PHASES' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Daily living cost & 3-phase split */}
            <div className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-[2rem] space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Суточный Профиль Расходов (3-Tariff)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Распределение по временным зонам суток
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-lg font-bold text-white">231.8 TL</span>
                  <span className="text-[10px] text-slate-400 block">/ день в июле</span>
                </div>
              </div>

              {/* 3-Tariff Phases */}
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Дневной (T1)</span>
                  <span className="text-base font-bold text-white block">118.2 TL</span>
                  <span className="text-[10px] text-sky-400">51% (06:00–17:00)</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Пиковый (T2)</span>
                  <span className="text-base font-bold text-amber-400 block">83.4 TL</span>
                  <span className="text-[10px] text-amber-400">36% (17:00–22:00)</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                  <span className="text-[10px] text-slate-400 block">Ночной (T3)</span>
                  <span className="text-base font-bold text-emerald-400 block">30.2 TL</span>
                  <span className="text-[10px] text-emerald-400">13% (22:00–06:00)</span>
                </div>
              </div>

              {/* 7-Day Weekly Profile */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Профиль по дням недели:</span>
                  <span className="text-amber-400 font-bold">Выходные +26% (Вилла)</span>
                </div>
                <div className="flex items-end justify-between gap-2 h-14 pt-2 border-t border-white/5">
                  {[
                    { day: 'Пн', pct: '75%' },
                    { day: 'Вт', pct: '73%' },
                    { day: 'Ср', pct: '80%' },
                    { day: 'Чт', pct: '77%' },
                    { day: 'Пт', pct: '88%' },
                    { day: 'Сб', pct: '98%', peak: true },
                    { day: 'Вс', pct: '100%', peak: true },
                  ].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full bg-slate-900 rounded-t-md h-10 flex items-end overflow-hidden">
                        <div 
                          className={`w-full rounded-t-sm ${d.peak ? 'bg-amber-400' : 'bg-sky-400'}`} 
                          style={{ height: d.pct }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Taxes and Regulatory Surcharge */}
            <div className="lg:col-span-5 glass-card p-6 sm:p-8 rounded-[2rem] space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Структура Налогов и Сборов</h3>
                      <p className="text-[10px] text-slate-400 font-mono">11.6% от счета (2026 YTD)</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    3 336 TL
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">НДС (KDV 8–10%)</span>
                      <span className="text-white font-bold">2 301 TL</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">69% от всех сборов</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">Муниципальный налог (BTV 5%)</span>
                      <span className="text-white font-bold">718 TL</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">21.5% городской сбор</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold">Энергофонды (1%)</span>
                      <span className="text-white font-bold">317 TL</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">9.5% поддержка инфраструктуры</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-slate-400 flex justify-between">
                <span>В среднем в месяц:</span>
                <span className="text-emerald-400 font-bold">476.6 TL / мес</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 4: AI Forecast */}
        {hubTab === 'AI_FORECAST' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <AiForecastCard invoices={invoices} targetMonthLabel="Август 2026" />
          </motion.div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TIER 3: WHAT-IF SIMULATOR & CURRENT BILL ACTION CENTER */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <WhatIfSimulator currentMonthlyKwh={latestInvoice.kwh} currentUnitRate={latestInvoice.unit_rate_tl} />

        {/* Current Bill Quick Action Panel */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-slate-900/90 to-slate-900/60 border border-white/10 shadow-xl">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Квитанция за {latestInvoice.period} (Июль 2026)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold font-mono">
                  К оплате
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                Расход: {formatKWh(latestInvoice.kwh)} • Срок оплаты до {latestInvoice.due_date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => onSelectInvoice(latestInvoice)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 text-xs font-bold transition-all cursor-pointer font-mono"
            >
              <FileDown className="w-4 h-4 text-sky-400" />
              <span>Просмотр квитанции</span>
            </button>

            <button
              onClick={onNavigateToInvoices}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <span>Все счета ({invoices.length})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
