import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/api/dbClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Upload, Download } from 'lucide-react';

export default function AdminMaster() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sku: '', name: '', variant: '', category: '', hpp: '', sell_price: '', supplier_id: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      db.entities.Product.list(),
      db.entities.Supplier.list(),
      db.entities.Category.list(),
    ]).then(([p, s, c]) => { setProducts(p); setSuppliers(s); setCategories(c); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    await db.entities.Product.create({
      ...form, hpp: Number(form.hpp), sell_price: Number(form.sell_price), stock_main: 0, stock_distributed: 0,
    });
    toast({ title: 'Produk ditambahkan' });
    setShowForm(false);
    setForm({ sku: '', name: '', variant: '', category: '', hpp: '', sell_price: '', supplier_id: '' });
    load();
  };

  const fileInputRef = useRef();

  const downloadTemplate = () => {
    const headers = ['sku', 'name', 'variant', 'category', 'hpp', 'sell_price', 'supplier_name'];
    const example = ['SKU001', 'Nama Produk', 'M / Merah', 'Kategori A', '10000', '15000', 'Nama Supplier'];
    const rows = [headers, example];
    const csvContent = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_produk.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target.result;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).filter(l => l.trim());
      const toCreate = rows.map(row => {
        const cols = row.split(',').map(c => c.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = cols[i] || ''; });
        const sup = suppliers.find(s => s.name.toLowerCase() === (obj.supplier_name || '').toLowerCase());
        return {
          sku: obj.sku,
          name: obj.name,
          variant: obj.variant,
          category: obj.category,
          hpp: Number(obj.hpp) || 0,
          sell_price: Number(obj.sell_price) || 0,
          supplier_id: sup ? sup.id : '',
          stock_main: 0,
          stock_distributed: 0,
        };
      }).filter(p => p.sku && p.name);
      if (toCreate.length === 0) { toast({ title: 'Tidak ada data valid', variant: 'destructive' }); return; }
      await db.entities.Product.bulkCreate(toCreate);
      toast({ title: `${toCreate.length} produk berhasil diimpor` });
      load();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Master Data</h1>
          <p className="text-sm text-gray-500 mt-1">Input SKU produk, variasi, dan data supplier</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" /> Template CSV</Button>
          <Button variant="outline" onClick={() => fileInputRef.current.click()}><Upload className="w-4 h-4 mr-2" /> Import CSV</Button>
          <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" /> Produk Baru</Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="text-sm font-medium text-gray-700">SKU</label><input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-gray-700">Nama Produk</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-gray-700">Variasi/Ukuran</label><input value={form.variant} onChange={e => setForm({ ...form, variant: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div>
              <label className="text-sm font-medium text-gray-700">Kategori</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Pilih...</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="text-sm font-medium text-gray-700">HPP</label><input type="number" value={form.hpp} onChange={e => setForm({ ...form, hpp: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-gray-700">Harga Jual</label><input type="number" value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
            <div>
              <label className="text-sm font-medium text-gray-700">Supplier</label>
              <select value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="">Pilih...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2"><Button onClick={handleAdd}>Simpan</Button><Button variant="outline" onClick={() => setShowForm(false)}>Batal</Button></div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-4 font-medium text-gray-500">SKU</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Nama</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Variasi</th>
            <th className="text-left py-3 px-4 font-medium text-gray-500">Kategori</th>
            <th className="text-right py-3 px-4 font-medium text-gray-500">Stok</th>
          </tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-mono text-xs">{p.sku}</td>
                <td className="py-3 px-4 font-medium">{p.name}</td>
                <td className="py-3 px-4">{p.variant || '-'}</td>
                <td className="py-3 px-4">{p.category || '-'}</td>
                <td className="py-3 px-4 text-right font-semibold">{p.stock_main || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}