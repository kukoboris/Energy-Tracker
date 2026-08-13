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
  Filter,
  SlidersHorizontal,
  Layers,
  ArrowUpRight
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
    let sorted = [...invoices].sort((a, b) => a.period.localeCompare(b.period));
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
        <div className="bg-[#0c1324]/95 backdrop-blur-md border border-[#424754] p-4 rounded-2xl shadow-2xl font-mono text-xs space-y-2.5 min-w-[210px]">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <span className="font-bold text-white text-sm tracking-tight">{data.displayPeriod}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              data.status === 'PAID' ? 'bg-[#4edea3]/20 text-[#4edea3]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
            }`}>
              {data.status === 'PAID' ? 'Оплачен' : 'Ожидает'}
            </span>
          </div>

          <div className="space-y-1.5">
            {(metricMode === 'BOTH' || metricMode === 'COST') && (
              <div className="flex justify-between items-center">
                <span className="text-[#94a3b8] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span> Сумма счета:
                </span>
                <span className="font-bold text-white">{data.cost.toLocaleString('ru-RU')} TL</span>
              </div>
            )}

            {(metricMode === 'BOTH' || metricMode === 'KWH') && (
              <div className="flex justify-between items-center">
                <span className="text-[#94a3b8] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span> Расход (кВт·ч):
                </span>
                <span className="font-bold text-[#4edea3]">{data.kwh.toLocaleString('ru-RU')} кВт·ч</span>
              </div>
            )}

            <div className="flex justify-between items-center text-[10px] text-[#94a3b8] pt-1.5 border-t border-white/5">
              <span>Среднесуточный:</span>
              <span className="text-[#adc6ff]">{data.dailyAvg} кВт·ч/день</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-[#94a3b8]">
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
          <PieChart className="w-8 h-8 text-[#8b5cf6]" />
          Глубокая Аналитика и Структура Затрат
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          Интерактивный Recharts-анализ динамики расходов, симулятор тарифов и ИИ-рекомендации
        </p>
      </div>

      {/* Main Recharts Section: Line Chart with Period Filter */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] space-y-6">
        {/* Header & Controls Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#8b5cf6]/15 flex items-center justify-center text-[#8b5cf6] border border-[#8b5cf6]/20">
                <LineChartIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Динамика Расходов по Месяцам (Recharts)
                </h2>
                <p className="text-xs text-[#94a3b8] font-mono">
                  Визуализация трендов стоимости и объемов потребления электроэнергии
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center p-1 rounded-2xl bg-[#151b2d] border border-[#424754] text-xs font-mono">
              <span className="px-2.5 text-[#94a3b8] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#adc6ff]" /> Период:
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
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      periodFilter === p
                        ? 'bg-[#8b5cf6] text-white shadow-md'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            {/* Metric Mode Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-[#151b2d] border border-[#424754] text-xs font-mono">
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
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      metricMode === m
                        ? 'bg-[#4edea3] text-[#002113] shadow-md'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {labels[m]}
                  </button>
                );
              })}
            </div>

            {/* Chart Style Toggle (Line / Area) */}
            <div className="flex items-center p-1 rounded-2xl bg-[#151b2d] border border-[#424754] text-xs font-mono">
              <button
                onClick={() => setChartStyle(chartStyle === 'area' ? 'line' : 'area')}
                className="px-3 py-1.5 rounded-xl text-[#adc6ff] hover:text-white font-bold flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{chartStyle === 'area' ? 'Область (Area)' : 'Линия (Line)'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick KPI Cards for Selected Period */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[10px] text-[#94a3b8] uppercase block">Всего Расходов ({chartData.length} мес)</span>
            <span className="text-lg font-bold text-white block">
              {stats.totalCost.toLocaleString('ru-RU')} <span className="text-xs text-[#94a3b8]">TL</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[10px] text-[#94a3b8] uppercase block">Общий Объем (кВт·ч)</span>
            <span className="text-lg font-bold text-[#4edea3] block">
              {stats.totalKwh.toLocaleString('ru-RU')} <span className="text-xs text-[#94a3b8]">кВт·ч</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[10px] text-[#94a3b8] uppercase block">Средний Счет в Месяц</span>
            <span className="text-lg font-bold text-[#adc6ff] block">
              {stats.avgCost.toLocaleString('ru-RU')} <span className="text-xs text-[#94a3b8]">TL</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
            <span className="text-[10px] text-[#94a3b8] uppercase block">Максимальный Пик</span>
            <span className="text-lg font-bold text-[#f43f5e] block">
              {stats.maxCost.toLocaleString('ru-RU')} <span className="text-xs text-[#94a3b8]">TL ({stats.maxMonth})</span>
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
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4edea3" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4edea3" stopOpacity={0.0} />
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
                    stroke="#8b5cf6" 
                    tick={{ fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(1)}k TL`}
                  />
                )}
                {(metricMode === 'BOTH' || metricMode === 'KWH') && (
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#4edea3" 
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
                    stroke="#8b5cf6"
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
                    stroke="#4edea3"
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
                    stroke="#8b5cf6" 
                    tick={{ fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(1)}k TL`}
                  />
                )}
                {(metricMode === 'BOTH' || metricMode === 'KWH') && (
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#4edea3" 
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
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#0c1324' }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                  />
                )}

                {(metricMode === 'BOTH' || metricMode === 'KWH') && (
                  <Line
                    yAxisId={metricMode === 'KWH' ? 'right' : (metricMode === 'BOTH' ? 'right' : 'left')}
                    type="monotone"
                    dataKey="kwh"
                    name="kwh"
                    stroke="#4edea3"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#4edea3', strokeWidth: 2, stroke: '#0c1324' }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Smart Optimizer Section */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-r from-[#8b5cf6]/15 via-[#adc6ff]/10 to-transparent border-[#8b5cf6]/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#8b5cf6] text-white flex items-center justify-center shadow-lg shadow-[#8b5cf6]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">ИИ-Советник по Энергоэффективности</h3>
              <p className="text-[11px] font-mono text-[#adc6ff]">
                Анализ с учетом климатических условий {account.city} ({latestInvoice.period})
              </p>
            </div>
          </div>

          <button
            onClick={fetchAiSuggestions}
            disabled={loadingAi}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
            <span>Обновить Советы</span>
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

      {/* Live Meteorological Context & Kemer Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KemerWeatherCard />
        
        {/* Climate Analysis Info */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/15 flex items-center justify-center text-[#f59e0b] border border-[#f59e0b]/30">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Климатический профиль региона Кемер</h3>
                <p className="text-xs text-[#94a3b8] font-mono">Средиземноморская климатическая зона</p>
              </div>
            </div>
            <p className="text-xs text-[#dce1fb] leading-relaxed font-sans">
              В июле и августе в районе Кемер (Анталья) дневная температура держится выше +35°C при высокой влажности воздуха (60-75%). Это создает пиковую нагрузку на мульти-сплит системы кондиционирования, формируя до 75% летнего счета за электроэнергию.
            </p>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex justify-between items-center">
              <span className="text-[#94a3b8]">Пиковый летний месяц:</span>
              <span className="text-[#f59e0b] font-bold">Август (до 1 250 кВт·ч)</span>
            </div>
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex justify-between items-center">
              <span className="text-[#94a3b8]">Пиковый зимний месяц:</span>
              <span className="text-[#60a5fa] font-bold">Январь (до 1 510 кВт·ч)</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#4edea3]/10 border border-[#4edea3]/20 flex justify-between items-center text-[#4edea3]">
              <span>Рекомендуемая уставка AC:</span>
              <span className="font-bold">24°C - 25°C</span>
            </div>
          </div>

          <p className="text-[10px] text-[#94a3b8] font-mono border-t border-white/5 pt-3">
            Данные температуры и влажности обновляются в реальном времени через Open-Meteo API.
          </p>
        </div>
      </div>

      {/* Grid Row 2: Tariff Simulator & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tariff Simulator */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#adc6ff]" />
            Симулятор Тарифных Планов
          </h3>
          <p className="text-xs text-[#94a3b8] mb-6">
            Сравнение суммы за {baseKwh} кВт·ч по различным тарифным моделям
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
              <span className="text-[10px] opacity-60">Жилой (Бытовой)</span>
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
              <span className="text-xs font-bold block">Коммерческий</span>
              <span className="text-[10px] opacity-60">Ticarethane</span>
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
              <span className="text-xs font-bold block">Солнечные Панели</span>
              <span className="text-[10px] opacity-60">Компенсация 55%</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-[#151b2d] border border-[#424754] space-y-3">
            <div className="flex justify-between items-center text-xs text-[#94a3b8]">
              <span>Выбранный Тариф:</span>
              <span className="font-bold text-white">{tariffLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">Расчетный Счет в Месяц:</span>
              <span className="text-2xl font-extrabold font-mono text-[#adc6ff]">
                {simulatedCost.toLocaleString('ru-RU')} <span className="text-xs font-normal text-[#94a3b8]">TL</span>
              </span>
            </div>
            {selectedTariff === 'SOLAR' && (
              <p className="text-[11px] text-[#4edea3] pt-2 border-t border-white/5 font-mono">
                ✓ Потенциальная экономия в месяц: {(latestInvoice.total_amount_tl - simulatedCost).toLocaleString('ru-RU')} TL
              </p>
            )}
          </div>
        </div>

        {/* Cost Structure Breakdown */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#4edea3]" />
            Структура Начислений в Счете
          </h3>
          <p className="text-xs text-[#94a3b8] mb-6">
            Детализация текущего счета на {latestInvoice.total_amount_tl.toLocaleString('ru-RU')} TL
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#adc6ff]">Активная Энергия (72%)</span>
                <span className="font-mono text-white">{netEnergyCost.toLocaleString('ru-RU')} TL</span>
              </div>
              <div className="h-2 w-full bg-[#191f31] rounded-full overflow-hidden">
                <div className="h-full bg-[#adc6ff] w-[72%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#8b5cf6]">Передача и Распределение (16%)</span>
                <span className="font-mono text-white">{distributionFee.toLocaleString('ru-RU')} TL</span>
              </div>
              <div className="h-2 w-full bg-[#191f31] rounded-full overflow-hidden">
                <div className="h-full bg-[#8b5cf6] w-[16%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#4edea3]">НДС (KDV) 8%</span>
                <span className="font-mono text-white">{kdvTax.toLocaleString('ru-RU')} TL</span>
              </div>
              <div className="h-2 w-full bg-[#191f31] rounded-full overflow-hidden">
                <div className="h-full bg-[#4edea3] w-[8%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#f59e0b]">Муниципальный Налог 4%</span>
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
        <h3 className="text-lg font-bold text-white mb-1">Матрица Потребления по Месяцам</h3>
        <p className="text-xs text-[#94a3b8] mb-6">Сравнение интенсивности расхода за 2025 и 2026 годы</p>

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
                  {inv.kwh.toFixed(0)} <span className="text-[10px] font-normal text-[#94a3b8]">кВт·ч</span>
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

