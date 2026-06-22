import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatRupiah } from '@/lib/helpers';
import { Package, TrendingUp, AlertTriangle, Banknote, ShoppingCart } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import moment from 'moment';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function OwnerDashboard() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cashflows, setCashflows] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list(),
      base44.entities.Transaction.list('-created_date', 200),
      base44.entities.CashFlow.list('-created_date', 50),
      base44.entities.ApprovalRequest.filter({ status: 'pending' }),
    ]).then(([p, t, c, a]) => {
      setProducts(p);
      setTransactions(t);
      setCashflows(c);
      setApprovals(a);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  const validTx = transactions.filter(t => t.status !== 'voided');
  const totalAsset = products.reduce((s, p) => s + (p.hpp * ((p.stock_main || 0) + (p.stock_distributed || 0))), 0);
  const totalSales = validTx.reduce((s, t) => s + (t.total || 0), 0);
  const grossProfit = validTx.reduce((s, t) => s + (t.profit || 0), 0);
  const cashOnHand = cashflows.reduce((s, c) => {
    if (c.type === 'sale_cash' || c.type === 'handover_in') return s + c.amount;
    if (c.type === 'deposit' || c.type === 'handover_out' || c.type === 'refund') return s - c.amount;
    return s;
  }, 0);

  // Channel pie data
  const channelSales = {};
  validTx.forEach(t => {
    channelSales[t.channel] = (channelSales[t.channel] || 0) + (t.total || 0);
  });
  const channelData = Object.entries(channelSales).map(([ch, val]) => ({
    name: { offline: 'Offline', whatsapp: 'WA', shopee: 'Shopee', grosir: 'Grosir', tokopedia: 'Tokopedia', lazada: 'Lazada', tiktok: 'TikTok' }[ch] || ch,
    value: val,
  }));

  // Daily sales trend - last 14 days
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const day = moment().subtract(13 - i, 'days');
    const dayTx = validTx.filter(t => moment(t.created_date).isSame(day, 'day'));
    return {
      date: day.format('DD/MM'),
      penjualan: dayTx.reduce((s, t) => s + (t.total || 0), 0),
      laba: dayTx.reduce((s, t) => s + (t.profit || 0), 0),
    };
  });

  // Monthly gross profit - last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const month = moment().subtract(5 - i, 'months');
    const monthTx = validTx.filter(t => moment(t.created_date).isSame(month, 'month'));
    return {
      bulan: month.format('MMM'),
      laba: monthTx.reduce((s, t) => s + (t.profit || 0), 0),
      penjualan: monthTx.reduce((s, t) => s + (t.total || 0), 0),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Dashboard Eksekutif</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan bisnis secara keseluruhan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Package} label="Nilai Aset" value={formatRupiah(totalAsset)} sub={`${products.length} produk`} color="bg-blue-500" />
        <StatCard icon={ShoppingCart} label="Total Penjualan" value={formatRupiah(totalSales)} sub={`${transactions.length} transaksi`} color="bg-emerald-500" />
        <StatCard icon={TrendingUp} label="Laba Kotor" value={formatRupiah(grossProfit)} color="bg-purple-500" />
        <StatCard icon={Banknote} label="Uang di Tangan Staff" value={formatRupiah(cashOnHand)} color="bg-amber-500" />
        <StatCard icon={AlertTriangle} label="Pending Approval" value={approvals.length} sub="Menunggu persetujuan" color="bg-red-500" />
      </div>

      {/* Daily Sales Trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">Tren Penjualan Harian (14 Hari Terakhir)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={last14} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
            <Tooltip formatter={(v) => formatRupiah(v)} />
            <Legend />
            <Line type="monotone" dataKey="penjualan" stroke="#3b82f6" strokeWidth={2} dot={false} name="Penjualan" />
            <Line type="monotone" dataKey="laba" stroke="#10b981" strokeWidth={2} dot={false} name="Laba" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Gross Profit */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">Perbandingan Laba Kotor Bulanan (6 Bulan)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={last6Months} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}jt` : v >= 1000 ? `${(v/1000).toFixed(0)}rb` : v} />
            <Tooltip formatter={(v) => formatRupiah(v)} />
            <Legend />
            <Bar dataKey="penjualan" fill="#3b82f6" name="Penjualan" radius={[4, 4, 0, 0]} />
            <Bar dataKey="laba" fill="#8b5cf6" name="Laba Kotor" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-heading font-semibold text-gray-900 mb-4">Penjualan per Channel</h3>
          {channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatRupiah(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-12">Belum ada data penjualan</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-heading font-semibold text-gray-900 mb-4">Approval Pending</h3>
          {approvals.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-12">Tidak ada approval menunggu</p>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto">
              {approvals.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.requested_by_name} · {a.type}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Pending</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}