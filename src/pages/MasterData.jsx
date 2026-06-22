import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatRupiah } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

const tabs = ['Produk & HPP', 'Supplier', 'Ekspedisi', 'Kategori'];

export default function MasterData() {
  const { toast } = useToast();
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Product.list(),
      base44.entities.Supplier.list(),
      base44.entities.Expedition.list(),
      base44.entities.Category.list(),
    ]).then(([p, s, e, c]) => {
      setProducts(p); setSuppliers(s); setExpeditions(e); setCategories(c);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const saveHpp = async (id) => {
    await base44.entities.Product.update(id, { hpp: Number(editData.hpp), sell_price: Number(editData.sell_price) });
    toast({ title: 'HPP diperbarui' });
    setEditId(null);
    load();
  };

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({});

  const handleAddSupplier = async () => {
    await base44.entities.Supplier.create(addForm);
    toast({ title: 'Supplier ditambahkan' });
    setShowAdd(false); setAddForm({});
    load();
  };
  const handleAddExpedition = async () => {
    await base44.entities.Expedition.create(addForm);
    toast({ title: 'Ekspedisi ditambahkan' });
    setShowAdd(false); setAddForm({});
    load();
  };
  const handleAddCategory = async () => {
    await base44.entities.Category.create(addForm);
    toast({ title: 'Kategori ditambahkan' });
    setShowAdd(false); setAddForm({});
    load();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Master Data & HPP</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola HPP, supplier, ekspedisi, dan kategori</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => { setTab(i); setShowAdd(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === i ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {tab === 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-gray-500">SKU</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500">Produk</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500">HPP</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500">Harga Jual</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500">Margin</th>
                <th className="text-center py-3 px-3 font-medium text-gray-500">Aksi</th>
              </tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-gray-100">
                    <td className="py-3 px-3 font-mono text-xs">{p.sku}</td>
                    <td className="py-3 px-3">{p.name}</td>
                    <td className="py-3 px-3 text-right">
                      {editId === p.id ? <input type="number" value={editData.hpp} onChange={e => setEditData({ ...editData, hpp: e.target.value })} className="w-24 px-2 py-1 border rounded text-right text-sm" /> : formatRupiah(p.hpp)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {editId === p.id ? <input type="number" value={editData.sell_price} onChange={e => setEditData({ ...editData, sell_price: e.target.value })} className="w-24 px-2 py-1 border rounded text-right text-sm" /> : formatRupiah(p.sell_price)}
                    </td>
                    <td className="py-3 px-3 text-right text-green-600 font-semibold">{formatRupiah(p.sell_price - p.hpp)}</td>
                    <td className="py-3 px-3 text-center">
                      {editId === p.id ? (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => saveHpp(p.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditId(null)} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditId(p.id); setEditData({ hpp: p.hpp, sell_price: p.sell_price }); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 1 && (
          <div>
            <div className="flex justify-end mb-4"><Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4 mr-1" /> Tambah Supplier</Button></div>
            {showAdd && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                <input placeholder="Nama" value={addForm.name || ''} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Telepon" value={addForm.phone || ''} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <Button onClick={handleAddSupplier}>Simpan</Button>
              </div>
            )}
            <div className="space-y-2">
              {suppliers.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div><p className="font-medium">{s.name}</p><p className="text-xs text-gray-500">{s.phone || '-'}</p></div>
                  <button onClick={async () => { await base44.entities.Supplier.delete(s.id); load(); }} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {suppliers.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Belum ada supplier</p>}
            </div>
          </div>
        )}

        {tab === 2 && (
          <div>
            <div className="flex justify-end mb-4"><Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4 mr-1" /> Tambah Ekspedisi</Button></div>
            {showAdd && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                <input placeholder="Nama" value={addForm.name || ''} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Kode" value={addForm.code || ''} onChange={e => setAddForm({ ...addForm, code: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <Button onClick={handleAddExpedition}>Simpan</Button>
              </div>
            )}
            <div className="space-y-2">
              {expeditions.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div><p className="font-medium">{e.name}</p><p className="text-xs text-gray-500">{e.code || '-'}</p></div>
                  <button onClick={async () => { await base44.entities.Expedition.delete(e.id); load(); }} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {expeditions.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Belum ada ekspedisi</p>}
            </div>
          </div>
        )}

        {tab === 3 && (
          <div>
            <div className="flex justify-end mb-4"><Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="w-4 h-4 mr-1" /> Tambah Kategori</Button></div>
            {showAdd && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-4 bg-gray-50 rounded-lg">
                <input placeholder="Nama" value={addForm.name || ''} onChange={e => setAddForm({ ...addForm, name: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Deskripsi" value={addForm.description || ''} onChange={e => setAddForm({ ...addForm, description: e.target.value })} className="px-3 py-2 border rounded-lg text-sm" />
                <Button onClick={handleAddCategory}>Simpan</Button>
              </div>
            )}
            <div className="space-y-2">
              {categories.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div><p className="font-medium">{c.name}</p><p className="text-xs text-gray-500">{c.description || '-'}</p></div>
                  <button onClick={async () => { await base44.entities.Category.delete(c.id); load(); }} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Belum ada kategori</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}