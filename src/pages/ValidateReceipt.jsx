import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { formatRupiah, statusColor } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ValidateReceipt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    base44.entities.CashFlow.filter({ staff_id: user.id, type: 'handover_in', status: 'pending' }).then(setPending).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [user]);

  const handleConfirm = async (cf) => {
    await base44.entities.CashFlow.update(cf.id, { status: 'confirmed' });
    // Also confirm the outgoing side
    const outgoing = await base44.entities.CashFlow.filter({ counterpart_id: user.id, type: 'handover_out', status: 'pending' });
    const match = outgoing.find(o => o.amount === cf.amount && o.staff_id === cf.counterpart_id);
    if (match) await base44.entities.CashFlow.update(match.id, { status: 'confirmed' });
    toast({ title: 'Penerimaan dikonfirmasi' });
    load();
  };

  const handleReject = async (cf) => {
    await base44.entities.CashFlow.update(cf.id, { status: 'rejected' });
    toast({ title: 'Penerimaan ditolak' });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Validasi Penerimaan</h1>
        <p className="text-sm text-gray-500 mt-1">Konfirmasi uang yang diterima dari staf lain</p>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada penerimaan yang perlu divalidasi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(cf => (
            <div key={cf.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">Dari: <span className="font-medium text-gray-900">{cf.counterpart_name}</span></p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatRupiah(cf.amount)}</p>
                  <p className="text-xs text-gray-400 mt-1">{cf.notes}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleConfirm(cf)} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle className="w-4 h-4 mr-1" /> Konfirmasi
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(cf)} className="text-red-600 border-red-200">
                    <XCircle className="w-4 h-4 mr-1" /> Tolak
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}