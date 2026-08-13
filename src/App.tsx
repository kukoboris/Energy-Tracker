import React, { useState } from 'react';
import { initialAccount, initialInvoices, initialNotifications } from './data/mockData';
import { Invoice, UserAccount, NotificationItem } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InvoicesView } from './components/InvoicesView';
import { AnalyticsView } from './components/AnalyticsView';
import { AccountsView } from './components/AccountsView';
import { GoogleSheetView } from './components/GoogleSheetView';
import { AlertsView } from './components/AlertsView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { LoginView } from './components/LoginView';
import { X, AlertTriangle, CheckCircle2, Info, Bell } from 'lucide-react';
import { formatTL } from './utils/formatters';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('fatura_authenticated') === 'true';
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [account, setAccount] = useState<UserAccount>(initialAccount);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const handleLogout = () => {
    localStorage.removeItem('fatura_authenticated');
    setIsAuthenticated(false);
  };

  // Threshold & Toast State
  const [kwhThreshold, setKwhThreshold] = useState<number>(1000);
  const [costThreshold, setCostThreshold] = useState<number>(5000);
  const [toast, setToast] = useState<{ message: string; type: 'alert' | 'warning' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'alert' | 'warning' | 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  const handlePayInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, status: 'PAID' };
      }
      return inv;
    }));

    const paidInv = invoices.find(i => i.id === invoiceId);
    const amount = paidInv ? formatTL(paidInv.total_amount_tl) : '';

    // Add notification
    const newNotif: NotificationItem = {
      id: `n-${Date.now()}`,
      title: 'Счет успешно оплачен',
      message: `Оплата на сумму ${amount} TL за период ${paidInv?.period || ''} подтверждена.`,
      timestamp: 'Только что',
      type: 'success',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`✓ Оплата ${amount} TL успешно проведена!`, 'success');
  };

  const handleImportInvoices = (newInvoices: Invoice[]) => {
    setInvoices(prev => [...newInvoices, ...prev]);

    let breaches = 0;
    newInvoices.forEach(inv => {
      if (inv.kwh > kwhThreshold || inv.total_amount_tl > costThreshold) {
        breaches++;
      }
    });

    if (breaches > 0) {
      showToast(`⚠️ Импортировано ${newInvoices.length} счетов (${breaches} превышают порог ${kwhThreshold} кВт·ч / ${formatTL(costThreshold)} TL)`, 'alert');
    } else {
      showToast(`✓ Успешно импортировано ${newInvoices.length} счетов!`, 'success');
    }

    const newNotif: NotificationItem = {
      id: `n-${Date.now()}`,
      title: 'Импорт пакета счетов',
      message: `В базу добавлено ${newInvoices.length} новых расчетных периодов.`,
      timestamp: 'Только что',
      type: breaches > 0 ? 'alert' : 'info',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleAddInvoice = (newInv: Invoice) => {
    setInvoices(prev => [newInv, ...prev]);

    const isKwhExceeded = newInv.kwh > kwhThreshold;
    const isCostExceeded = newInv.total_amount_tl > costThreshold;

    if (isKwhExceeded || isCostExceeded) {
      const msg = `⚠️ ВНИМАНИЕ: Новый счет (${newInv.period}) на ${newInv.kwh} кВт·ч (${formatTL(newInv.total_amount_tl)} TL) превышает установленный порог!`;
      showToast(msg, 'alert');

      const alertNotif: NotificationItem = {
        id: `n-${Date.now()}`,
        title: `Превышение лимита: ${newInv.period}`,
        message: `Зарегистрирован счет ${newInv.kwh} кВт·ч при пороге ${kwhThreshold} кВт·ч.`,
        timestamp: 'Только что',
        type: 'alert',
        read: false
      };
      setNotifications(prev => [alertNotif, ...prev]);
    } else {
      showToast(`✓ Новый счет за ${newInv.period} добавлен!`, 'success');

      const newNotif: NotificationItem = {
        id: `n-${Date.now()}`,
        title: 'Новый счет добавлен',
        message: `Счет за период ${newInv.period} (${formatTL(newInv.total_amount_tl)} TL) зарегистрирован.`,
        timestamp: 'Только что',
        type: 'info',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0b111e] text-slate-200 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        account={account}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <Header
          account={account}
          notifications={notifications}
          setNotifications={setNotifications}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onSelectAccountTab={() => setCurrentTab('accounts')}
          onLogout={handleLogout}
          invoices={invoices}
          onSelectInvoice={(inv) => setSelectedInvoice(inv)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />

        {/* Global Toast Alert Notification */}
        {toast && (
          <div className="fixed top-24 right-4 sm:right-8 z-50 max-w-md w-full transition-all">
            <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${
              toast.type === 'alert'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/40'
                : toast.type === 'info'
                ? 'bg-slate-900/90 text-sky-200 border-sky-500/40'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
            }`}>
              <div className="shrink-0 mt-0.5">
                {toast.type === 'alert' && <AlertTriangle className="w-5 h-5 text-rose-400" />}
                {toast.type === 'warning' && <Bell className="w-5 h-5 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              </div>
              <div className="flex-1 text-xs font-medium leading-relaxed font-mono">
                {toast.message}
              </div>
              <button
                onClick={() => setToast(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main View Container */}
        <main className="p-4 sm:p-8 max-w-[1600px] mx-auto w-full space-y-8">
          {currentTab === 'dashboard' && (
            <DashboardView
              account={account}
              invoices={invoices}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onNavigateToInvoices={() => setCurrentTab('invoices')}
            />
          )}

          {currentTab === 'invoices' && (
            <InvoicesView
              invoices={invoices}
              onSelectInvoice={(inv) => setSelectedInvoice(inv)}
              onAddInvoice={handleAddInvoice}
              onImportInvoices={handleImportInvoices}
              onPayInvoice={handlePayInvoice}
              searchQuery={searchQuery}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              account={account}
              invoices={invoices}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertsView
              invoices={invoices}
              kwhThreshold={kwhThreshold}
              setKwhThreshold={setKwhThreshold}
              costThreshold={costThreshold}
              setCostThreshold={setCostThreshold}
              onTriggerToast={showToast}
              onAddNotification={(notif) => setNotifications(prev => [notif, ...prev])}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsView
              account={account}
              onUpdateAccount={(updated) => {
                setAccount(updated);
                showToast('✓ Параметры аккаунта успешно сохранены!', 'success');
              }}
            />
          )}

          {currentTab === 'googlesheet' && (
            <GoogleSheetView
              invoices={invoices}
            />
          )}
        </main>
      </div>

      {/* Printable Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          account={account}
          onClose={() => setSelectedInvoice(null)}
          onPayInvoice={handlePayInvoice}
        />
      )}
    </div>
  );
}
