import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { formatRupiah } from '@/lib/helpers';
import { Package, ArrowDownToLine, ArrowUpFromLine, Send, AlertCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
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

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.entities.Product.list(),
      db.entities.StockMovement.list('-created_date', 20),
    ]).then(([p, m]) => {
      setProducts(p);
      setMovements(m);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  const totalStock = products.reduce((s, p) => s + (p.stock_main || 0), 0);
  const distributed = products.reduce((s, p) => s + (p.stock_distributed || 0), 0);
  const lowStock = products.filter(p => (p.stock_main || 0) < 5).length;
  const todayIn = movements.filter(m => m.type === 'in').reduce((s, m) => s + m.quantity, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan gudang dan stok</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Stok Gudang" value={totalStock} sub={`${products.length} produk`} color="bg-blue-500" />
        <StatCard icon={Send} label="Didistribusikan" value={distributed} sub="Dipegang staff" color="bg-purple-500" />
        <StatCard icon={ArrowDownToLine} label="Barang Masuk" value={todayIn} sub="Terbaru" color="bg-emerald-500" />
        <StatCard icon={AlertCircle} label="Stok Rendah" value={lowStock} sub="< 5 unit" color="bg-red-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">Aktivitas Stok Terbaru</h3>
        {movements.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada aktivitas</p>
        ) : (
          <div className="space-y-2">
            {movements.slice(0, 10).map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.type === 'in' ? 'bg-green-100' : m.type === 'out' ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {m.type === 'in' ? <ArrowDownToLine className="w-4 h-4 text-green-600" /> : m.type === 'out' ? <ArrowUpFromLine className="w-4 h-4 text-red-600" /> : <Send className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.product_name || 'Produk'}</p>
                    <p className="text-xs text-gray-500">{m.type === 'in' ? 'Masuk' : m.type === 'out' ? 'Keluar' : 'Distribusi'} · {m.notes || '-'}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>{m.type === 'in' ? '+' : '-'}{m.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}