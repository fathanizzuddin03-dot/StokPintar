import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { useAuth } from '@/lib/AuthContext';
import { formatRupiah } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeftRight } from 'lucide-react';

export default function CashHandover() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ staff_id: '', amount: '', notes: '' });

  useEffect(() => {
    db.entities.User.filter({ role: 'staff' }).then(list => {
      setStaffList(list.filter(s => s.id !== user?.id));
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async () => {
    const target = staffList.find(s => s.id === form.staff_id);
    if (!target || !form.amount) return;
    const amt = Number(form.amount);

    // Record outgoing for current user
    await db.entities.CashFlow.create({
      type: 'handover_out', amount: amt, staff_id: user.id, staff_name: user.full_name,
      counterpart_id: target.id, counterpart_name: target.full_name,
      notes: form.notes || `Serah terima ke ${target.full_name}`, status: 'pending',
    });

    // Record incoming for target (pending validation)
    await db.entities.CashFlow.create({
      type: 'handover_in', amount: amt, staff_id: target.id, staff_name: target.full_name,
      counterpart_id: user.id, counterpart_name: user.full_name,
      notes: form.notes || `Terima dari ${user.full_name}`, status: 'pending',
    });

    toast({ title: 'Serah terima diajukan', description: `${formatRupiah(amt)} → ${target.full_name}` });
    setForm({ staff_id: '', amount: '', notes: '' });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Serah Terima Uang</h1>
        <p className="text-sm text-gray-500 mt-1">Titipkan uang kasir ke staf lain (oper shift)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg mx-auto">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
            <ArrowLeftRight className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Staff Tujuan</label>
            <select value={form.staff_id} onChange={e => setForm({ ...form, staff_id: e.target.value })} className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm">
              <option value="">Pilih staff...</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Jumlah</label>
            <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Rp 0" className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold text-center" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Catatan</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Catatan..." className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
          </div>
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!form.staff_id || !form.amount}>
            Kirim Uang
          </Button>
        </div>
      </div>
    </div>
  );
}