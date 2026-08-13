import React, { useState } from 'react';
import { 
  BellRing, 
  AlertTriangle, 
  Sliders, 
  CheckCircle2, 
  ShieldAlert, 
  Zap, 
  Play, 
  Trash2, 
  Bell
} from 'lucide-react';
import { Invoice, NotificationItem } from '../types';
import { formatTL, formatUSD, formatEUR, formatKWh } from '../utils/formatters';

interface AlertsViewProps {
  invoices: Invoice[];
  kwhThreshold: number;
  setKwhThreshold: (val: number) => void;
  costThreshold: number;
  setCostThreshold: (val: number) => void;
  onTriggerToast: (msg: string, type?: 'alert' | 'warning' | 'success' | 'info') => void;
  onAddNotification: (notif: NotificationItem) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  invoices,
  kwhThreshold,
  setKwhThreshold,
  costThreshold,
  setCostThreshold,
  onTriggerToast,
  onAddNotification,
}) => {
  const [autoMonitor, setAutoMonitor] = useState(true);
  const [simPeriod, setSimPeriod] = useState('2026-08');
  const [simKwh, setSimKwh] = useState(1250);
  const [alertLogs, setAlertLogs] = useState<{ id: string; period: string; kwh: number; threshold: number; cost: number; time: string; severity: 'CRITICAL' | 'WARNING' }[]>([
    {
      id: 'log-1',
      period: '2026-01',
      kwh: 1511.57,
      threshold: 1000,
      cost: 8945,
      time: '02.08.2026 14:20',
      severity: 'CRITICAL'
    },
    {
      id: 'log-2',
      period: '2026-07',
      kwh: 1133.58,
      threshold: 1000,
      cost: 7185,
      time: '28.07.2026 09:15',
      severity: 'WARNING'
    }
  ]);

  // Find all invoices exceeding the user-defined kWh or cost threshold
  const thresholdBreaches = invoices.filter(
    (inv) => inv.kwh > kwhThreshold || inv.total_amount_tl > costThreshold
  );

  const handleEvaluateAll = () => {
    const breaches = invoices.filter(
      (inv) => inv.kwh > kwhThreshold || inv.total_amount_tl > costThreshold
    );

    if (breaches.length > 0) {
      const topBreach = breaches[0];
      const msg = `⚠️ ALERT: ${breaches.length} billing periods exceed threshold! Highest: ${topBreach.period} (${topBreach.kwh} kWh / ${formatTL(topBreach.total_amount_tl)} TL)`;
      onTriggerToast(msg, 'alert');

      onAddNotification({
        id: `n-${Date.now()}`,
        title: `Порог превышен (${breaches.length} мес.)`,
        message: `Расход ${topBreach.period} (${formatKWh(topBreach.kwh)}) превысил лимит ${kwhThreshold} кВт·ч.`,
        timestamp: 'Только что',
        type: 'alert',
        read: false
      });
    } else {
      onTriggerToast(`✓ Все ${invoices.length} периодов находятся в пределах лимитов (${kwhThreshold} кВт·ч / ${formatTL(costThreshold)} TL)`, 'success');
    }
  };

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    const isExceededKwh = simKwh > kwhThreshold;
    const estCost = Math.round(simKwh * 5.69 * 1.12);
    const isExceededCost = estCost > costThreshold;

    if (isExceededKwh || isExceededCost) {
      const excessKwh = simKwh - kwhThreshold;
      const pct = Math.round((excessKwh / kwhThreshold) * 100);
      const msg = `🚨 ПРЕВЫШЕНИЕ ПОРОГА: ${simPeriod} (${simKwh} кВт·ч) превышает лимит (${kwhThreshold} кВт·ч) на +${pct}%!`;

      onTriggerToast(msg, 'alert');

      const newLog = {
        id: `log-${Date.now()}`,
        period: simPeriod,
        kwh: simKwh,
        threshold: kwhThreshold,
        cost: estCost,
        time: new Date().toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
        severity: simKwh > kwhThreshold * 1.3 ? ('CRITICAL' as const) : ('WARNING' as const)
      };

      setAlertLogs(prev => [newLog, ...prev]);

      onAddNotification({
        id: `n-${Date.now()}`,
        title: `Тестовое превышение: ${simPeriod}`,
        message: `Расход ${simKwh} кВт·ч превысил порог ${kwhThreshold} кВт·ч. Оценка счета: ${formatTL(estCost)} TL.`,
        timestamp: 'Только что',
        type: 'alert',
        read: false
      });
    } else {
      onTriggerToast(`✓ Показание ${simKwh} кВт·ч для ${simPeriod} безопасно в рамках ${kwhThreshold} кВт·ч.`, 'success');
    }
  };

  const handleClearLogs = () => {
    setAlertLogs([]);
    onTriggerToast('История журнала очищена.', 'info');
  };

  return (
    <div className="space-y-8">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BellRing className="w-8 h-8 text-rose-400" />
            Мониторинг и Превышение Лимитов
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Настройка автоматических порогов расхода и стоимости, мгновенные уведомления при превышении
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEvaluateAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all shadow-md cursor-pointer font-mono"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Проверить Данные</span>
          </button>
        </div>
      </div>

      {/* Threshold Status Banner */}
      <div className={`glass-card p-6 rounded-3xl border transition-all ${
        thresholdBreaches.length > 0 
          ? 'bg-rose-500/10 border-rose-500/30' 
          : 'bg-emerald-500/10 border-emerald-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              thresholdBreaches.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {thresholdBreaches.length > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {thresholdBreaches.length > 0 
                  ? `${thresholdBreaches.length} Месяц(ев) превышают текущие лимиты` 
                  : 'Все месячные показатели находятся в пределах нормы'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Активные лимиты: <span className="text-sky-400 font-bold">{kwhThreshold} кВт·ч</span> / мес. или <span className="text-sky-400 font-bold">{formatTL(costThreshold)} TL</span> / мес.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center font-mono">
            <span className="text-[10px] font-bold uppercase text-slate-400">Авто-мониторинг</span>
            <button
              onClick={() => {
                setAutoMonitor(!autoMonitor);
                onTriggerToast(`Авто-мониторинг ${!autoMonitor ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}`, !autoMonitor ? 'success' : 'warning');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer ${
                autoMonitor ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                autoMonitor ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Threshold Configuration & Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Threshold Configuration Card */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            Настройка Пороговых Значений
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Настройте допустимые параметры. Превышение этих лимитов вызывает всплывающие предупреждения.
          </p>

          <div className="space-y-6">
            {/* kWh Limit Slider & Number Box */}
            <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-3 font-mono">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-400" />
                  Месячный Лимит (кВт·ч)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={kwhThreshold}
                    onChange={(e) => setKwhThreshold(Math.max(100, Number(e.target.value)))}
                    className="w-24 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-right text-xs font-bold text-sky-400"
                  />
                  <span className="text-xs text-slate-400">кВт·ч</span>
                </div>
              </div>

              <input
                type="range"
                min="300"
                max="2500"
                step="50"
                value={kwhThreshold}
                onChange={(e) => setKwhThreshold(Number(e.target.value))}
                className="w-full accent-sky-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Мин: 300 кВт·ч</span>
                <span>Рекомендуется: 800 - 1000 кВт·ч</span>
                <span>Макс: 2500 кВт·ч</span>
              </div>
            </div>

            {/* TL Cost Limit Slider & Number Box */}
            <div className="p-4 bg-slate-900 border border-white/5 rounded-2xl space-y-3 font-mono">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  Месячный Лимит Счета (TL)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={costThreshold}
                    onChange={(e) => setCostThreshold(Math.max(500, Number(e.target.value)))}
                    className="w-28 bg-slate-950 border border-white/10 rounded-lg px-2 py-1 text-right text-xs font-bold text-amber-400"
                  />
                  <span className="text-xs text-slate-400">TL</span>
                </div>
              </div>

              <input
                type="range"
                min="1000"
                max="15000"
                step="250"
                value={costThreshold}
                onChange={(e) => setCostThreshold(Number(e.target.value))}
                className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 000 TL</span>
                <span>Рекомендуется: 5 000 TL</span>
                <span>15 000 TL</span>
              </div>
            </div>

            <button
              onClick={handleEvaluateAll}
              className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Применить Пороги и Проверить Базу</span>
            </button>
          </div>
        </div>

        {/* Live Simulator Tester */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" />
              Симулятор Тестового Уведомления
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold font-mono">
              Интерактивный
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            Смоделируйте новое показание счетчика для проверки логики срабатывания порогов.
          </p>

          <form onSubmit={handleRunSimulation} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Расчетный Период
              </label>
              <input
                type="text"
                value={simPeriod}
                onChange={(e) => setSimPeriod(e.target.value)}
                placeholder="например 2026-08"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Тестовый Расход (кВт·ч)
              </label>
              <input
                type="number"
                step="10"
                value={simKwh}
                onChange={(e) => setSimKwh(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-emerald-400 focus:outline-none"
              />
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Установленный Лимит:</span>
                <span className="text-sky-400 font-bold">{kwhThreshold} кВт·ч</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Прогноз Статуса:</span>
                {simKwh > kwhThreshold ? (
                  <span className="text-rose-400 font-bold">Вызовет Алаpм (+{simKwh - kwhThreshold} кВт·ч)</span>
                ) : (
                  <span className="text-emerald-400 font-bold">В норме / В пределах лимита</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Смоделировать Ввод и Проверить</span>
            </button>
          </form>
        </div>
      </div>

      {/* Flagged Historic Months Breakdown Table */}
      <div className="glass-card rounded-[2.5rem] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">История Превышений Порогов</h3>
            <p className="text-xs text-slate-400">
              Отфильтровано на основе лимита {kwhThreshold} кВт·ч / {formatTL(costThreshold)} TL
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold font-mono">
            {thresholdBreaches.length} Превышений
          </span>
        </div>

        {thresholdBreaches.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            Ни один месяц в истории не превысил установленный лимит {kwhThreshold} кВт·ч!
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">
                  <th className="pb-3 px-4">Период</th>
                  <th className="pb-3 px-4">Расход</th>
                  <th className="pb-3 px-4">Лимит</th>
                  <th className="pb-3 px-4">Превышение</th>
                  <th className="pb-3 px-4">Сумма Счета</th>
                  <th className="pb-3 px-4 text-center">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {thresholdBreaches.map((inv) => {
                  const excess = Math.max(0, Math.round(inv.kwh - kwhThreshold));
                  const pct = Math.round((excess / kwhThreshold) * 100);
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{inv.period}</td>
                      <td className="py-3.5 px-4 text-rose-400 font-bold">{formatTL(inv.kwh)} кВт·ч</td>
                      <td className="py-3.5 px-4 text-slate-400">{kwhThreshold} кВт·ч</td>
                      <td className="py-3.5 px-4 text-amber-400 font-bold">
                        +{excess} кВт·ч (+{pct}%)
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold">{formatTL(inv.total_amount_tl)} TL</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                          Превышение
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Triggered Alert Event History Log */}
      <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Журнал Событий Превышений</h3>
            <p className="text-xs text-slate-400">История срабатывания пороговых системных уведомлений</p>
          </div>
          {alertLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white text-xs font-bold cursor-pointer font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить Историю</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {alertLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Журнал событий пуст.</p>
          ) : (
            alertLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-slate-900 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-white text-sm">Превышение Порога {log.period}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        log.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {log.severity === 'CRITICAL' ? 'КРИТИЧНО' : 'ВНИМАНИЕ'}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5 font-mono">
                      Зафиксировано: {log.kwh} кВт·ч (Лимит: {log.threshold} кВт·ч) • Расчетный счет: {formatTL(log.cost)} TL
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400">{log.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
