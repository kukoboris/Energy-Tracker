import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Calculator,
  Sparkles,
  Radar,
  Wallet,
  Receipt,
  Table,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  FileDown,
  PieChart as PieIcon,
  Sun,
  Snowflake,
  Leaf,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Radar as RadarChart } from 'react-chartjs-2';
import { Invoice, UserAccount } from '../types';
import { AiForecastCard } from './AiForecastCard';

const CustomRechartsTooltip = ({ active, payload, label, unit }: { active?: boolean; payload?: any[]; label?: string; unit?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#161e2e]/95 backdrop-blur-md border border-[#adc6ff]/20 p-3 rounded-xl shadow-2xl text-xs font-sans">
        <p className="font-bold text-white mb-2 pb-1 border-b border-white/10">Потребление ({label})</p>
        {payload.map((entry: any, index: number) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-1">
              <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white ml-2">
                {Number(entry.value).toLocaleString('ru-RU')} {unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
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

export const DashboardView: React.FC<DashboardViewProps> = ({
  account,
  invoices,
  onSelectInvoice,
  onNavigateToInvoices
}) => {
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [tableYearFilter, setTableYearFilter] = useState<'ALL' | '2026' | '2025'>('ALL');
  const [tableSearch, setTableSearch] = useState('');
  
  // Interactive Forecast Simulation state
  const [acIntensity, setAcIntensity] = useState<number>(100); // % of default
  const [trendMetric, setTrendMetric] = useState<'KWH' | 'COST'>('KWH');
  const [breakdownView, setBreakdownView] = useState<'COST' | 'SEASON'>('COST');

  // Computed Cost Breakdown from invoices
  const totalEnergyCost = invoices.reduce((acc, inv) => acc + (inv.energy_cost_tl || 0), 0);
  const totalDistributionCost = invoices.reduce((acc, inv) => acc + (inv.distribution_cost_tl || 0), 0);
  const totalTaxCost = invoices.reduce((acc, inv) => acc + (inv.tax_tl || 0), 0);
  const totalAmountAll = invoices.reduce((acc, inv) => acc + (inv.total_amount_tl || 0), 0) || 1;

  const costStructureData = [
    { name: 'Энергия', value: Math.round(totalEnergyCost), color: '#8b5cf6', pct: ((totalEnergyCost / totalAmountAll) * 100).toFixed(1) },
    { name: 'Сеть (Дағытым)', value: Math.round(totalDistributionCost), color: '#adc6ff', pct: ((totalDistributionCost / totalAmountAll) * 100).toFixed(1) },
    { name: 'Налоги и НДС', value: Math.round(totalTaxCost), color: '#4edea3', pct: ((totalTaxCost / totalAmountAll) * 100).toFixed(1) },
  ];

  // Compute monthly data for Recharts line chart from invoices
  const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const rechartsMonthlyData = monthNames.map((monthStr, index) => {
    const monthNumStr = String(index + 1).padStart(2, '0');
    const inv2025 = invoices.find(i => i.period === `2025-${monthNumStr}`);
    const inv2026 = invoices.find(i => i.period === `2026-${monthNumStr}`);
    return {
      month: monthStr,
      '2025 Базовый': inv2025 ? (trendMetric === 'KWH' ? inv2025.kwh : inv2025.total_amount_tl) : null,
      '2026 Фактический': inv2026 ? (trendMetric === 'KWH' ? inv2026.kwh : inv2026.total_amount_tl) : null,
    };
  });

  // Chart Labels & Data
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const data2025 = [735, 647, 361, 242, 251, 378, 1181];
  const data2026 = [1511, 939, 756, 281, 143, 288, 1133];

  // Calculated Forecast based on slider
  const estMinKwh = Math.round(1150 * (acIntensity / 100));
  const estMaxKwh = Math.round(1250 * (acIntensity / 100));
  const estMinTl = Math.round(estMinKwh * 5.69 * 1.12);
  const estMaxTl = Math.round(estMaxKwh * 5.69 * 1.12);

  // 1. Bar Chart Data (kWh YoY)
  const barChartData = {
    labels,
    datasets: [
      {
        label: '2025',
        data: data2025,
        backgroundColor: 'rgba(148, 163, 184, 0.25)',
        borderRadius: 8,
        barThickness: 12,
      },
      {
        label: '2026',
        data: data2026,
        backgroundColor: '#adc6ff',
        borderRadius: 8,
        barThickness: 12,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161e2e',
        titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' as const },
        bodyFont: { family: 'JetBrains Mono', size: 11 },
        padding: 10,
        borderColor: 'rgba(173, 198, 255, 0.2)',
        borderWidth: 1,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10, weight: 600 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 }, stepSize: 500 },
      },
    },
  };

  // 2. Trend Line Data (2026 dynamics)
  const lineChartData = {
    labels,
    datasets: [
      {
        label: '2026 Total (TL)',
        data: [8945, 4720, 3535, 1290, 695, 1400, 7185],
        borderColor: '#adc6ff',
        borderWidth: 3,
        fill: true,
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(173, 198, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(173, 198, 255, 0.0)');
          return gradient;
        },
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#adc6ff',
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 10 } },
      },
      y: { display: false },
    },
  };

  // 3. Radar Chart Data
  const radarChartData = {
    labels,
    datasets: [
      {
        label: '2025',
        data: data2025,
        borderColor: 'rgba(148, 163, 184, 0.4)',
        backgroundColor: 'transparent',
        borderWidth: 2,
      },
      {
        label: '2026',
        data: data2026,
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        borderWidth: 2,
      },
    ],
  };

  const radarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        angleLines: { color: 'rgba(255,255,255,0.06)' },
        ticks: { display: false },
        pointLabels: {
          color: '#dce1fb',
          font: { family: 'Plus Jakarta Sans', size: 9, weight: 700 as const }
        }
      }
    }
  };

  // Filtered Table Data
  const filteredInvoices = invoices.filter((inv) => {
    const matchesYear = tableYearFilter === 'ALL' || inv.period.startsWith(tableYearFilter);
    const matchesSearch = inv.period.toLowerCase().includes(tableSearch.toLowerCase()) ||
      inv.bill_date.includes(tableSearch);
    return matchesYear && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Profile Header Bento Block */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
        className="glass-card p-6 sm:p-8 rounded-[2rem] relative group"
      >
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#adc6ff]/10 rounded-full blur-[100px] pointer-events-none transition-all duration-500 group-hover:bg-[#adc6ff]/15"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Обзор Энергетического Портфеля
              </h1>
              <span className="px-3 py-1 rounded-full bg-[#adc6ff]/10 border border-[#adc6ff]/20 text-[#adc6ff] text-[10px] font-bold uppercase tracking-widest">
                Премиум Аналитика
              </span>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[#94a3b8] text-xs sm:text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#adc6ff]" />
                {account.address}, {account.city}
              </span>
              <div className="flex gap-2 sm:gap-3 mt-2">
                <span className="text-[11px] font-bold py-1 px-3 bg-[#4cd7f6]/10 text-[#4cd7f6] border border-[#4cd7f6]/20 rounded-md font-mono">
                  {account.tariff}
                </span>
                <span className="text-[11px] font-bold py-1 px-3 bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 rounded-md font-mono">
                  {account.engine}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mb-1">
                Общий расход 2025
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-white">
                {account.totalConsumption2025Tl.toLocaleString('ru-RU')} <span className="text-xs font-normal text-[#94a3b8]">TL</span>
              </p>
              <p className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
                {account.totalConsumption2025Kwh.toLocaleString('ru-RU')} кВт·ч
              </p>
            </div>

            <div className="px-5 py-3.5 rounded-2xl bg-[#adc6ff]/5 border border-[#adc6ff]/20 backdrop-blur-md ring-1 ring-[#adc6ff]/20">
              <p className="text-[10px] font-bold text-[#adc6ff] uppercase tracking-widest mb-1">
                Общий расход 2026
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-[#adc6ff]">
                {account.totalConsumption2026Tl.toLocaleString('ru-RU')} <span className="text-xs font-normal text-[#94a3b8]">TL</span>
              </p>
              <p className="text-[11px] font-mono text-[#adc6ff]/70 mt-0.5">
                {account.totalConsumption2026Kwh.toLocaleString('ru-RU')} кВт·ч (7 мес)
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Bento Grid */}
      <div className="bento-grid">
        {/* KPI 1: Current Bill */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2, ease: 'easeOut' } }}
          whileTap={{ scale: 0.995 }}
          className="glass-card glow-warning p-6 rounded-3xl flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
              Текущий счет (Июль)
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center text-[#f59e0b]">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="py-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              7 185 <span className="text-sm font-bold text-[#f59e0b]">TL</span>
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-1">
              <span className="text-[#f59e0b] font-bold">+68.7%</span> к Июлю 2025
            </p>
          </div>
          <div className="pt-3 border-t border-[#424754] flex justify-between items-center text-[10px] font-bold uppercase text-[#94a3b8] tracking-widest">
            <span>Срок оплаты</span>
            <span className="text-white font-mono">07.08.2026</span>
          </div>
        </motion.div>

        {/* KPI 2: Consumption */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2, ease: 'easeOut' } }}
          whileTap={{ scale: 0.995 }}
          className="glass-card glow-primary p-6 rounded-3xl flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
              Расход (Июль)
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#adc6ff]/10 border border-[#adc6ff]/20 flex items-center justify-center text-[#adc6ff]">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="py-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              1 133.58 <span className="text-sm font-bold text-[#adc6ff]">кВт·ч</span>
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-1">
              <span className="text-[#4edea3] font-bold">-4.0%</span> к Июлю 2025
            </p>
          </div>
          <div className="pt-3 border-t border-[#424754] flex justify-between items-center text-[10px] font-bold uppercase text-[#94a3b8] tracking-widest">
            <span>Среднесуточный</span>
            <span className="text-white font-mono">32.39 кВт·ч</span>
          </div>
        </motion.div>

        {/* KPI 3: YoY Volume Growth */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2, ease: 'easeOut' } }}
          whileTap={{ scale: 0.995 }}
          className="glass-card glow-info p-6 rounded-3xl flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
              Рост YTD
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="py-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              +20.3% <span className="text-sm font-bold text-[#8b5cf6]">кВт·ч</span>
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-1">
              5 055 против 4 201 кВт·ч
            </p>
          </div>
          <div className="pt-3 border-t border-[#424754] flex justify-between items-center text-[10px] font-bold uppercase text-[#94a3b8] tracking-widest">
            <span>Разница заτραт</span>
            <span className="text-[#f59e0b] font-mono">+145.7%</span>
          </div>
        </motion.div>

        {/* KPI 4: Unit Rate */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2, ease: 'easeOut' } }}
          whileTap={{ scale: 0.995 }}
          className="glass-card glow-tertiary p-6 rounded-3xl flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">
              Средняя цена кВт·ч
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center text-[#4edea3]">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <div className="py-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              5.69 <span className="text-sm font-bold text-[#4edea3]">TL</span>
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-1">
              против 2.79 TL/кВт·ч в 2025
            </p>
          </div>
          <div className="pt-3 border-t border-[#424754] flex justify-between items-center text-[10px] font-bold uppercase text-[#94a3b8] tracking-widest">
            <span>Индексация</span>
            <span className="text-[#f43f5e] font-mono">+104% YoY</span>
          </div>
        </motion.div>

        {/* Chart Block: kWh YoY (Large Bento) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="glass-card p-6 sm:p-8 rounded-[2.5rem] bento-span-2 bento-row-2 flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Динамика Потребления YoY</h3>
                <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mt-0.5">
                  Сравнение Январь – Июль (кВт·ч)
                </p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]/40"></span> 2025
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#adc6ff]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#adc6ff]"></span> 2026
                </div>
              </div>
            </div>

            {/* Chart Container */}
            <div className="h-56 w-full mb-4">
              <Bar data={barChartData} options={barChartOptions} />
            </div>

            {/* YoY Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[9px] text-[#94a3b8] uppercase block font-bold">Итого (7 месяцев)</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-white">5 051 кВт·ч</span>
                  <span className="text-[10px] text-[#f43f5e] font-bold">+44.5%</span>
                </div>
                <span className="text-[9px] text-[#94a3b8] block">против 3 495 кВт·ч в 2025</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[9px] text-[#94a3b8] uppercase block font-bold">Летний тренд</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-[#4edea3]">1 564 кВт·ч</span>
                  <span className="text-[10px] text-[#4edea3] font-bold">-13.6%</span>
                </div>
                <span className="text-[9px] text-[#94a3b8] block">Май–Июль vs 2025 (1 810 кВт·ч)</span>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[9px] text-[#94a3b8] uppercase block font-bold">Среднее в месяц</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-extrabold text-[#adc6ff]">722 кВт·ч</span>
                  <span className="text-[10px] text-[#adc6ff]">/ мес</span>
                </div>
                <span className="text-[9px] text-[#94a3b8] block">в 2025 было 499 кВт·ч/мес</span>
              </div>
            </div>

            {/* Monthly Delta Grid */}
            <div className="mt-3 space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#94a3b8] tracking-wider block">
                Динамика по месяцам YoY (%):
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
                    className={`p-1.5 sm:p-2 rounded-xl border text-[10px] space-y-0.5 ${
                      item.isUp 
                        ? 'bg-[#f43f5e]/10 border-[#f43f5e]/20 text-[#f43f5e]' 
                        : 'bg-[#4edea3]/10 border-[#4edea3]/20 text-[#4edea3]'
                    }`}
                  >
                    <span className="text-[9px] font-bold text-[#adc6ff] block">{item.m}</span>
                    <span className="font-extrabold block">{item.diff}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* YoY Trend Analytical Summary Note */}
          <div className="p-3.5 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-xs font-mono text-[#dce1fb] flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center text-[#adc6ff] shrink-0">
              <TrendingUp className="w-4 h-4 text-[#adc6ff]" />
            </div>
            <p className="text-[11px] leading-snug">
              <strong>Аналитика тренда:</strong> В I кв. зафиксирован пик расхода из-за отопления (+105%). Летом 2026 достигнуто сбережение (-13.6%) благодаря оптимизации работы кондиционеров.
            </p>
          </div>
        </motion.div>

        {/* Forecast Card (2-Col Bento) */}
        <AiForecastCard invoices={invoices} targetMonthLabel="Август 2026" className="bento-span-2 bento-row-2" />

        {/* Seasonal Profile Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="glass-card glow-info p-6 sm:p-8 rounded-[2.5rem] bento-span-2 flex flex-col justify-between space-y-4"
        >
          {/* Widget Header */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#8b5cf6]/15 flex items-center justify-center text-[#8b5cf6] border border-[#8b5cf6]/20 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Сезонная Нагрузка
                  </h3>
                  <p className="text-[10px] text-[#94a3b8] font-mono">
                    Климатический профиль
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20 text-[10px] font-mono font-bold shrink-0">
                3 Сезона
              </span>
            </div>
            <p className="text-[11px] text-[#94a3b8] font-mono mt-2">
              Максимальные пики нагрузки приходятся на зимнее отопление и летнее охлаждение.
            </p>
          </div>

          {/* Seasonal Profile Content */}
          <div className="space-y-3 my-auto">
            {/* Winter */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-[#60a5fa] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Зима (Обогрев)</p>
                    <p className="text-[10px] text-[#94a3b8]">Декабрь — Февраль</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs font-bold text-white">1 511 <span className="text-[10px] text-[#94a3b8]">кВт·ч/мес</span></p>
                  <p className="text-[10px] font-bold text-[#60a5fa]">~8 597 TL/мес</p>
                </div>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] h-full rounded-full w-[100%]" />
              </div>
              <div className="flex justify-between text-[9px] text-[#94a3b8] font-mono">
                <span>Конвекторы / Теплый пол</span>
                <span className="text-[#60a5fa]">Пик нагрузки (100%)</span>
              </div>
            </div>

            {/* Summer */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#f59e0b] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Лето (Охлаждение)</p>
                    <p className="text-[10px] text-[#94a3b8]">Июнь — Август</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs font-bold text-white">1 133 <span className="text-[10px] text-[#94a3b8]">кВт·ч/мес</span></p>
                  <p className="text-[10px] font-bold text-[#f59e0b]">~6 446 TL/мес</p>
                </div>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] h-full rounded-full w-[75%]" />
              </div>
              <div className="flex justify-between text-[9px] text-[#94a3b8] font-mono">
                <span>Кондиционеры (AC)</span>
                <span className="text-[#f59e0b]">75% от пика</span>
              </div>
            </div>

            {/* Off-season */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-[#4edea3] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">Межсезонье</p>
                    <p className="text-[10px] text-[#94a3b8]">Весна / Осень</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <p className="text-xs font-bold text-white">212 <span className="text-[10px] text-[#94a3b8]">кВт·ч/мес</span></p>
                  <p className="text-[10px] font-bold text-[#4edea3]">~1 206 TL/мес</p>
                </div>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-1">
                <div className="bg-gradient-to-r from-[#4edea3] to-[#10b981] h-full rounded-full w-[14%]" />
              </div>
              <div className="flex justify-between text-[9px] text-[#94a3b8] font-mono">
                <span>Бытовая техника (Базовый)</span>
                <span className="text-[#4edea3]">Минимум (14%)</span>
              </div>
            </div>
          </div>

          {/* Seasonal Insight Box */}
          <div className="p-3 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#dce1fb]">Климатическая долевая нагрузка:</span>
            <span className="text-[#8b5cf6] font-bold">~68% общего потребления</span>
          </div>

          {/* Widget Footer */}
          <div className="pt-2.5 border-t border-white/5 text-[10px] text-[#94a3b8] flex items-center justify-between">
            <span>Амплитуда колебаний: <span className="text-white font-bold font-mono">7.1x</span></span>
            <span className="font-mono text-[#adc6ff]">2025–2026</span>
          </div>
        </motion.div>

        {/* Monthly Energy Consumption Trends (Recharts) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.4 }}
          whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="glass-card p-6 sm:p-8 rounded-[2.5rem] bento-span-2 flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#adc6ff]" />
                Динамика Месячного Потребления
              </h3>
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mt-0.5">
                Сравнение YoY • {trendMetric === 'KWH' ? 'Объем (кВт·ч)' : 'Стоимость (TL)'}
              </p>
            </div>

            {/* Metric Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#161e2e]/80 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
              <button
                onClick={() => setTrendMetric('KWH')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  trendMetric === 'KWH'
                    ? 'bg-[#adc6ff] text-[#001a42] shadow-md'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Объем (кВт·ч)
              </button>
              <button
                onClick={() => setTrendMetric('COST')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  trendMetric === 'COST'
                    ? 'bg-[#adc6ff] text-[#001a42] shadow-md'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Сумма (TL)
              </button>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={rechartsMonthlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} 
                  tickLine={false} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <RechartsTooltip content={<CustomRechartsTooltip unit={trendMetric === 'KWH' ? 'кВт·ч' : 'TL'} />} />
                <RechartsLegend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }} 
                />
                <RechartsLine 
                  type="monotone" 
                  dataKey="2025 Базовый" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={{ fill: '#94a3b8', r: 3 }} 
                  activeDot={{ r: 6 }} 
                  connectNulls
                />
                <RechartsLine 
                  type="monotone" 
                  dataKey="2026 Фактический" 
                  stroke="#adc6ff" 
                  strokeWidth={3} 
                  dot={{ fill: '#adc6ff', r: 4 }} 
                  activeDot={{ r: 7, fill: '#60a5fa', stroke: '#ffffff', strokeWidth: 2 }} 
                  connectNulls
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Mini Analytics: Daily Living Cost */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.45 }}
          whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="glass-card glow-warning p-6 rounded-3xl bg-gradient-to-br from-[#f59e0b]/5 via-transparent to-transparent border-[#f59e0b]/10 flex flex-col justify-between space-y-5"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#f59e0b]/15 flex items-center justify-center text-[#f59e0b] border border-[#f59e0b]/20">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest block">Суточный Расход</span>
                  <span className="text-[10px] text-[#f59e0b] font-mono font-bold">Июль 2026</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] text-[10px] font-mono font-bold border border-[#f59e0b]/20">
                +111.9% YoY
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold font-mono text-white tracking-tight">231.8</h3>
                <span className="text-xs font-bold text-[#f59e0b] font-mono">TL / день</span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5 flex items-center gap-1.5 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse"></span>
                ~40.7 кВт·ч / сутки (пик сезона)
              </p>
            </div>
          </div>

          {/* YoY Period Comparison */}
          <div className="p-3 rounded-2xl bg-[#0c1324]/60 border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
              <span>Сравнение периода (Июль)</span>
              <span className="text-white font-mono">Динамика</span>
            </div>

            <div className="space-y-1.5">
              <div>
                <div className="flex justify-between text-[11px] font-mono mb-0.5">
                  <span className="text-[#94a3b8]">2025 (Базовый)</span>
                  <span className="text-white font-bold">109.4 TL <span className="text-[9px] text-[#94a3b8]">(33.7 кВт·ч)</span></span>
                </div>
                <div className="h-1.5 w-full bg-[#191f31] rounded-full overflow-hidden">
                  <div className="h-full bg-[#94a3b8] rounded-full" style={{ width: '47%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono mb-0.5">
                  <span className="text-[#f59e0b] font-bold">2026 (Текущий)</span>
                  <span className="text-[#f59e0b] font-bold">231.8 TL <span className="text-[9px] text-[#94a3b8]">(40.7 кВт·ч)</span></span>
                </div>
                <div className="h-1.5 w-full bg-[#191f31] rounded-full overflow-hidden">
                  <div className="h-full bg-[#f59e0b] rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily 3-Tariff Phase Breakdown */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider block">
              Распределение по фазам дня (3-Tarih)
            </span>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[#94a3b8] block truncate">Дневной (T1)</span>
                <span className="text-white font-bold block mt-0.5">118.2 TL</span>
                <span className="text-[9px] text-[#adc6ff]">51% (12-17h)</span>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[#94a3b8] block truncate">Пиковый (T2)</span>
                <span className="text-[#f43f5e] font-bold block mt-0.5">83.4 TL</span>
                <span className="text-[9px] text-[#f43f5e]">36% (17-22h)</span>
              </div>

              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="text-[#94a3b8] block truncate">Ночной (T3)</span>
                <span className="text-[#4edea3] font-bold block mt-0.5">30.2 TL</span>
                <span className="text-[9px] text-[#4edea3]">13% (22-06h)</span>
              </div>
            </div>
          </div>

          {/* Mini 7-Day Sparkline Bar Chart */}
          <div>
            <div className="flex justify-between items-center text-[10px] font-mono text-[#94a3b8] mb-1.5">
              <span>Профиль расходов за неделю:</span>
              <span className="text-white font-bold">Выходные +26%</span>
            </div>
            <div className="flex items-end justify-between gap-1.5 h-10 pt-1 border-t border-white/5">
              {[
                { day: 'Пн', val: 210, pct: '75%' },
                { day: 'Вт', val: 205, pct: '73%' },
                { day: 'Ср', val: 220, pct: '80%' },
                { day: 'Чт', val: 215, pct: '77%' },
                { day: 'Пт', val: 235, pct: '88%' },
                { day: 'Сб', val: 268, pct: '98%' },
                { day: 'Вс', val: 270, pct: '100%' },
              ].map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full bg-[#191f31] rounded-t-md h-7 flex items-end overflow-hidden p-0.5">
                    <div 
                      className={`w-full rounded-t-sm transition-all ${
                        i >= 5 ? 'bg-[#f43f5e]' : 'bg-[#f59e0b]'
                      }`} 
                      style={{ height: d.pct }}
                    ></div>
                  </div>
                  <span className="text-[9px] font-mono text-[#94a3b8] group-hover:text-white transition-colors">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mini Analytics: Taxes Paid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="glass-card glow-tertiary p-6 rounded-3xl bg-gradient-to-br from-[#4edea3]/5 via-transparent to-transparent border-[#4edea3]/10 flex flex-col justify-between space-y-5"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#4edea3]/15 flex items-center justify-center text-[#4edea3] border border-[#4edea3]/20">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest block">Уплачено Налогов</span>
                  <span className="text-[10px] text-[#4edea3] font-mono font-bold">2026 YTD (7 мес)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#4edea3]/10 text-[#4edea3] text-[10px] font-mono font-bold border border-[#4edea3]/20">
                11.6% от счета
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold font-mono text-white tracking-tight">3 336</h3>
                <span className="text-xs font-bold text-[#4edea3] font-mono">TL</span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5 font-mono">
                В среднем <span className="text-white font-bold">476.6 TL</span> / месяц в виде налогов и сборов
              </p>
            </div>
          </div>

          {/* Multi-Color Segmented Stack Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
              <span>Структура налоговой нагрузки</span>
              <span className="text-[#4edea3] font-mono">100% (3 336 TL)</span>
            </div>

            <div className="h-3 w-full bg-[#191f31] rounded-full overflow-hidden flex p-0.5 gap-0.5">
              <div className="h-full bg-[#4edea3] rounded-l-full" style={{ width: '69%' }} title="KDV 69%"></div>
              <div className="h-full bg-[#8b5cf6]" style={{ width: '21.5%' }} title="BTV 21.5%"></div>
              <div className="h-full bg-[#f59e0b] rounded-r-full" style={{ width: '9.5%' }} title="Энергофонды 9.5%"></div>
            </div>
          </div>

          {/* Itemized Tax List Breakdown */}
          <div className="space-y-2.5">
            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                  <span className="text-white font-bold">НДС (KDV 8–10%)</span>
                </div>
                <span className="text-white font-bold">2 301 TL</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>Основной налог с продаж</span>
                <span className="text-[#4edea3] font-bold">69.0%</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8b5cf6]"></span>
                  <span className="text-white font-bold">Муниципальный налог (BTV 5%)</span>
                </div>
                <span className="text-white font-bold">718 TL</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>Налог в городской бюджет</span>
                <span className="text-[#8b5cf6] font-bold">21.5%</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
              <div className="flex justify-between items-center text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                  <span className="text-white font-bold">Сборы и Энергетические Фонды</span>
                </div>
                <span className="text-white font-bold">317 TL</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>Фонд развития энергетики (1%)</span>
                <span className="text-[#f59e0b] font-bold">9.5%</span>
              </div>
            </div>
          </div>

          {/* YoY Comparison Footer Note */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#94a3b8]">
            <span>Рост сборов YoY:</span>
            <span className="text-[#4edea3] font-bold">+141.7% (соразмерно тарифу)</span>
          </div>
        </motion.div>
      </div>

      {/* Invoice Registry Section */}
      <div className="glass-card rounded-[2.5rem] overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-[#424754] flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#191f31] flex items-center justify-center text-[#adc6ff] shadow-inner">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Реестр Счетов</h3>
              <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mt-0.5">
                {invoices.length} Обработанных документов
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToInvoices}
              className="px-4 py-2.5 rounded-2xl bg-[#191f31] border border-[#424754] text-[#adc6ff] text-xs font-bold hover:bg-[#1f2d42] transition-colors"
            >
              Полный Реестр
            </button>
            <button
              onClick={() => setIsRegistryOpen(!isRegistryOpen)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#adc6ff] text-[#001a42] text-xs font-bold transition-all hover:shadow-[0_0_20px_rgba(173,198,255,0.4)]"
            >
              <span>{isRegistryOpen ? 'Скрыть Счета' : 'Показать Все Счета'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isRegistryOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isRegistryOpen && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                <input
                  type="text"
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  placeholder="Фильтр по периоду, дате счета..."
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-2xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:border-[#adc6ff] text-white font-mono placeholder:text-[#94a3b8]"
                />
              </div>

              <div className="flex p-1 bg-[#151b2d] rounded-2xl border border-[#424754]">
                {(['ALL', '2026', '2025'] as const).map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setTableYearFilter(yr)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      tableYearFilter === yr
                        ? 'bg-[#adc6ff] text-[#001a42]'
                        : 'text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {yr === 'ALL' ? 'Все' : yr}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest border-b border-[#424754]">
                    <th className="pb-4 px-4">Период</th>
                    <th className="pb-4 px-4">Дата Счета</th>
                    <th className="pb-4 px-4">Расход (кВт·ч)</th>
                    <th className="pb-4 px-4">Тариф (TL)</th>
                    <th className="pb-4 px-4">Энергия</th>
                    <th className="pb-4 px-4">Итого к оплате</th>
                    <th className="pb-4 px-4 text-center">Статус</th>
                    <th className="pb-4 px-4 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#424754]">
                  {filteredInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-4 font-bold text-white font-mono text-sm">{inv.period}</td>
                      <td className="py-4 px-4 text-[#94a3b8] text-xs">{inv.bill_date}</td>
                      <td className="py-4 px-4 text-[#adc6ff] font-bold font-mono text-sm">
                        {inv.kwh.toLocaleString('ru-RU')}
                      </td>
                      <td className="py-4 px-4 text-[#94a3b8] font-mono text-xs">
                        {inv.unit_rate_tl.toFixed(3)}
                      </td>
                      <td className="py-4 px-4 text-[#94a3b8] font-mono text-sm">
                        {Math.round(inv.net_amount_tl).toLocaleString('ru-RU')}
                      </td>
                      <td className="py-4 px-4 font-bold text-white font-mono text-base">
                        {inv.total_amount_tl.toLocaleString('ru-RU')}{' '}
                        <span className="text-[10px] opacity-40 font-normal">TL</span>
                      </td>
                      <td className="py-4 px-4 text-center">
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
                      <td className="py-4 px-4 text-right">
                        <span className="text-xs text-[#adc6ff] group-hover:underline font-bold flex items-center justify-end gap-1">
                          Детали <FileDown className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
