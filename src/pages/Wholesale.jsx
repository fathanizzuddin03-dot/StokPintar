import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { formatRupiah, statusColor } from '@/lib/helpers';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Truck, Package } from 'lucide-react';

export default function Wholesale() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingForm, setTrackingForm] = useState({});

  const load = () => {
    db.entities.Transaction.filter({ channel: 'grosir' }, '-created_date', 50).then(setOrders).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleShip = async (order) => {
    const tracking = trackingForm[order.id];
    if (!tracking) return;
    await db.entities.Transaction.update(order.id, { tracking_no: tracking, status: 'shipped' });
    toast({ title: 'Resi disimpan', description: `${order.invoice_no} - ${tracking}` });
    setTrackingForm({ ...trackingForm, [order.id]: '' });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Pesanan Grosir</h1>
        <p className="text-sm text-gray-500 mt-1">Proses pengiriman dan input resi pesanan grosir</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada pesanan grosir</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold">{o.invoice_no}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(o.status)}`}>{o.status}</span>
                  </div>
                  <p className="text-sm text-gray-700">{o.customer_name || 'Customer'} · {formatRupiah(o.total)}</p>
                  {o.tracking_no && <p className="text-xs text-gray-500 mt-1">Resi: {o.tracking_no}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(o.created_date).toLocaleDateString('id-ID')}</p>
                </div>
                {(o.status === 'pending' || o.status === 'processing') && (
                  <div className="flex gap-2 items-center">
                    <input placeholder="No Resi" value={trackingForm[o.id] || ''} onChange={e => setTrackingForm({ ...trackingForm, [o.id]: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-40" />
                    <Button size="sm" onClick={() => handleShip(o)}><Truck className="w-4 h-4 mr-1" /> Kirim</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}