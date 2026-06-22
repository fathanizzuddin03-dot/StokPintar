import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { PackageSearch } from 'lucide-react';

export default function ReceiveGoods() {
  const { user } = useAuth();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.StockMovement.filter({ to_warehouse: user.id, type: 'distribute' }, '-created_date', 30).then(setMovements).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Penerimaan Barang</h1>
        <p className="text-sm text-gray-500 mt-1">Riwayat barang yang Anda terima dari gudang</p>
      </div>

      {movements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada penerimaan barang</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="divide-y divide-gray-100">
            {movements.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">{m.product_name}</p>
                  <p className="text-xs text-gray-500">{new Date(m.created_date).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {m.notes || '-'}</p>
                </div>
                <span className="text-lg font-bold text-green-600">+{m.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}