import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { BoxSelect, AlertTriangle } from 'lucide-react';

export default function Opname() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staffStocks, setStaffStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ actual: '', reason: '' });

  const load = () => {
    if (!user) return;
    db.entities.StaffStock.filter({ staff_id: user.id }).then(setStaffStocks).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [user]);

  const handleReport = async (ss) => {
    const actual = Number(form.actual);
    const diff = actual - ss.quantity;
    if (diff === 0) { toast({ title: 'Tidak ada selisih' }); return; }

    await db.entities.ApprovalRequest.create({
      type: 'stock_change',
      title: `Selisih stok: ${ss.product_name}`,
      description: `Sistem: ${ss.quantity}, Aktual: ${actual}, Selisih: ${diff}. Alasan: ${form.reason}`,
      amount: diff,
      reference_id: ss.id,
      requested_by_id: user.id,
      requested_by_name: user.full_name,
      data: JSON.stringify({ staff_stock_id: ss.id, system_qty: ss.quantity, actual_qty: actual }),
    });

    toast({ title: 'Laporan opname dikirim', description: 'Menunggu persetujuan Owner' });
    setEditId(null);
    setForm({ actual: '', reason: '' });
  };

  const handleDefect = async (ss) => {
    await db.entities.ApprovalRequest.create({
      type: 'stock_change',
      title: `Barang cacat: ${ss.product_name}`,
      description: `${form.actual} unit cacat. Alasan: ${form.reason}`,
      amount: -Number(form.actual),
      reference_id: ss.id,
      requested_by_id: user.id,
      requested_by_name: user.full_name,
      data: JSON.stringify({ staff_stock_id: ss.id, defect_qty: Number(form.actual), type: 'defect' }),
    });

    toast({ title: 'Laporan cacat dikirim' });
    setEditId(null);
    setForm({ actual: '', reason: '' });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Opname & Lapor Cacat</h1>
        <p className="text-sm text-gray-500 mt-1">Cek stok fisik dan laporkan barang cacat</p>
      </div>

      {staffStocks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BoxSelect className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada stok yang dipegang</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staffStocks.map(ss => (
            <div key={ss.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{ss.product_name}</p>
                  <p className="text-xs text-gray-500">SKU: {ss.sku} · Stok Sistem: <span className="font-semibold">{ss.quantity}</span></p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditId(editId === ss.id ? null : ss.id); setForm({ actual: '', reason: '' }); }}>
                    <BoxSelect className="w-3 h-3 mr-1" /> Opname
                  </Button>
                  <Button size="sm" variant="outline" className="text-orange-600 border-orange-200" onClick={() => { setEditId(editId === `def-${ss.id}` ? null : `def-${ss.id}`); setForm({ actual: '', reason: '' }); }}>
                    <AlertTriangle className="w-3 h-3 mr-1" /> Cacat
                  </Button>
                </div>
              </div>
              {editId === ss.id && (
                <div className="mt-3 flex gap-2 items-end">
                  <div><label className="text-xs text-gray-500">Stok Aktual</label><input type="number" value={form.actual} onChange={e => setForm({ ...form, actual: e.target.value })} className="block w-24 px-2 py-1 border rounded text-sm" /></div>
                  <div className="flex-1"><label className="text-xs text-gray-500">Alasan</label><input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="block w-full px-2 py-1 border rounded text-sm" /></div>
                  <Button size="sm" onClick={() => handleReport(ss)}>Kirim</Button>
                </div>
              )}
              {editId === `def-${ss.id}` && (
                <div className="mt-3 flex gap-2 items-end">
                  <div><label className="text-xs text-gray-500">Jumlah Cacat</label><input type="number" value={form.actual} onChange={e => setForm({ ...form, actual: e.target.value })} className="block w-24 px-2 py-1 border rounded text-sm" /></div>
                  <div className="flex-1"><label className="text-xs text-gray-500">Keterangan</label><input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="block w-full px-2 py-1 border rounded text-sm" /></div>
                  <Button size="sm" onClick={() => handleDefect(ss)}>Laporkan</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}