import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { formatRupiah } from '@/lib/helpers';
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

const tabs = ['History Barang Masuk', 'History Barang Keluar', 'Cashflow Grosir'];

export default function WarehouseReports() {
  const [tab, setTab] = useState(0);
  const [movements, setMovements] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      db.entities.StockMovement.list('-created_date', 50),
      db.entities.Transaction.filter({ channel: 'grosir' }, '-created_date', 50),
    ]).then(([m, t]) => { setMovements(m); setTransactions(t); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  const stockIn = movements.filter(m => m.type === 'in');
  const stockOut = movements.filter(m => m.type === 'out');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Laporan Gudang</h1>
        <p className="text-sm text-gray-500 mt-1">History barang masuk, keluar, dan grosir</p>
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
        {tab === 0 && (
          stockIn.length === 0 ? <p className="text-gray-400 text-center py-8">Tidak ada data</p> : (
            <div className="divide-y divide-gray-100">
              {stockIn.map(m => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div><p className="font-medium">{m.product_name}</p><p className="text-xs text-gray-500">{m.staff_name} · {new Date(m.created_date).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                  <span className="font-bold text-green-600">+{m.quantity}</span>
                </div>
              ))}
            </div>
          )
        )}
        {tab === 1 && (
          stockOut.length === 0 ? <p className="text-gray-400 text-center py-8">Tidak ada data</p> : (
            <div className="divide-y divide-gray-100">
              {stockOut.map(m => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div><p className="font-medium">{m.product_name}</p><p className="text-xs text-gray-500">{m.staff_name} · {new Date(m.created_date).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                  <span className="font-bold text-red-600">-{m.quantity}</span>
                </div>
              ))}
            </div>
          )
        )}
        {tab === 2 && (
          transactions.length === 0 ? <p className="text-gray-400 text-center py-8">Tidak ada data</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Invoice</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Customer</th>
                  <th className="text-right py-3 px-3 font-medium text-gray-500">Total</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-3 font-medium text-gray-500">Tanggal</th>
                </tr></thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} className="border-b border-gray-100">
                      <td className="py-3 px-3 font-mono text-xs">{t.invoice_no}</td>
                      <td className="py-3 px-3">{t.customer_name || '-'}</td>
                      <td className="py-3 px-3 text-right font-semibold">{formatRupiah(t.total)}</td>
                      <td className="py-3 px-3">{t.status}</td>
                      <td className="py-3 px-3 text-xs text-gray-500">{new Date(t.created_date).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}