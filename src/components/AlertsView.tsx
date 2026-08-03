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
  Info,
  Bell
} from 'lucide-react';
import { Invoice, NotificationItem } from '../types';

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
      const msg = `⚠️ ALERT: ${breaches.length} billing periods exceed threshold! Highest: ${topBreach.period} (${topBreach.kwh} kWh / ${topBreach.total_amount_tl} TL)`;
      onTriggerToast(msg, 'alert');

      // Add to notifications dropdown
      onAddNotification({
        id: `n-${Date.now()}`,
        title: `Threshold Breach Detected (${breaches.length} months)`,
        message: `${topBreach.period} usage of ${topBreach.kwh} kWh exceeded set limit of ${kwhThreshold} kWh.`,
        timestamp: 'Just now',
        type: 'alert',
        read: false
      });
    } else {
      onTriggerToast(`✓ All ${invoices.length} billing periods are within set limits (${kwhThreshold} kWh / ${costThreshold} TL)`, 'success');
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
      const msg = `🚨 THRESHOLD EXCEEDED: ${simPeriod} reading (${simKwh} kWh) exceeds limit (${kwhThreshold} kWh) by +${pct}%!`;

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
        title: `Simulated Usage Alert: ${simPeriod}`,
        message: `Reading ${simKwh} kWh exceeded threshold limit ${kwhThreshold} kWh. Est. Cost: ${estCost} TL.`,
        timestamp: 'Just now',
        type: 'alert',
        read: false
      });
    } else {
      onTriggerToast(`✓ Simulated usage ${simKwh} kWh for ${simPeriod} is SAFE within ${kwhThreshold} kWh threshold.`, 'success');
    }
  };

  const handleClearLogs = () => {
    setAlertLogs([]);
    onTriggerToast('Alert history logs cleared.', 'info');
  };

  return (
    <div className="space-y-8">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BellRing className="w-8 h-8 text-[#f43f5e]" />
            Energy Consumption Alerts & Monitoring
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1">
            Configure automated usage & expense thresholds and trigger real-time toast alerts upon breach
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleEvaluateAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f43f5e] text-white text-xs font-bold hover:bg-[#e11d48] transition-all shadow-lg shadow-[#f43f5e]/20"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Scan Data Now</span>
          </button>
        </div>
      </div>

      {/* Threshold Status Banner */}
      <div className={`glass-card p-6 rounded-3xl border transition-all ${
        thresholdBreaches.length > 0 
          ? 'bg-[#f43f5e]/10 border-[#f43f5e]/30' 
          : 'bg-[#4edea3]/10 border-[#4edea3]/30'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              thresholdBreaches.length > 0 ? 'bg-[#f43f5e]/20 text-[#f43f5e]' : 'bg-[#4edea3]/20 text-[#4edea3]'
            }`}>
              {thresholdBreaches.length > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {thresholdBreaches.length > 0 
                  ? `${thresholdBreaches.length} Monthly Period(s) Exceed Current Limits` 
                  : 'All Monthly Consumption Records are Within Limits'}
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Active Limits: <span className="font-mono text-[#adc6ff] font-bold">{kwhThreshold} kWh</span> / month or <span className="font-mono text-[#adc6ff] font-bold">{costThreshold.toLocaleString('ru-RU')} TL</span> / month
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-[10px] font-bold uppercase text-[#94a3b8]">Auto Monitoring</span>
            <button
              onClick={() => {
                setAutoMonitor(!autoMonitor);
                onTriggerToast(`Auto monitoring ${!autoMonitor ? 'ENABLED' : 'DISABLED'}`, !autoMonitor ? 'success' : 'warning');
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                autoMonitor ? 'bg-[#4edea3]' : 'bg-[#424754]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-[#0c1324] transition-transform ${
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
            <Sliders className="w-5 h-5 text-[#adc6ff]" />
            Set Alert Thresholds
          </h3>
          <p className="text-xs text-[#94a3b8] mb-6">
            Adjust threshold parameters. Exceeding these limits triggers toast notifications and system alerts.
          </p>

          <div className="space-y-6">
            {/* kWh Limit Slider & Number Box */}
            <div className="p-4 bg-[#151b2d] rounded-2xl border border-[#424754] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#adc6ff]" />
                  Monthly kWh Limit
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={kwhThreshold}
                    onChange={(e) => setKwhThreshold(Math.max(100, Number(e.target.value)))}
                    className="w-24 bg-[#0c1324] border border-[#424754] rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-[#adc6ff]"
                  />
                  <span className="text-xs font-mono text-[#94a3b8]">kWh</span>
                </div>
              </div>

              <input
                type="range"
                min="300"
                max="2500"
                step="50"
                value={kwhThreshold}
                onChange={(e) => setKwhThreshold(Number(e.target.value))}
                className="w-full accent-[#adc6ff] h-2 bg-[#191f31] rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>Min: 300 kWh</span>
                <span>Recommended: 800 - 1,000 kWh</span>
                <span>Max: 2,500 kWh</span>
              </div>
            </div>

            {/* TL Cost Limit Slider & Number Box */}
            <div className="p-4 bg-[#151b2d] rounded-2xl border border-[#424754] space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#f59e0b]" />
                  Monthly Bill Limit (TL)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={costThreshold}
                    onChange={(e) => setCostThreshold(Math.max(500, Number(e.target.value)))}
                    className="w-28 bg-[#0c1324] border border-[#424754] rounded-lg px-2 py-1 text-right text-xs font-mono font-bold text-[#f59e0b]"
                  />
                  <span className="text-xs font-mono text-[#94a3b8]">TL</span>
                </div>
              </div>

              <input
                type="range"
                min="1000"
                max="15000"
                step="250"
                value={costThreshold}
                onChange={(e) => setCostThreshold(Number(e.target.value))}
                className="w-full accent-[#f59e0b] h-2 bg-[#191f31] rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-[#94a3b8] font-mono">
                <span>1,000 TL</span>
                <span>Recommended: 5,000 TL</span>
                <span>15,000 TL</span>
              </div>
            </div>

            <button
              onClick={handleEvaluateAll}
              className="w-full py-3 rounded-2xl bg-[#adc6ff] text-[#001a42] text-xs font-bold hover:bg-white transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Thresholds & Evaluate Database</span>
            </button>
          </div>
        </div>

        {/* Live Simulator Tester */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] bg-gradient-to-br from-[#191f31] to-[#121827] border-[#424754]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-[#4edea3]" />
              Test Alert Trigger Simulator
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-[#4edea3]/10 text-[#4edea3] text-[10px] font-bold">
              Interactive Test
            </span>
          </div>

          <p className="text-xs text-[#94a3b8] mb-6">
            Simulate a new incoming monthly meter reading to test threshold breach logic and live toast notifications.
          </p>

          <form onSubmit={handleRunSimulation} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">
                Target Billing Period
              </label>
              <input
                type="text"
                value={simPeriod}
                onChange={(e) => setSimPeriod(e.target.value)}
                placeholder="e.g. 2026-08"
                className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-[#4edea3] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">
                Simulated Usage (kWh)
              </label>
              <input
                type="number"
                step="10"
                value={simKwh}
                onChange={(e) => setSimKwh(Number(e.target.value))}
                className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-[#4edea3] focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#0c1324] rounded-xl border border-white/5 text-xs font-mono space-y-1">
              <div className="flex justify-between text-[#94a3b8]">
                <span>Configured Limit:</span>
                <span className="text-[#adc6ff] font-bold">{kwhThreshold} kWh</span>
              </div>
              <div className="flex justify-between text-[#94a3b8]">
                <span>Status Prediction:</span>
                {simKwh > kwhThreshold ? (
                  <span className="text-[#f43f5e] font-bold">Will Trigger Toast Alert (+{simKwh - kwhThreshold} kWh)</span>
                ) : (
                  <span className="text-[#4edea3] font-bold">Normal / Within Limit</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-[#4edea3] text-[#002113] text-xs font-bold hover:bg-[#6ffbbe] transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Simulate Meter Input & Test Toast</span>
            </button>
          </form>
        </div>
      </div>

      {/* Flagged Historic Months Breakdown Table */}
      <div className="glass-card rounded-[2.5rem] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Historic Months Exceeding Threshold</h3>
            <p className="text-xs text-[#94a3b8]">
              Filtered results based on current threshold limit of {kwhThreshold} kWh / {costThreshold.toLocaleString('ru-RU')} TL
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#f43f5e]/15 text-[#f43f5e] text-xs font-bold font-mono">
            {thresholdBreaches.length} Flagged
          </span>
        </div>

        {thresholdBreaches.length === 0 ? (
          <div className="text-center py-8 text-[#94a3b8] text-xs">
            <CheckCircle2 className="w-8 h-8 text-[#4edea3] mx-auto mb-2" />
            No historical months exceeded your configured threshold of {kwhThreshold} kWh!
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest border-b border-[#424754]">
                  <th className="pb-3 px-4">Period</th>
                  <th className="pb-3 px-4">kWh Consumed</th>
                  <th className="pb-3 px-4">Set Threshold</th>
                  <th className="pb-3 px-4">Excess kWh</th>
                  <th className="pb-3 px-4">Bill Amount</th>
                  <th className="pb-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#424754]/60 font-mono text-xs">
                {thresholdBreaches.map((inv) => {
                  const excess = Math.max(0, Math.round(inv.kwh - kwhThreshold));
                  const pct = Math.round((excess / kwhThreshold) * 100);
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{inv.period}</td>
                      <td className="py-3.5 px-4 text-[#f43f5e] font-bold">{inv.kwh.toLocaleString('ru-RU')} kWh</td>
                      <td className="py-3.5 px-4 text-[#94a3b8]">{kwhThreshold} kWh</td>
                      <td className="py-3.5 px-4 text-[#f59e0b] font-bold">
                        +{excess} kWh (+{pct}%)
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold">{inv.total_amount_tl.toLocaleString('ru-RU')} TL</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#f43f5e]/15 text-[#f43f5e] text-[10px] font-bold border border-[#f43f5e]/30">
                          Breach
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
            <h3 className="text-lg font-bold text-white">Alert Event Log History</h3>
            <p className="text-xs text-[#94a3b8]">Audit trail of triggered threshold notifications</p>
          </div>
          {alertLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151b2d] border border-[#424754] text-[#94a3b8] hover:text-white text-xs font-bold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {alertLogs.length === 0 ? (
            <p className="text-xs text-[#94a3b8] py-4 text-center">No alert events logged.</p>
          ) : (
            alertLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-[#151b2d] border border-[#424754] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    log.severity === 'CRITICAL' ? 'bg-[#f43f5e]/20 text-[#f43f5e]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{log.period} Threshold Alert</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                        log.severity === 'CRITICAL' ? 'bg-[#f43f5e]/20 text-[#f43f5e]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                      }`}>
                        {log.severity}
                      </span>
                    </div>
                    <p className="text-[#94a3b8] mt-0.5 font-mono">
                      Recorded: {log.kwh} kWh (Limit: {log.threshold} kWh) • Est Bill: {log.cost.toLocaleString('ru-RU')} TL
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-[#94a3b8]">{log.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
