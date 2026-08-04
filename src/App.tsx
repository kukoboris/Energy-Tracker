import React, { useState, useEffect } from 'react';
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
    const amount = paidInv ? paidInv.total_amount_tl.toLocaleString('ru-RU') : '';

    // Add notification
    const newNotif: NotificationItem = {
      id: `n-${Date.now()}`,
      title: 'Invoice Payment Completed',
      message: `Successfully paid ${amount} TL for period ${paidInv?.period || ''}.`,
      timestamp: 'Just now',
      type: 'success',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`✓ Payment of ${amount} TL successfully processed!`, 'success');
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
      showToast(`⚠️ Imported ${newInvoices.length} invoices (${breaches} exceed set threshold of ${kwhThreshold} kWh / ${costThreshold} TL)`, 'alert');
    } else {
      showToast(`✓ Successfully imported ${newInvoices.length} invoice statements!`, 'success');
    }

    const newNotif: NotificationItem = {
      id: `n-${Date.now()}`,
      title: 'Batch Invoices Imported',
      message: `${newInvoices.length} new statements were added to database.`,
      timestamp: 'Just now',
      type: breaches > 0 ? 'alert' : 'info',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleAddInvoice = (newInv: Invoice) => {
    setInvoices(prev => [newInv, ...prev]);

    // Check if new invoice breaches threshold
    const isKwhExceeded = newInv.kwh > kwhThreshold;
    const isCostExceeded = newInv.total_amount_tl > costThreshold;

    if (isKwhExceeded || isCostExceeded) {
      const msg = `⚠️ ALERT: New invoice (${newInv.period}) of ${newInv.kwh} kWh (${newInv.total_amount_tl.toLocaleString('ru-RU')} TL) EXCEEDS threshold limit!`;
      showToast(msg, 'alert');

      const alertNotif: NotificationItem = {
        id: `n-${Date.now()}`,
        title: `Consumption Threshold Exceeded: ${newInv.period}`,
        message: `Registered invoice ${newInv.kwh} kWh exceeds configured threshold of ${kwhThreshold} kWh.`,
        timestamp: 'Just now',
        type: 'alert',
        read: false
      };
      setNotifications(prev => [alertNotif, ...prev]);
    } else {
      showToast(`✓ New statement for ${newInv.period} added!`, 'success');

      const newNotif: NotificationItem = {
        id: `n-${Date.now()}`,
        title: 'New Statement Added',
        message: `Statement for period ${newInv.period} (${newInv.total_amount_tl.toLocaleString('ru-RU')} TL) was registered.`,
        timestamp: 'Just now',
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
    <div className="flex min-h-screen bg-[#0c1324] text-[#dce1fb] font-sans">
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
        />

        {/* Global Toast Alert Notification */}
        {toast && (
          <div className="fixed top-20 right-6 sm:right-8 z-50 max-w-md w-full animate-bounce">
            <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${
              toast.type === 'alert'
                ? 'bg-[#f43f5e] text-white border-[#f43f5e]'
                : toast.type === 'warning'
                ? 'bg-[#f59e0b] text-[#002113] border-[#f59e0b] font-bold'
                : toast.type === 'info'
                ? 'bg-[#191f31] text-[#adc6ff] border-[#adc6ff]'
                : 'bg-[#4edea3] text-[#002113] border-[#4edea3] font-bold'
            }`}>
              <div className="shrink-0 mt-0.5">
                {toast.type === 'alert' && <AlertTriangle className="w-5 h-5" />}
                {toast.type === 'warning' && <Bell className="w-5 h-5" />}
                {toast.type === 'info' && <Info className="w-5 h-5" />}
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="flex-1 text-xs font-medium leading-relaxed">
                {toast.message}
              </div>
              <button
                onClick={() => setToast(null)}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors shrink-0"
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
                showToast('✓ Account details updated successfully!', 'success');
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
