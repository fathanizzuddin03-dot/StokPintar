import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatRupiah, channelLabel, statusColor } from '@/lib/helpers';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const tabs = [
  'Stok Gudang', 'Nilai Aset', 'Penjualan per Channel', 'Laba Kotor', 'Arus Kas', 'Serah Terima Uang', 'Audit Log'
];

export default function Reports() {
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cashflows, setCashflows] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Product.list(),
      base44.entities.Transaction.list('-created_date', 50),
      base44.entities.CashFlow.list('-created_date', 50),
      base44.entities.AuditLog.list('-created_date', 50),
    ]).then(([p, t, c, a]) => {
      setProducts(p);
      setTransactions(t);
      setCashflows(c);
      setAudits(a);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  const renderStok = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">
          <th className="text-left py-3 px-3 font-medium text-gray-500">SKU</th>
          <th className="text-left py-3 px-3 font-medium text-gray-500">Produk</th>
          <th className="text-right py-3 px-3 font-medium text-gray-500">Stok Gudang</th>
          <th className="text-right py-3 px-3 font-medium text-gray-500">Didistribusikan</th>
          <th className="text-right py-3 px-3 font-medium text-gray-500">Total</th>
        </tr></thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-3 font-mono text-xs">{p.sku}</td>
              <td className="py-3 px-3">{p.name} {p.variant ? `- ${p.variant}` : ''}</td>
              <td className="py-3 px-3 text-right font-semibold">{p.stock_main || 0}</td>
              <td className="py-3 px-3 text-right">{p.stock_distributed || 0}</td>
              <td className="py-3 px-3 text-right font-semibold">{(p.stock_main || 0) + (p.stock_distributed || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAset = () => {
    const total = products.reduce((s, p) => s + p.hpp * ((p.stock_main || 0) + (p.stock_distributed || 0)), 0);
    return (
      <div>
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-600">Total Nilai Aset</p>
          <p className="text-3xl font-bold text-blue-900">{formatRupiah(total)}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 font-medium text-gray-500">Produk</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500">HPP</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500">Stok</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500">Nilai</th>
            </tr></thead>
            <tbody>
              {products.map(p => {
                const stk = (p.stock_main || 0) + (p.stock_distributed || 0);
                return (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-3 px-3">{p.name}</td>
                    <td className="py-3 px-3 text-right">{formatRupiah(p.hpp)}</td>
                    <td className="py-3 px-3 text-right">{stk}</td>
                    <td className="py-3 px-3 text-right font-semibold">{formatRupiah(p.hpp * stk)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderChannel = () => {
    const data = {};
    transactions.filter(t => t.status !== 'voided').forEach(t => {
      data[t.channel] = (data[t.channel] || 0) + (t.total || 0);
    });
    const chartData = Object.entries(data).map(([k, v]) => ({ name: channelLabel(k), total: v }));
    return (
      <div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => formatRupiah(v)} />
            <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLaba = () => {
    const totalSales = transactions.filter(t => t.status !== 'voided').reduce((s, t) => s + (t.total || 0), 0);
    const totalHpp = transactions.filter(t => t.status !== 'voided').reduce((s, t) => s + (t.hpp_total || 0), 0);
    const profit = totalSales - totalHpp;
    return (
      <div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4"><p className="text-xs text-blue-600">Total Penjualan</p><p className="text-xl font-bold text-blue-900">{formatRupiah(totalSales)}</p></div>
          <div className="bg-red-50 rounded-lg p-4"><p className="text-xs text-red-600">Total HPP</p><p className="text-xl font-bold text-red-900">{formatRupiah(totalHpp)}</p></div>
          <div className="bg-green-50 rounded-lg p-4"><p className="text-xs text-green-600">Laba Kotor</p><p className="text-xl font-bold text-green-900">{formatRupiah(profit)}</p></div>
        </div>
      </div>
    );
  };

  const renderArusKas = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200">
          <th className="text-left py-3 px-3 font-medium text-gray-500">Tanggal</th>
          <th className="text-left py-3 px-3 font-medium text-gray-500">Tipe</th>
          <th className="text-left py-3 px-3 font-medium text-gray-500">Staff</th>
          <th className="text-right py-3 px-3 font-medium text-gray-500">Jumlah</th>
          <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
        </tr></thead>
        <tbody>
          {cashflows.map(c => (
            <tr key={c.id} className="border-b border-gray-100">
              <td className="py-3 px-3 text-xs">{new Date(c.created_date).toLocaleDateString('id-ID')}</td>
              <td className="py-3 px-3">{c.type}</td>
              <td className="py-3 px-3">{c.staff_name || '-'}</td>
              <td className="py-3 px-3 text-right font-semibold">{formatRupiah(c.amount)}</td>
              <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(c.status)}`}>{c.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSerahTerima = () => {
    const handovers = cashflows.filter(c => c.type === 'handover_out' || c.type === 'handover_in');
    return (
      <div className="overflow-x-auto">
        {handovers.length === 0 ? <p className="text-center text-gray-400 py-8">Belum ada data serah terima</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 font-medium text-gray-500">Tanggal</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Dari</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Ke</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500">Jumlah</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
            </tr></thead>
            <tbody>
              {handovers.map(h => (
                <tr key={h.id} className="border-b border-gray-100">
                  <td className="py-3 px-3 text-xs">{new Date(h.created_date).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 px-3">{h.staff_name || '-'}</td>
                  <td className="py-3 px-3">{h.counterpart_name || '-'}</td>
                  <td className="py-3 px-3 text-right font-semibold">{formatRupiah(h.amount)}</td>
                  <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(h.status)}`}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const renderAudit = () => (
    <div className="overflow-x-auto">
      {audits.length === 0 ? <p className="text-center text-gray-400 py-8">Belum ada log</p> : (
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200">
            <th className="text-left py-3 px-3 font-medium text-gray-500">Waktu</th>
            <th className="text-left py-3 px-3 font-medium text-gray-500">User</th>
            <th className="text-left py-3 px-3 font-medium text-gray-500">Aksi</th>
            <th className="text-left py-3 px-3 font-medium text-gray-500">Detail</th>
          </tr></thead>
          <tbody>
            {audits.map(a => (
              <tr key={a.id} className="border-b border-gray-100">
                <td className="py-3 px-3 text-xs whitespace-nowrap">{new Date(a.created_date).toLocaleString('id-ID')}</td>
                <td className="py-3 px-3">{a.user_name} <span className="text-xs text-gray-400">({a.user_role})</span></td>
                <td className="py-3 px-3 font-mono text-xs">{a.action}</td>
                <td className="py-3 px-3 text-xs text-gray-500 max-w-xs truncate">{a.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const panels = [renderStok, renderAset, renderChannel, renderLaba, renderArusKas, renderSerahTerima, renderAudit];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Pusat Laporan</h1>
        <p className="text-sm text-gray-500 mt-1">Semua laporan bisnis dalam satu tempat</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === i ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {panels[tab]()}
      </div>
    </div>
  );
}