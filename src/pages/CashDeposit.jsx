import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatRupiah } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { HandCoins } from 'lucide-react';

export default function CashDeposit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount) return;
    setSubmitting(true);
    await base44.entities.ApprovalRequest.create({
      type: 'cash_deposit',
      title: `Setoran tunai ${formatRupiah(Number(amount))}`,
      description: `${user.full_name} ingin menyetor uang tunai. ${notes}`,
      amount: Number(amount),
      requested_by_id: user.id,
      requested_by_name: user.full_name,
    });
    await base44.entities.CashFlow.create({
      type: 'deposit', amount: Number(amount), staff_id: user.id, staff_name: user.full_name,
      notes: notes || 'Setoran tunai', status: 'pending',
    });
    toast({ title: 'Pengajuan setoran dikirim', description: 'Menunggu persetujuan Owner' });
    setAmount('');
    setNotes('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Setor Uang</h1>
        <p className="text-sm text-gray-500 mt-1">Ajukan penyerahan uang tunai ke Owner</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg mx-auto">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
            <HandCoins className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Jumlah Setoran</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Rp 0" className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold text-center" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Catatan</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan..." className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
          </div>
          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!amount || submitting}>
            Ajukan Setoran
          </Button>
        </div>
      </div>
    </div>
  );
}