import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { useAuth } from '@/lib/AuthContext';
import { formatRupiah, statusColor } from '@/lib/helpers';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

export default function CashFlowPage() {
  const { user } = useAuth();
  const [cashflows, setCashflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    db.entities.CashFlow.filter({ staff_id: user.id }, '-created_date', 50).then(setCashflows).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  const balance = cashflows.reduce((s, c) => {
    if (c.type === 'sale_cash' || c.type === 'handover_in') return s + c.amount;
    if (c.type === 'deposit' || c.type === 'handover_out' || c.type === 'refund') return s - c.amount;
    return s;
  }, 0);

  const typeLabel = (t) => ({
    sale_cash: 'Penjualan Tunai',
    deposit: 'Setor ke Owner',
    handover_out: 'Serah Terima (Keluar)',
    handover_in: 'Serah Terima (Masuk)',
    refund: 'Refund',
    expense: 'Pengeluaran',
  }[t] || t);

  const isIncome = (t) => t === 'sale_cash' || t === 'handover_in';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Arus Kas Pribadi</h1>
        <p className="text-sm text-gray-500 mt-1">Uang tunai di tangan Anda</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
        <p className="text-sm opacity-80">Saldo Kas di Tangan</p>
        <p className="text-3xl font-bold mt-1">{formatRupiah(balance)}</p>
      </div>

      {cashflows.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada arus kas</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="divide-y divide-gray-100">
            {cashflows.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isIncome(c.type) ? 'bg-green-100' : 'bg-red-100'}`}>
                    {isIncome(c.type) ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{typeLabel(c.type)}</p>
                    <p className="text-xs text-gray-500">{new Date(c.created_date).toLocaleDateString('id-ID')} · {c.notes || '-'}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${isIncome(c.type) ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncome(c.type) ? '+' : '-'}{formatRupiah(c.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}