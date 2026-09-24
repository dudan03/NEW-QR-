import React, { useState, useMemo } from 'react';
import { Customer, PaymentSession, SupportedLanguage } from '../types';
import { translations } from '../locales';
import { formatRupeesFromPaise } from '../utils/currency';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';

interface CustomersScreenProps {
  customers: Customer[];
  sessions: PaymentSession[];
  language: SupportedLanguage;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onOpenNewPaymentForCustomer: (customer: Customer) => void;
  onSelectSession: (session: PaymentSession) => void;
}

export const CustomersScreen: React.FC<CustomersScreenProps> = ({
  customers,
  sessions,
  language,
  onSaveCustomer,
  onDeleteCustomer,
  onOpenNewPaymentForCustomer,
  onSelectSession,
}) => {
  const t = translations[language].customers;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({});

  // Compute per-customer metrics
  const customerStatsMap = useMemo(() => {
    const map = new Map<
      string,
      { totalRecorded: number; totalPaid: number; totalPending: number; sessionsCount: number }
    >();

    for (const c of customers) {
      const custSessions = sessions.filter(
        (s) => s.customerId === c.id || (s.customerPhone && s.customerPhone === c.phone)
      );

      let totalRecorded = 0;
      let totalPaid = 0;

      for (const s of custSessions) {
        totalRecorded += s.totalAmountPaise;
        for (const inst of s.installments) {
          if (inst.status === 'MANUALLY_CONFIRMED' || inst.status === 'SUCCESS') {
            totalPaid += inst.amountPaise;
          }
        }
      }

      map.set(c.id, {
        totalRecorded,
        totalPaid,
        totalPending: Math.max(0, totalRecorded - totalPaid),
        sessionsCount: custSessions.length,
      });
    }

    return map;
  }, [customers, sessions]);

  // Filtered list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCustomer({ ...customer });
    setIsEditModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer.name?.trim() || !editingCustomer.phone?.trim()) return;

    const saved = {
      id: editingCustomer.id || `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: editingCustomer.name.trim(),
      phone: editingCustomer.phone.trim(),
      email: editingCustomer.email?.trim() || '',
      address: editingCustomer.address?.trim() || '',
      notes: editingCustomer.notes?.trim() || '',
      createdAt: editingCustomer.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveCustomer(saved);
    if (selectedCustomer && selectedCustomer.id === saved.id) {
      setSelectedCustomer(saved);
    }
    setIsEditModalOpen(false);
  };

  // Selected customer sessions
  const activeCustomerSessions = useMemo(() => {
    if (!selectedCustomer) return [];
    return sessions.filter(
      (s) =>
        s.customerId === selectedCustomer.id ||
        (s.customerPhone && s.customerPhone === selectedCustomer.phone)
    );
  }, [selectedCustomer, sessions]);

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {customers.length} customer records registered
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNew}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Customer List + Detail View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Customer List */}
        <div className={`space-y-2.5 ${selectedCustomer ? 'md:col-span-5' : 'md:col-span-12'}`}>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t.emptyTitle}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">{t.emptyDesc}</p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
              >
                {t.addNew}
              </button>
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const stats = customerStatsMap.get(customer.id) || {
                totalRecorded: 0,
                totalPaid: 0,
                totalPending: 0,
                sessionsCount: 0,
              };
              const isSelected = selectedCustomer?.id === customer.id;

              return (
                <div
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{customer.name}</span>
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{customer.phone}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatRupeesFromPaise(stats.totalRecorded)}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-medium">
                        {formatRupeesFromPaise(stats.totalPaid)} paid
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{stats.sessionsCount} sessions</span>
                    {stats.totalPending > 0 && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        ₹{(stats.totalPending / 100).toFixed(0)} pending
                      </span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Customer Detail View */}
        {selectedCustomer && (
          <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Customer Overview
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedCustomer.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {selectedCustomer.phone}
                  </span>
                  {selectedCustomer.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {selectedCustomer.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedCustomer)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  title="Edit Customer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete customer ${selectedCustomer.name}? Existing sessions will remain.`)) {
                      onDeleteCustomer(selectedCustomer.id);
                      setSelectedCustomer(null);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600"
                  title="Delete Customer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Metrics cards for customer */}
            {(() => {
              const stats = customerStatsMap.get(selectedCustomer.id) || {
                totalRecorded: 0,
                totalPaid: 0,
                totalPending: 0,
                sessionsCount: 0,
              };

              return (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Total Recorded</span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {formatRupeesFromPaise(stats.totalRecorded)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Confirmed Paid</span>
                    <p className="text-sm font-extrabold text-emerald-600">
                      {formatRupeesFromPaise(stats.totalPaid)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-medium">Pending Balance</span>
                    <p className="text-sm font-extrabold text-amber-600">
                      {formatRupeesFromPaise(stats.totalPending)}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Customer address & notes */}
            {(selectedCustomer.address || selectedCustomer.notes) && (
              <div className="text-xs space-y-1 bg-slate-50/50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedCustomer.address && (
                  <p className="text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedCustomer.address}</span>
                  </p>
                )}
                {selectedCustomer.notes && (
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    "{selectedCustomer.notes}"
                  </p>
                )}
              </div>
            )}

            {/* Quick Action: New Payment */}
            <button
              type="button"
              onClick={() => onOpenNewPaymentForCustomer(selectedCustomer)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t.newPaymentForCustomer}</span>
            </button>

            {/* Customer Session History */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Payment Sessions ({activeCustomerSessions.length})
              </h4>

              {activeCustomerSessions.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No payment sessions recorded for this customer yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {activeCustomerSessions.map((sess) => (
                    <div
                      key={sess.id}
                      onClick={() => onSelectSession(sess)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{sess.id}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(sess.createdAt).toLocaleDateString()} • {sess.installments.length} installments
                        </p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {formatRupeesFromPaise(sess.totalAmountPaise)}
                          </p>
                          <span className="text-[10px] font-semibold text-blue-600">
                            {sess.status}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveModal}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 relative"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingCustomer.id ? t.editCustomer : t.addNew}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.name} *
              </label>
              <input
                type="text"
                required
                value={editingCustomer.name || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                placeholder="e.g. Rahul Kumar"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.phone} *
              </label>
              <input
                type="tel"
                required
                value={editingCustomer.phone || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.email}
              </label>
              <input
                type="email"
                value={editingCustomer.email || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                placeholder="customer@example.com"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.address}
              </label>
              <input
                type="text"
                value={editingCustomer.address || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                placeholder="Locality, City, State"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.notes}
              </label>
              <textarea
                rows={2}
                value={editingCustomer.notes || ''}
                onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                placeholder="Purchase preferences or agreement terms..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
              >
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
