import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { formatRupiah, statusColor } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Search } from 'lucide-react';

export default function Reconciliation() {
  const { toast } = useToast();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ order_id: '', tracking_no: '', shopee_amount: '', warehouse_amount: '', notes: '' });

  const load = () => {
    db.entities.ShopeeReconciliation.list('-created_date', 50).then(setRecords).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const shopee = Number(form.shopee_amount) || 0;
    const warehouse = Number(form.warehouse_amount) || 0;
    const diff = shopee - warehouse;
    await db.entities.ShopeeReconciliation.create({
      ...form,
      shopee_amount: shopee,
      warehouse_amount: warehouse,
      difference: diff,
      status: diff === 0 ? 'matched' : 'mismatched',
    });
    toast({ title: 'Berhasil', description: 'Data rekonsiliasi ditambahkan' });
    setShowForm(false);
    setForm({ order_id: '', tracking_no: '', shopee_amount: '', warehouse_amount: '', notes: '' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Rekonsiliasi Shopee</h1>
          <p className="text-sm text-gray-500 mt-1">Cocokkan data gudang vs pencairan Shopee</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Tambah
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-gray-700">Order ID</label><input value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-gray-700">No Resi</label><input value={form.tracking_no} onChange={e => setForm({ ...form, tracking_no: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-gray-700">Jumlah Shopee</label><input type="number" value={form.shopee_amount} onChange={e => setForm({ ...form, shopee_amount: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-gray-700">Jumlah Gudang</label><input type="number" value={form.warehouse_amount} onChange={e => setForm({ ...form, warehouse_amount: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          </div>
          <div><label className="text-sm font-medium text-gray-700">Catatan</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
          <div className="flex gap-2"><Button onClick={handleSave}>Simpan</Button><Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button></div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada data rekonsiliasi</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Order ID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">No Resi</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Shopee</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Gudang</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Selisih</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
            </tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-xs">{r.order_id}</td>
                  <td className="py-3 px-4">{r.tracking_no || '-'}</td>
                  <td className="py-3 px-4 text-right">{formatRupiah(r.shopee_amount)}</td>
                  <td className="py-3 px-4 text-right">{formatRupiah(r.warehouse_amount)}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${r.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>{formatRupiah(r.difference)}</td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}