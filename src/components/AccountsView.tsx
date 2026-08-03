import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Zap, 
  Check, 
  Plus, 
  ShieldCheck, 
  Sliders, 
  FileText,
  Save
} from 'lucide-react';
import { UserAccount } from '../types';

interface AccountsViewProps {
  account: UserAccount;
  onUpdateAccount: (updated: UserAccount) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ account, onUpdateAccount }) => {
  const [activeMeterId, setActiveMeterId] = useState('meter-1');
  const [formName, setFormName] = useState(account.name);
  const [formMeter, setFormMeter] = useState(account.meterNumber);
  const [formAddress, setFormAddress] = useState(account.address);
  const [formCity, setFormCity] = useState(account.city);
  const [formLimit, setFormLimit] = useState(account.usageLimitKwh);
  const [isSavedToast, setIsSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAccount({
      ...account,
      name: formName,
      meterNumber: formMeter,
      address: formAddress,
      city: formCity,
      usageLimitKwh: formLimit
    });
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const meters = [
    { id: 'meter-1', number: '0767090390', title: 'Main Flat - Kemer', active: true, usage: '7,407 kWh' },
    { id: 'meter-2', number: '0767090412', title: 'Beach Villa - Lara', active: false, usage: '3,120 kWh' },
    { id: 'meter-3', number: '0767090881', title: 'Office Space - Muratpaşa', active: false, usage: '1,890 kWh' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-[#adc6ff]" />
          Account & Meter Administration
        </h1>
        <p className="text-xs text-[#94a3b8] mt-1">
          Manage property subscriptions, meter settings, annual quotas, and multi-meter portfolio
        </p>
      </div>

      {/* Save Confirmation Toast */}
      {isSavedToast && (
        <div className="p-4 rounded-2xl bg-[#4edea3]/20 border border-[#4edea3] text-[#4edea3] text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Account parameters successfully saved to Enerji Pro profile!</span>
        </div>
      )}

      {/* Grid: Multi-meter list vs Account Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Multi Meter Selector */}
        <div className="glass-card p-6 rounded-[2rem] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Property Meters</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#adc6ff]/10 text-[#adc6ff] text-[10px] font-bold">
              3 Active
            </span>
          </div>

          <div className="space-y-3">
            {meters.map((m) => (
              <div
                key={m.id}
                onClick={() => setActiveMeterId(m.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeMeterId === m.id
                    ? 'bg-[#adc6ff]/10 border-[#adc6ff] text-white shadow-lg'
                    : 'bg-[#151b2d] border-[#424754] text-[#94a3b8] hover:text-white'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-xs text-white block">{m.title}</span>
                  {activeMeterId === m.id && <Check className="w-4 h-4 text-[#adc6ff]" />}
                </div>
                <p className="text-[11px] font-mono text-[#adc6ff]">№ {m.number}</p>
                <p className="text-[10px] text-[#94a3b8] mt-2 font-mono">Current Usage: {m.usage}</p>
              </div>
            ))}
          </div>

          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#424754] text-xs text-[#94a3b8] hover:text-white hover:border-[#adc6ff] transition-all">
            <Plus className="w-4 h-4" />
            <span>Link New Meter</span>
          </button>
        </div>

        {/* Account Details Form */}
        <div className="glass-card p-6 sm:p-8 rounded-[2rem] lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#4edea3]" />
            Subscription & Meter Details
          </h3>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#adc6ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">
                  Meter Serial Number
                </label>
                <input
                  type="text"
                  required
                  value={formMeter}
                  onChange={(e) => setFormMeter(e.target.value)}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#adc6ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#adc6ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#94a3b8] mb-1">
                  City / Region
                </label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  className="w-full bg-[#151b2d] border border-[#424754] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-[#adc6ff] focus:outline-none"
                />
              </div>
            </div>

            {/* Quota Slider */}
            <div className="p-4 bg-[#151b2d] rounded-2xl border border-[#424754] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#adc6ff]" />
                  Annual Usage Limit Quota
                </span>
                <span className="font-mono text-[#adc6ff] font-bold">{formLimit.toLocaleString('ru-RU')} kWh</span>
              </div>
              <input
                type="range"
                min="5000"
                max="25000"
                step="500"
                value={formLimit}
                onChange={(e) => setFormLimit(Number(e.target.value))}
                className="w-full accent-[#adc6ff] h-1.5 bg-[#191f31] rounded-lg cursor-pointer"
              />
              <p className="text-[10px] text-[#94a3b8]">
                Triggers visual warnings when usage exceeds 75% of configured annual quota.
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[#424754]">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#151b2d] border border-[#424754] text-xs text-[#94a3b8] hover:text-white"
              >
                <FileText className="w-4 h-4" />
                <span>Download Supply Contract PDF</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#adc6ff] text-[#001a42] text-xs font-bold hover:bg-white transition-all shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
