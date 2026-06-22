import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Send, Plus } from 'lucide-react';

export default function Distribute() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_id: '', staff_id: '', quantity: '', notes: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Product.list(),
      base44.entities.User.filter({ role: 'staff' }),
      base44.entities.StockMovement.filter({ type: 'distribute' }, '-created_date', 30),
    ]).then(([p, s, m]) => { setProducts(p); setStaffList(s); setMovements(m); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    const prod = products.find(p => p.id === form.product_id);
    const staff = staffList.find(s => s.id === form.staff_id);
    if (!prod || !staff || !form.quantity) return;
    const qty = Number(form.quantity);
    if (qty > (prod.stock_main || 0)) { toast({ title: 'Stok gudang tidak cukup', variant: 'destructive' }); return; }

    await base44.entities.StockMovement.create({
      product_id: prod.id, product_name: prod.name, type: 'distribute', quantity: qty,
      from_warehouse: 'main', to_warehouse: staff.id, staff_id: staff.id, staff_name: staff.full_name,
      notes: form.notes,
    });
    await base44.entities.Product.update(prod.id, {
      stock_main: (prod.stock_main || 0) - qty,
      stock_distributed: (prod.stock_distributed || 0) + qty,
    });

    const existing = await base44.entities.StaffStock.filter({ staff_id: staff.id, product_id: prod.id });
    if (existing.length > 0) {
      await base44.entities.StaffStock.update(existing[0].id, { quantity: (existing[0].quantity || 0) + qty });
    } else {
      await base44.entities.StaffStock.create({
        staff_id: staff.id, staff_name: staff.full_name,
        product_id: prod.id, product_name: prod.name, sku: prod.sku, quantity: qty,
      });
    }

    toast({ title: 'Distribusi berhasil', description: `${prod.name} x${qty} → ${staff.full_name}` });
    setShowForm(false); setForm({ product_id: '', staff_id: '', quantity: '', notes: '' });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Distribusi Barang</h1>
          <p className="text-sm text-gray-500 mt-1">Lempar barang dari gudang utama ke staff</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" /> Distribusi Baru</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Produk</label>
              <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Pilih produk...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (Stok: {p.stock_main || 0})</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Staff Tujuan</label>
              <select value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Pilih staff...</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
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
          <div className="flex gap-2"><Button onClick={handleSubmit}>Distribusikan</Button><Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {movements.length === 0 ? (
          <div className="text-center py-16"><Send className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Belum ada distribusi</p></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {movements.map(m => (
              <div key={m.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">{m.product_name}</p>
                  <p className="text-xs text-gray-500">→ {m.staff_name} · {new Date(m.created_date).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}{m.notes ? ` · ${m.notes}` : ''}</p>
                </div>
                <span className="text-lg font-bold text-blue-600">{m.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}