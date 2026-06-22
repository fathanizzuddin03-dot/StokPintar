import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { statusColor } from '@/lib/helpers';
import { formatRupiah } from '@/lib/helpers';
import { ClipboardList, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    base44.entities.ApprovalRequest.filter({ requested_by_id: user.id }, '-created_date', 50).then(setRequests).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  const statusIcon = (s) => {
    if (s === 'pending') return <Clock className="w-4 h-4 text-yellow-500" />;
    if (s === 'approved') return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">My Requests</h1>
        <p className="text-sm text-gray-500 mt-1">Lacak status permohonan Anda</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Belum ada permohonan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                {statusIcon(r.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{r.description}</p>
                  {r.amount > 0 && <p className="text-sm font-medium mt-1">{formatRupiah(r.amount)}</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(r.created_date).toLocaleDateString('id-ID')}</p>
                  {r.reject_reason && <p className="text-xs text-red-500 mt-1">Alasan: {r.reject_reason}</p>}
                  {r.approved_by_name && <p className="text-xs text-gray-400">{r.status === 'approved' ? 'Disetujui' : 'Ditolak'} oleh {r.approved_by_name}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}