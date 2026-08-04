import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Zap,
  TrendingUp,
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
  FileDown
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

const CustomRechartsTooltip = ({ active, payload, label, unit }: { active?: boolean; payload?: any[]; label?: string; unit?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#161e2e]/95 backdrop-blur-md border border-[#adc6ff]/20 p-3 rounded-xl shadow-2xl text-xs font-sans">
        <p className="font-bold text-white mb-2 pb-1 border-b border-white/10">{label} Consumption</p>
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

  // Compute monthly data for Recharts line chart from invoices
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const rechartsMonthlyData = monthNames.map((monthStr, index) => {
    const monthNumStr = String(index + 1).padStart(2, '0');
    const inv2025 = invoices.find(i => i.period === `2025-${monthNumStr}`);
    const inv2026 = invoices.find(i => i.period === `2026-${monthNumStr}`);
    return {
      month: monthStr,
      '2025 Baseline': inv2025 ? (trendMetric === 'KWH' ? inv2025.kwh : inv2025.total_amount_tl) : null,
      '2026 Actual': inv2026 ? (trendMetric === 'KWH' ? inv2026.kwh : inv2026.total_amount_tl) : null,
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
                Enerji Portfolio Overview
              </h1>
              <span className="px-3 py-1 rounded-full bg-[#adc6ff]/10 border border-[#adc6ff]/20 text-[#adc6ff] text-[10px] font-bold uppercase tracking-widest">
                Premium Analytics
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
                Total Consumption 2025
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-white">
                {account.totalConsumption2025Tl.toLocaleString('ru-RU')} <span className="text-xs font-normal text-[#94a3b8]">TL</span>
              </p>
              <p className="text-[11px] font-mono text-[#94a3b8] mt-0.5">
                {account.totalConsumption2025Kwh.toLocaleString('ru-RU')} kWh
              </p>
            </div>

            <div className="px-5 py-3.5 rounded-2xl bg-[#adc6ff]/5 border border-[#adc6ff]/20 backdrop-blur-md ring-1 ring-[#adc6ff]/20">
              <p className="text-[10px] font-bold text-[#adc6ff] uppercase tracking-widest mb-1">
                Total Consumption 2026
              </p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-[#adc6ff]">
                {account.totalConsumption2026Tl.toLocaleString('ru-RU')} <span className="text-xs font-normal text-[#94a3b8]">TL</span>
              </p>
              <p className="text-[11px] font-mono text-[#adc6ff]/70 mt-0.5">
                {account.totalConsumption2026Kwh.toLocaleString('ru-RU')} kWh (7m)
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
              Current Bill (Jul)
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
              <span className="text-[#f59e0b] font-bold">+68.7%</span> vs July 2025
            </p>
          </div>
          <div className="pt-3 border-t border-[#424754] flex justify-between items-center text-[10px] font-bold uppercase text-[#94a3b8] tracking-widest">
            <span>Due Date</span>
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
              Consumption (Jul)
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#adc6ff]/10 border border-[#adc6ff]/20 flex items-center justify-center text-[#adc6ff]">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="py-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              1 133.58 <span className="text-sm font-bold text-[#adc6ff]">kWh</span>
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-1">
              <span className="text-[#4edea3] font-bold">-4.0%</span> vs July 2025
            </p>
          </div>
          <div className="pt-3 border-t border-[#424754] flex justify-between items-center text-[10px] font-bold uppercase text-[#94a3b8] tracking-widest">
            <span>Daily Avg</span>
            <span className="text-white font-mono">32.39 kWh</span>
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
              YTD Growth
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="py-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              +20.3% <span className="text-sm font-bold text-[#8b5cf6]">kWh</span>
            </h3>
            <p className="text-[11px] text-[#94a3b8] mt-1">
              5,055 vs 4,201 kWh (YTD)
            </p>
          </div>
          <div className="pt-3 border-t border-[#424754] flex justify-between items-center text-[10px] font-bold uppercase text-[#94a3b8] tracking-widest">
            <span>Cost Diff</span>
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
              Avg kWh Price
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
              vs 2.79 TL/kWh in 2025
            </p>
          </div>
          <div className="pt-3 border-t border-[#424754] flex justify-between items-center text-[10px] font-bold uppercase text-[#94a3b8] tracking-widest">
            <span>Indexation</span>
            <span className="text-[#f43f5e] font-mono">+104% YoY</span>
          </div>
        </motion.div>

        {/* Chart Block: kWh YoY (Large Bento) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="glass-card p-6 sm:p-8 rounded-[2.5rem] bento-span-2 bento-row-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">Volume Trend YoY</h3>
              <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mt-0.5">
                Jan – Jul Comparison (kWh)
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
          <div className="h-72 w-full">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </motion.div>

        {/* Forecast Card (Tall Bento) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="glass-card p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-[#adc6ff]/10 to-transparent border-[#adc6ff]/20 bento-row-2 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-[#adc6ff] text-[#001a42] rounded-full text-[10px] font-bold uppercase tracking-wider">
                AI Forecast
              </span>
              <Sparkles className="w-5 h-5 text-[#adc6ff] animate-pulse" />
            </div>
            
            <h4 className="text-[10px] font-bold text-[#adc6ff] uppercase tracking-widest mb-1">
              August Prediction
            </h4>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-white mb-6">
              {estMinTl.toLocaleString('ru-RU')} – {estMaxTl.toLocaleString('ru-RU')} <span className="text-sm font-bold opacity-50">TL</span>
            </p>

            <div className="space-y-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase mb-1">Est. Consumption</p>
                <p className="text-base font-bold font-mono text-white">
                  {estMinKwh.toLocaleString('ru-RU')} - {estMaxKwh.toLocaleString('ru-RU')} <span className="text-xs opacity-50">kWh</span>
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-[10px] font-bold text-[#94a3b8] uppercase mb-1">Last Year (Aug)</p>
                <p className="text-base font-bold font-mono text-[#94a3b8]">
                  1,222 <span className="text-xs opacity-50">kWh</span>
                </p>
              </div>
            </div>

            {/* Interactive AC Simulator Slider */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-[#adc6ff]">
                <span>Climate Load (AC)</span>
                <span>{acIntensity}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="140"
                value={acIntensity}
                onChange={(e) => setAcIntensity(Number(e.target.value))}
                className="w-full accent-[#adc6ff] h-1 bg-[#191f31] rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <p className="text-[11px] text-[#94a3b8] leading-relaxed pt-4 border-t border-white/5">
            Calculated using seasonal patterns and current price indexation (5.69 TL/kWh).
          </p>
        </motion.div>

        {/* Cost Radar (Bento Square) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="glass-card glow-info p-6 sm:p-8 rounded-[2.5rem]"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Seasonality</h3>
            <Radar className="w-4 h-4 text-[#8b5cf6]" />
          </div>
          <div className="h-44 w-full">
            <RadarChart data={radarChartData} options={radarChartOptions} />
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
                Monthly Consumption Trends
              </h3>
              <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest mt-0.5">
                Recharts YoY Comparison • {trendMetric === 'KWH' ? 'Volume (kWh)' : 'Cost (TL)'}
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
                kWh Usage
              </button>
              <button
                onClick={() => setTrendMetric('COST')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  trendMetric === 'COST'
                    ? 'bg-[#adc6ff] text-[#001a42] shadow-md'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                TL Spend
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
                <RechartsTooltip content={<CustomRechartsTooltip unit={trendMetric === 'KWH' ? 'kWh' : 'TL'} />} />
                <RechartsLegend 
                  wrapperStyle={{ paddingTop: '10px', fontSize: '11px', color: '#94a3b8' }} 
                />
                <RechartsLine 
                  type="monotone" 
                  dataKey="2025 Baseline" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={{ fill: '#94a3b8', r: 3 }} 
                  activeDot={{ r: 6 }} 
                  connectNulls
                />
                <RechartsLine 
                  type="monotone" 
                  dataKey="2026 Actual" 
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
          className="glass-card glow-warning p-6 rounded-3xl bg-gradient-to-br from-[#f59e0b]/5 to-transparent border-[#f59e0b]/10 flex flex-col justify-between"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b]">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Daily Cost</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white">231.8 <span className="text-xs font-normal text-[#94a3b8]">TL/day</span></h3>
            <p className="text-[10px] text-[#94a3b8] mt-1">Peak Jul 2026 usage</p>
          </div>
        </motion.div>

        {/* Mini Analytics: Taxes Paid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.2, ease: 'easeOut' } }}
          className="glass-card glow-tertiary p-6 rounded-3xl bg-gradient-to-br from-[#4edea3]/5 to-transparent border-[#4edea3]/10 flex flex-col justify-between"
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#4edea3]/10 flex items-center justify-center text-[#4edea3]">
              <Receipt className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Taxes Paid</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white">3 336 <span className="text-xs font-normal text-[#94a3b8]">TL</span></h3>
            <p className="text-[10px] text-[#4edea3] mt-1">11.6% of total YTD</p>
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
              <h3 className="text-xl font-bold text-white tracking-tight">Invoice History</h3>
              <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest mt-0.5">
                {invoices.length} Processed Documents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToInvoices}
              className="px-4 py-2.5 rounded-2xl bg-[#191f31] border border-[#424754] text-[#adc6ff] text-xs font-bold hover:bg-[#1f2d42] transition-colors"
            >
              Full Screen View
            </button>
            <button
              onClick={() => setIsRegistryOpen(!isRegistryOpen)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#adc6ff] text-[#001a42] text-xs font-bold transition-all hover:shadow-[0_0_20px_rgba(173,198,255,0.4)]"
            >
              <span>{isRegistryOpen ? 'Hide Invoices' : 'View All Invoices'}</span>
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
                  placeholder="Filter by period, bill date..."
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
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest border-b border-[#424754]">
                    <th className="pb-4 px-4">Period</th>
                    <th className="pb-4 px-4">Bill Date</th>
                    <th className="pb-4 px-4">Usage (kWh)</th>
                    <th className="pb-4 px-4">Rate (TL)</th>
                    <th className="pb-4 px-4">Net Energy</th>
                    <th className="pb-4 px-4">Total Amount</th>
                    <th className="pb-4 px-4 text-center">Status</th>
                    <th className="pb-4 px-4 text-right">Action</th>
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
                            Pending
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-[#4edea3]/10 text-[#4edea3] text-[9px] font-bold uppercase tracking-wider border border-[#4edea3]/20">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-xs text-[#adc6ff] group-hover:underline font-bold flex items-center justify-end gap-1">
                          View <FileDown className="w-3.5 h-3.5" />
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
