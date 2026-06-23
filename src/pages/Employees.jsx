import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Shield, ShieldOff, Users, Eye, EyeOff } from 'lucide-react';

export default function Employees() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', role: 'staff' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    db.entities.User.list().then(setUsers).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.email || !form.password) {
      toast({ title: 'Email dan password wajib diisi', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await db.auth.createUser({ email: form.email, password: form.password, role: form.role });
      toast({ title: 'Akun berhasil dibuat', description: `${form.email} (${form.role})` });
      setShowForm(false);
      setForm({ email: '', password: '', role: 'staff' });
      load();
    } catch (err) {
      // fallback: invite via email
      try {
        await db.users.inviteUser(form.email, form.role);
        toast({ title: 'Undangan terkirim', description: `${form.email} menerima link aktivasi` });
        setShowForm(false);
        setForm({ email: '', password: '', role: 'staff' });
        load();
      } catch {
        toast({ title: 'Gagal membuat akun', description: 'Coba lagi atau hubungi administrator', variant: 'destructive' });
      }
    }
    setSubmitting(false);
  };

  const toggleBlock = async (u) => {
    await db.entities.User.update(u.id, { is_blocked: !u.is_blocked });
    toast({ title: u.is_blocked ? 'Akun diaktifkan' : 'Akun dinonaktifkan' });
    load();
  };

  const changeRole = async (u, newRole) => {
    await db.entities.User.update(u.id, { role: newRole });
    toast({ title: `Role diubah ke ${newRole}` });
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Manajemen Karyawan</h1>
          <p className="text-sm text-gray-500 mt-1">Buat & kelola akun tim Anda</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <UserPlus className="w-4 h-4 mr-2" /> Buat Akun
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Buat Akun Baru</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                placeholder="email@staff.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 karakter"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? 'Memproses...' : 'Buat Akun'}</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada karyawan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(u => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${u.is_blocked ? 'bg-gray-400' : u.role === 'owner' ? 'bg-amber-500' : u.role === 'admin' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                    {(u.full_name || u.email || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {u.full_name || u.email}
                      {u.is_blocked && <span className="text-xs text-red-500 ml-2 px-2 py-0.5 bg-red-50 rounded-full">Nonaktif</span>}
                    </p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select value={u.role || 'staff'} onChange={e => changeRole(u, e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                  <Button size="sm" variant={u.is_blocked ? 'default' : 'outline'} onClick={() => toggleBlock(u)} className={u.is_blocked ? '' : 'text-red-600 border-red-200 hover:bg-red-50'}>
                    {u.is_blocked
                      ? <><Shield className="w-3 h-3 mr-1" /> Aktifkan</>
                      : <><ShieldOff className="w-3 h-3 mr-1" /> Nonaktifkan</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}