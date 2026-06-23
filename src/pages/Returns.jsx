import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { useAuth } from '@/lib/AuthContext';
import { formatRupiah, statusColor } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Undo2 } from 'lucide-react';

export default function Returns() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!user) return;
    db.entities.Transaction.filter({ staff_id: user.id, status: 'completed' }, '-created_date', 30).then(setTransactions).finally(() => setLoading(false));
  }, [user]);

  const handleReturn = async (txn) => {
    await db.entities.Transaction.update(txn.id, { status: 'returned', notes: reason });
    if (txn.payment_method === 'cash') {
      await db.entities.CashFlow.create({
        type: 'refund', amount: txn.total, staff_id: user.id, staff_name: user.full_name,
        reference_id: txn.invoice_no, notes: `Retur: ${reason}`,
      });
    }
    toast({ title: 'Retur diproses', description: txn.invoice_no });
    setSelectedId(null);
    setReason('');
    db.entities.Transaction.filter({ staff_id: user.id, status: 'completed' }, '-created_date', 30).then(setTransactions);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Retur & Refund</h1>
        <p className="text-sm text-gray-500 mt-1">Proses pengembalian barang</p>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Undo2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada transaksi yang bisa di-retur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold">{t.invoice_no}</p>
                  <p className="text-sm text-gray-500">{t.customer_name || '-'} · {formatRupiah(t.total)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedId(selectedId === t.id ? null : t.id)} className="text-orange-600 border-orange-200">
                  <Undo2 className="w-4 h-4 mr-1" /> Retur
                </Button>
              </div>
              {selectedId === t.id && (
                <div className="mt-3 flex gap-2">
                  <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Alasan retur..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <Button size="sm" onClick={() => handleReturn(t)}>Proses Retur</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}