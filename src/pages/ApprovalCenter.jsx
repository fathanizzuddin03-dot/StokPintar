import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { statusColor } from '@/lib/helpers';
import { formatRupiah } from '@/lib/helpers';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function ApprovalCenter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = () => {
    setLoading(true);
    const query = filter === 'all' ? {} : { status: filter };
    base44.entities.ApprovalRequest.filter(query, '-created_date', 50).then(setRequests).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (req) => {
    await base44.entities.ApprovalRequest.update(req.id, {
      status: 'approved',
      approved_by_id: user.id,
      approved_by_name: user.full_name,
      approved_date: new Date().toISOString(),
    });
    await base44.entities.AuditLog.create({
      action: 'approve_request',
      entity_type: 'ApprovalRequest',
      entity_id: req.id,
      user_id: user.id,
      user_name: user.full_name,
      user_role: user.role,
      details: `Approved: ${req.title}`,
    });
    toast({ title: 'Disetujui', description: req.title });
    load();
  };

  const handleReject = async (req) => {
    await base44.entities.ApprovalRequest.update(req.id, {
      status: 'rejected',
      approved_by_id: user.id,
      approved_by_name: user.full_name,
      approved_date: new Date().toISOString(),
      reject_reason: rejectReason,
    });
    await base44.entities.AuditLog.create({
      action: 'reject_request',
      entity_type: 'ApprovalRequest',
      entity_id: req.id,
      user_id: user.id,
      user_name: user.full_name,
      user_role: user.role,
      details: `Rejected: ${req.title} - ${rejectReason}`,
    });
    toast({ title: 'Ditolak', description: req.title });
    setRejectId(null);
    setRejectReason('');
    load();
  };

  const typeLabel = (t) => ({
    cash_deposit: '💰 Setoran Tunai',
    bank_transfer: '🏦 Mutasi Transfer',
    wholesale_order: '📦 Pesanan Grosir',
    void_transaction: '🗑️ Void Transaksi',
    edit_shipping: '✏️ Edit Ongkir',
    stock_change: '📊 Selisih Stok',
  }[t] || t);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Approval Center</h1>
        <p className="text-sm text-gray-500 mt-1">Setujui atau tolak permintaan dari tim</p>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {f === 'all' ? 'Semua' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Tidak ada permintaan {filter !== 'all' ? filter : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{typeLabel(req.type)}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(req.status)}`}>{req.status}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{req.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{req.description}</p>
                  {req.amount > 0 && <p className="text-sm font-medium text-gray-900 mt-1">Jumlah: {formatRupiah(req.amount)}</p>}
                  <p className="text-xs text-gray-400 mt-2">Oleh: {req.requested_by_name} · {new Date(req.created_date).toLocaleDateString('id-ID')}</p>
                  {req.reject_reason && <p className="text-xs text-red-500 mt-1">Alasan tolak: {req.reject_reason}</p>}
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleApprove(req)} className="bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle className="w-4 h-4 mr-1" /> Setujui
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectId(rejectId === req.id ? null : req.id)} className="text-red-600 border-red-200 hover:bg-red-50">
                      <XCircle className="w-4 h-4 mr-1" /> Tolak
                    </Button>
                  </div>
                )}
              </div>
              {rejectId === req.id && (
                <div className="mt-3 flex gap-2">
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Alasan penolakan..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <Button size="sm" variant="destructive" onClick={() => handleReject(req)}>Konfirmasi Tolak</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}