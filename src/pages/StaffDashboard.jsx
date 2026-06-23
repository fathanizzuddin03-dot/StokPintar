import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { useAuth } from '@/lib/AuthContext';
import { formatRupiah } from '@/lib/helpers';
import { ShoppingCart, Wallet, Package, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, sub, color, to }) => {
  const content = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
};

export default function StaffDashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [cashflows, setCashflows] = useState([]);
  const [staffStocks, setStaffStocks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      db.entities.Transaction.filter({ staff_id: user.id }, '-created_date', 20),
      db.entities.CashFlow.filter({ staff_id: user.id }, '-created_date', 20),
      db.entities.StaffStock.filter({ staff_id: user.id }),
      db.entities.ApprovalRequest.filter({ requested_by_id: user.id }),
    ]).then(([t, c, s, r]) => {
      setTransactions(t);
      setCashflows(c);
      setStaffStocks(s);
      setRequests(r);
    }).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  const todaySales = transactions.filter(t => t.status !== 'voided').reduce((s, t) => s + (t.total || 0), 0);
  const cashBalance = cashflows.reduce((s, c) => {
    if (c.type === 'sale_cash' || c.type === 'handover_in') return s + c.amount;
    if (c.type === 'deposit' || c.type === 'handover_out' || c.type === 'refund') return s - c.amount;
    return s;
  }, 0);
  const totalItems = staffStocks.reduce((s, ss) => s + (ss.quantity || 0), 0);
  const pendingReqs = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Halo, {user?.full_name || 'Staff'} 👋</h1>
        <p className="text-sm text-gray-500 mt-1">Dashboard penjualan dan stok Anda</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Penjualan" value={formatRupiah(todaySales)} sub={`${transactions.length} transaksi`} color="bg-blue-500" to="/pos-offline" />
        <StatCard icon={Wallet} label="Kas di Tangan" value={formatRupiah(cashBalance)} color="bg-emerald-500" to="/cashflow" />
        <StatCard icon={Package} label="Stok Saya" value={totalItems} sub={`${staffStocks.length} produk`} color="bg-purple-500" to="/opname" />
        <StatCard icon={ClipboardList} label="Request Pending" value={pendingReqs} color="bg-amber-500" to="/my-requests" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">Transaksi Terakhir</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada transaksi</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 8).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.invoice_no || 'No Invoice'}</p>
                  <p className="text-xs text-gray-500">{t.channel} · {t.customer_name || 'Customer'}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatRupiah(t.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}