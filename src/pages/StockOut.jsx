import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowUpFromLine, Plus } from 'lucide-react';

export default function StockOut() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_id: '', quantity: '', notes: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      db.entities.Product.list(),
      db.entities.StockMovement.filter({ type: 'out' }, '-created_date', 30),
    ]).then(([p, m]) => { setProducts(p); setMovements(m); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    const prod = products.find(p => p.id === form.product_id);
    if (!prod || !form.quantity) return;
    const qty = Number(form.quantity);
    if (qty > (prod.stock_main || 0)) { toast({ title: 'Stok tidak cukup', variant: 'destructive' }); return; }
    await db.entities.StockMovement.create({
      product_id: prod.id, product_name: prod.name, type: 'out', quantity: qty,
      from_warehouse: 'main', staff_id: user.id, staff_name: user.full_name, notes: form.notes,
    });
    await db.entities.Product.update(prod.id, { stock_main: (prod.stock_main || 0) - qty });
    await db.entities.AuditLog.create({
      action: 'stock_out', entity_type: 'Product', entity_id: prod.id,
      user_id: user.id, user_name: user.full_name, user_role: user.role,
      details: `Barang keluar: ${prod.name} x${qty}`,
    });
    toast({ title: 'Barang keluar berhasil', description: `${prod.name} -${qty}` });
    setShowForm(false); setForm({ product_id: '', quantity: '', notes: '' });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Barang Keluar</h1>
          <p className="text-sm text-gray-500 mt-1">Catat pengeluaran barang dari gudang utama</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" /> Input Barang Keluar</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Produk</label>
              <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Pilih produk...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (Stok: {p.stock_main || 0})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Jumlah</label>
              <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Catatan</label>
              <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2"><Button onClick={handleSubmit}>Simpan</Button><Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {movements.length === 0 ? (
          <div className="text-center py-16"><ArrowUpFromLine className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Belum ada barang keluar</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {movements.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">{m.product_name}</p>
                  <p className="text-xs text-gray-500">{m.staff_name} · {new Date(m.created_date).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {m.notes || '-'}</p>
                </div>
                <span className="text-lg font-bold text-red-600">-{m.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}