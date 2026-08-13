import React, { useState, useEffect, useMemo } from 'react';
import { 
  PieChart, 
  TrendingUp, 
  Sparkles, 
  Zap, 
  Sun, 
  Building2, 
  Home, 
  RefreshCw, 
  LineChart as LineChartIcon, 
  Calendar, 
  SlidersHorizontal 
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import { Invoice, UserAccount } from '../types';
import { generateEnergyTips } from '../services/geminiService';
import { KemerWeatherCard } from './KemerWeatherCard';
import { formatTL, formatUSD, formatEUR, formatKWh } from '../utils/formatters';

interface AnalyticsViewProps {
  account: UserAccount;
  invoices: Invoice[];
}

type PeriodFilter = 'ALL' | '2026' | '2025' | 'LAST_12' | 'LAST_6';
type MetricMode = 'BOTH' | 'COST' | 'KWH';

const MONTH_NAMES_RU: Record<string, string> = {
  '01': 'Янв',
  '02': 'Фев',
  '03': 'Мар',
  '04': 'Апр',
  '05': 'Май',
  '06': 'Июн',
  '07': 'Июл',
  '08': 'Авг',
  '09': 'Сен',
  '10': 'Окт',
  '11': 'Ноя',
  '12': 'Дек',
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ account, invoices }) => {
  const [selectedTariff, setSelectedTariff] = useState<'MESKEN' | 'COMMERCIAL' | 'SOLAR'>('MESKEN');
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  // Recharts interactive states
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL');
  const [metricMode, setMetricMode] = useState<MetricMode>('BOTH');
  const [chartStyle, setChartStyle] = useState<'line' | 'area'>('area');

  // Filter invoices chronologically based on period filter
  const filteredInvoices = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => a.period.localeCompare(b.period));
    if (periodFilter === '2026') {
      return sorted.filter(inv => inv.period.startsWith('2026'));
    } else if (periodFilter === '2025') {
      return sorted.filter(inv => inv.period.startsWith('2025'));
    } else if (periodFilter === 'LAST_12') {
      return sorted.slice(-12);
    } else if (periodFilter === 'LAST_6') {
      return sorted.slice(-6);
    }
    return sorted;
  }, [invoices, periodFilter]);

  // Transform for Recharts
  const chartData = useMemo(() => {
    return filteredInvoices.map((inv) => {
      const [year, month] = inv.period.split('-');
      const monthName = MONTH_NAMES_RU[month] || month;
      return {
        id: inv.id,
        period: inv.period,
        displayPeriod: `${monthName} ${year}`,
        shortLabel: `${monthName} '${year.slice(2)}`,
        cost: inv.total_amount_tl,
        kwh: inv.kwh,
        dailyAvg: inv.daily_avg_kwh,
        unitRate: inv.unit_rate_tl,
        status: inv.status,
      };
    });
  }, [filteredInvoices]);

  // Aggregate statistics for selected period
  const stats = useMemo(() => {
    if (chartData.length === 0) return { totalCost: 0, totalKwh: 0, avgCost: 0, maxCost: 0, maxMonth: '' };
    const totalCost = chartData.reduce((acc, curr) => acc + curr.cost, 0);
    const totalKwh = chartData.reduce((acc, curr) => acc + curr.kwh, 0);
    const avgCost = Math.round(totalCost / chartData.length);
    let maxCost = 0;
    let maxMonth = '';
    chartData.forEach(item => {
      if (item.cost > maxCost) {
        maxCost = item.cost;
        maxMonth = item.displayPeriod;
      }
    });
    return { totalCost, totalKwh, avgCost, maxCost, maxMonth };
  }, [chartData]);

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

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl font-mono text-xs space-y-2.5 min-w-[210px]">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="font-bold text-white text-sm tracking-tight">{data.displayPeriod}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              data.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {data.status === 'PAID' ? 'Оплачен' : 'Ожидает'}
            </span>
          </div>

          <div className="space-y-1.5">
            {(metricMode === 'BOTH' || metricMode === 'COST') && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Сумма счета:
                </span>
                <span className="font-bold text-white">{formatTL(data.cost)} TL</span>
              </div>
            )}

            {(metricMode === 'BOTH' || metricMode === 'KWH') && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Расход (кВт·ч):
                </span>
                <span className="font-bold text-emerald-400">{formatTL(data.kwh)} кВт·ч</span>
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-white/5">
              <span>Среднесуточный:</span>
              <span className="text-sky-300">{data.dailyAvg} кВт·ч/день</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Тариф за кВт·ч:</span>
              <span className="text-white">{data.unitRate} TL</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <PieChart className="w-8 h-8 text-sky-400" />
          Глубокая Аналитика и Структура Затрат
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Интерактивный Recharts-анализ динамики расходов, симулятор тарифов и ИИ-рекомендации
        </p>
      </div>

      {/* Main Recharts Section: Line Chart with Period Filter */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] space-y-6">
        {/* Header & Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                <LineChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Динамика Расходов по Месяцам (Recharts)
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Визуализация трендов стоимости и объемов потребления электроэнергии
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-white/10 text-xs font-mono">
              <span className="px-2.5 text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" /> Период:
              </span>
              {(['ALL', '2026', '2025', 'LAST_12', 'LAST_6'] as PeriodFilter[]).map((p) => {
                const labels: Record<PeriodFilter, string> = {
                  ALL: 'Все время',
                  '2026': '2026 год',
                  '2025': '2025 год',
                  LAST_12: '12 мес',
                  LAST_6: '6 мес',
                };
                return (
                  <button
                    key={p}
                    onClick={() => setPeriodFilter(p)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      periodFilter === p
                        ? 'bg-sky-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            {/* Metric Mode Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-white/10 text-xs font-mono">
              {(['BOTH', 'COST', 'KWH'] as MetricMode[]).map((m) => {
                const labels: Record<MetricMode, string> = {
                  BOTH: 'Сумма + кВт·ч',
                  COST: 'Сумма (TL)',
                  KWH: 'Объем (кВт·ч)',
                };
                return (
                  <button
                    key={m}
                    onClick={() => setMetricMode(m)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                      metricMode === m
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {labels[m]}
                  </button>
                );
              })}
            </div>

            {/* Chart Style Toggle (Line / Area) */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-white/10 text-xs font-mono">
              <button
                onClick={() => setChartStyle(chartStyle === 'area' ? 'line' : 'area')}
                className="px-3 py-1.5 rounded-xl text-sky-300 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{chartStyle === 'area' ? 'Область (Area)' : 'Линия (Line)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards for Selected Period */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Всего Расходов ({chartData.length} мес)</span>
            <span className="text-lg font-bold text-white block">
              {formatTL(stats.totalCost)} <span className="text-xs text-slate-400 font-normal">TL</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Общий Объем</span>
            <span className="text-lg font-bold text-emerald-400 block">
              {formatTL(stats.totalKwh)} <span className="text-xs text-slate-400 font-normal">кВт·ч</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Средний Счет</span>
            <span className="text-lg font-bold text-sky-300 block">
              {formatTL(stats.avgCost)} <span className="text-xs text-slate-400 font-normal">TL</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase block">Максимальный Пик</span>
            <span className="text-lg font-bold text-rose-400 block">
              {formatTL(stats.maxCost)} <span className="text-xs text-slate-400 font-normal">TL ({stats.maxMonth})</span>
            </span>
          </div>
        </div>

        {/* Recharts Chart Rendering Container */}
        <div className="w-full h-[360px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartStyle === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis 
                  dataKey="shortLabel" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }} 
                  dy={8}
                />
                {(metricMode === 'BOTH' || metricMode === 'COST') && (
                  <YAxis 
                    yAxisId="left" 
                    stroke="#38bdf8" 
                    tick={{ fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(1)}k TL`}
                  />
                )}
                {(metricMode === 'BOTH' || metricMode === 'KWH') && (
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10b981" 
                    tick={{ fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${v} кВт·ч`}
                  />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 15, fontSize: 12, fontFamily: 'sans-serif' }} 
                  formatter={(value) => (
                    <span className="text-white font-mono text-xs font-bold">
                      {value === 'cost' ? 'Сумма счета (TL)' : 'Потребление (кВт·ч)'}
                    </span>
                  )}
                />
                <ReferenceLine 
                  yAxisId={metricMode === 'KWH' ? 'right' : 'left'} 
                  y={metricMode === 'KWH' ? 800 : stats.avgCost} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Среднее', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} 
                />

                {(metricMode === 'BOTH' || metricMode === 'COST') && (
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="cost"
                    name="cost"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCost)"
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  />
                )}

                {(metricMode === 'BOTH' || metricMode === 'KWH') && (
                  <Area
                    yAxisId={metricMode === 'KWH' ? 'right' : (metricMode === 'BOTH' ? 'right' : 'left')}
                    type="monotone"
                    dataKey="kwh"
                    name="kwh"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorKwh)"
                    activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis 
                  dataKey="shortLabel" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 11, fontFamily: 'monospace' }} 
                  dy={8}
                />
                {(metricMode === 'BOTH' || metricMode === 'COST') && (
                  <YAxis 
                    yAxisId="left" 
                    stroke="#38bdf8" 
                    tick={{ fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(1)}k TL`}
                  />
                )}
                {(metricMode === 'BOTH' || metricMode === 'KWH') && (
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#10b981" 
                    tick={{ fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${v} кВт·ч`}
                  />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 15, fontSize: 12, fontFamily: 'sans-serif' }} 
                  formatter={(value) => (
                    <span className="text-white font-mono text-xs font-bold">
                      {value === 'cost' ? 'Сумма счета (TL)' : 'Потребление (кВт·ч)'}
                    </span>
                  )}
                />
                <ReferenceLine 
                  yAxisId={metricMode === 'KWH' ? 'right' : 'left'} 
                  y={metricMode === 'KWH' ? 800 : stats.avgCost} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                />

                {(metricMode === 'BOTH' || metricMode === 'COST') && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="cost"
                    name="cost"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#38bdf8', strokeWidth: 2, stroke: '#0b111e' }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                  />
                )}

                {(metricMode === 'BOTH' || metricMode === 'KWH') && (
                  <Line
                    yAxisId={metricMode === 'KWH' ? 'right' : (metricMode === 'BOTH' ? 'right' : 'left')}
                    type="monotone"
                    dataKey="kwh"
                    name="kwh"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0b111e' }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Smart Optimizer Section */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-r from-sky-500/10 via-emerald-500/5 to-transparent border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-slate-950 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">ИИ-Советник по Энергоэффективности</h3>
              <p className="text-[11px] font-mono text-sky-400">
                Анализ с учетом климатических условий {account.city} ({latestInvoice.period})
              </p>
            </div>
          </div>

          <button
            onClick={fetchAiSuggestions}
            disabled={loadingAi}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs font-bold text-white transition-all disabled:opacity-50 cursor-pointer font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>Обновить Советы</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {aiTips.map((tip, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-900/70 border border-white/5 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold">
                  0{idx + 1}
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Meteorological Context & Kemer Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KemerWeatherCard />
        
        {/* Climate Analysis Info */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Климатический профиль региона Кемер</h3>
                <p className="text-xs text-slate-400 font-mono">Средиземноморская климатическая зона</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              В июле и августе в районе Кемер (Анталья) дневная температура держится выше +35°C при высокой влажности воздуха (60-75%). Это создает пиковую нагрузку на мульти-сплит системы кондиционирования, формируя до 75% летнего счета за электроэнергию.
            </p>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex justify-between items-center">
              <span className="text-slate-400">Пиковый летний месяц:</span>
              <span className="text-amber-400 font-bold">Август (до 1 250 кВт·ч)</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 flex justify-between items-center">
              <span className="text-slate-400">Пиковый зимний месяц:</span>
              <span className="text-sky-400 font-bold">Январь (до 1 510 кВт·ч)</span>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-emerald-400">
              <span>Рекомендуемая уставка AC:</span>
              <span className="font-bold">24°C - 25°C</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-mono border-t border-white/5 pt-3">
            Данные температуры и влажности обновляются в реальном времени через Open-Meteo API.
          </p>
        </div>
      </div>

      {/* Tariff Simulator & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tariff Simulator */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-sky-400" />
            Симулятор Тарифных Планов
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Сравнение суммы за {formatKWh(baseKwh)} по различным тарифным моделям
          </p>

          <div className="grid grid-cols-3 gap-3 mb-6 font-mono">
            <button
              onClick={() => setSelectedTariff('MESKEN')}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                selectedTariff === 'MESKEN'
                  ? 'bg-sky-500/15 border-sky-400 text-white shadow-md'
                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-5 h-5 mx-auto mb-2 text-sky-400" />
              <span className="text-xs font-bold block">Mesken AG</span>
              <span className="text-[10px] opacity-60">Жилой (Бытовой)</span>
            </button>

            <button
              onClick={() => setSelectedTariff('COMMERCIAL')}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                selectedTariff === 'COMMERCIAL'
                  ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-5 h-5 mx-auto mb-2 text-amber-400" />
              <span className="text-xs font-bold block">Коммерческий</span>
              <span className="text-[10px] opacity-60">Ticarethane</span>
            </button>

            <button
              onClick={() => setSelectedTariff('SOLAR')}
              className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                selectedTariff === 'SOLAR'
                  ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                  : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
              <span className="text-xs font-bold block">Солнечные Панели</span>
              <span className="text-[10px] opacity-60">Компенсация 55%</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-white/5 space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Выбранный Тариф:</span>
              <span className="font-bold text-white">{tariffLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">Расчетный Счет в Месяц:</span>
              <span className="text-2xl font-extrabold font-mono text-sky-400">
                {formatTL(simulatedCost)} <span className="text-xs font-normal text-slate-400">TL</span>
              </span>
            </div>
            {selectedTariff === 'SOLAR' && (
              <p className="text-[11px] text-emerald-400 pt-2 border-t border-white/5 font-mono">
                ✓ Потенциальная экономия в месяц: {formatTL(latestInvoice.total_amount_tl - simulatedCost)} TL
              </p>
            )}
          </div>
        </div>

        {/* Cost Structure Breakdown */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Структура Начислений в Счете
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Детализация текущего счета на {formatTL(latestInvoice.total_amount_tl)} TL
          </p>

          <div className="space-y-4 font-mono">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-sky-300">Активная Энергия (72%)</span>
                <span className="text-white">{formatTL(netEnergyCost)} TL</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-400 w-[72%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-sky-200">Передача и Распределение (16%)</span>
                <span className="text-white">{formatTL(distributionFee)} TL</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-200 w-[16%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-emerald-400">НДС (KDV) 8%</span>
                <span className="text-white">{formatTL(kdvTax)} TL</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[8%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-amber-400">Муниципальный Налог 4%</span>
                <span className="text-white">{formatTL(municipalTax)} TL</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 w-[4%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
