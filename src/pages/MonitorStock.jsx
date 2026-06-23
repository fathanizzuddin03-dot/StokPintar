import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Eye, AlertTriangle } from 'lucide-react';

export default function MonitorStock() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [staffStocks, setStaffStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(null);
  const [reqForm, setReqForm] = useState({ new_qty: '', reason: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      db.entities.Product.list(),
      db.entities.StaffStock.list(),
    ]).then(([p, s]) => { setProducts(p); setStaffStocks(s); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleRequestChange = async (product) => {
    await db.entities.ApprovalRequest.create({
      type: 'stock_change',
      title: `Koreksi stok: ${product.name}`,
      description: `Stok saat ini: ${product.stock_main}. Diubah ke: ${reqForm.new_qty}. Alasan: ${reqForm.reason}`,
      amount: Number(reqForm.new_qty) - (product.stock_main || 0),
      reference_id: product.id,
      requested_by_id: user.id,
      requested_by_name: user.full_name,
      data: JSON.stringify({ product_id: product.id, old_qty: product.stock_main, new_qty: Number(reqForm.new_qty) }),
    });
    toast({ title: 'Request dikirim', description: 'Menunggu persetujuan Owner' });
    setShowRequest(null);
    setReqForm({ new_qty: '', reason: '' });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  const staffMap = {};
  staffStocks.forEach(s => {
    if (!staffMap[s.staff_name]) staffMap[s.staff_name] = [];
    staffMap[s.staff_name].push(s);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Pantau Stok</h1>
        <p className="text-sm text-gray-500 mt-1">Lihat stok gudang utama & stok di tangan staff</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-heading font-semibold text-gray-900 mb-4">Gudang Utama</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 font-medium text-gray-500">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Produk</th>
              <th className="text-right py-3 px-3 font-medium text-gray-500">Stok</th>
              <th className="text-center py-3 px-3 font-medium text-gray-500">Aksi</th>
            </tr></thead>
            <tbody>
              {products.map(p => (
                <React.Fragment key={p.id}>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 font-mono text-xs">{p.sku}</td>
                    <td className="py-3 px-3">{p.name}</td>
                    <td className={`py-3 px-3 text-right font-semibold ${(p.stock_main || 0) < 5 ? 'text-red-600' : ''}`}>
                      {p.stock_main || 0}
                      {(p.stock_main || 0) < 5 && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Button size="sm" variant="outline" onClick={() => setShowRequest(showRequest === p.id ? null : p.id)}>Request Change</Button>
                    </td>
                  </tr>
                  {showRequest === p.id && (
                    <tr><td colSpan={4} className="p-3 bg-gray-50">
                      <div className="flex gap-2 items-end">
                        <div><label className="text-xs text-gray-500">Stok Baru</label><input type="number" value={reqForm.new_qty} onChange={e => setReqForm({ ...reqForm, new_qty: e.target.value })} className="block w-24 px-2 py-1 border rounded text-sm" /></div>
                        <div className="flex-1"><label className="text-xs text-gray-500">Alasan</label><input value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} className="block w-full px-2 py-1 border rounded text-sm" /></div>
                        <Button size="sm" onClick={() => handleRequestChange(p)}>Kirim</Button>
                      </div>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Object.keys(staffMap).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-heading font-semibold text-gray-900 mb-4">Stok di Tangan Staff</h3>
          {Object.entries(staffMap).map(([name, items]) => (
            <div key={name} className="mb-4 last:mb-0">
              <p className="text-sm font-medium text-gray-700 mb-2">{name}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {items.map(i => (
                  <div key={i.id} className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium">{i.product_name}</p>
                    <p className="text-lg font-bold">{i.quantity}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}