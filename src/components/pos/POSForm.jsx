import React, { useState } from 'react';
import { formatRupiah } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import PrintReceipt from '@/components/pos/PrintReceipt';

export default function POSForm({ products, onSubmit, channel, expeditions = [], staffName = '' }) {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [payment, setPayment] = useState('cash');
  const [shipping, setShipping] = useState({ cost: 0, expedition: '' });
  const [discount, setDiscount] = useState(0);
  const [search, setSearch] = useState('');
  const [receipt, setReceipt] = useState(null);

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    const existing = cart.find(c => c.product_id === product.id);
    if (existing) {
      setCart(cart.map(c => c.product_id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { product_id: product.id, name: product.name, sku: product.sku, price: product.sell_price, hpp: product.hpp, qty: 1 }]);
    }
  };

  const updateQty = (productId, delta) => {
    setCart(cart.map(c => {
      if (c.product_id === productId) {
        const newQty = c.qty + delta;
        return newQty <= 0 ? null : { ...c, qty: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const total = subtotal + Number(shipping.cost) - Number(discount);
  const hppTotal = cart.reduce((s, c) => s + c.hpp * c.qty, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    const data = {
      items: cart,
      customer,
      payment_method: payment,
      subtotal,
      shipping_cost: Number(shipping.cost),
      expedition: shipping.expedition,
      discount: Number(discount),
      total,
      hpp_total: hppTotal,
      profit: total - hppTotal,
    };
    const invoiceNo = await onSubmit(data);
    setReceipt({ ...data, invoice_no: invoiceNo, channel, staff_name: staffName });
    setCart([]);
    setCustomer({ name: '', phone: '', address: '' });
    setDiscount(0);
    setShipping({ cost: 0, expedition: '' });
  };

  const needsShipping = channel !== 'offline';

  return (
    <div>
      {receipt && <PrintReceipt receipt={receipt} onClose={() => setReceipt(null)} />}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Product list */}
        <div className="lg:col-span-3 space-y-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari produk (nama/SKU)..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
            {filtered.map(p => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
                <p className="text-xs text-gray-400 font-mono">{p.sku}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                {p.variant && <p className="text-xs text-gray-500">{p.variant}</p>}
                <p className="text-sm font-bold text-blue-600 mt-1">{formatRupiah(p.sell_price)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4 space-y-4">
            <h3 className="font-heading font-semibold text-gray-900">Keranjang</h3>

            {cart.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Belum ada item</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map(c => (
                  <div key={c.product_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-gray-500">{formatRupiah(c.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(c.product_id, -1)} className="p-1 rounded hover:bg-gray-200"><Minus className="w-3 h-3" /></button>
                      <span className="w-8 text-center text-sm font-semibold">{c.qty}</span>
                      <button onClick={() => updateQty(c.product_id, 1)} className="p-1 rounded hover:bg-gray-200"><Plus className="w-3 h-3" /></button>
                    </div>
                    <p className="text-sm font-semibold w-20 text-right">{formatRupiah(c.price * c.qty)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 border-t border-gray-100 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Nama Customer" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                <input placeholder="No HP" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              {needsShipping && (
                <>
                  <input placeholder="Alamat" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Ongkir" value={shipping.cost} onChange={e => setShipping({ ...shipping, cost: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    <select value={shipping.expedition} onChange={e => setShipping({ ...shipping, expedition: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="">Ekspedisi...</option>
                      {expeditions.map(ex => <option key={ex.id} value={ex.name}>{ex.name}</option>)}
                    </select>
                  </div>
                </>
              )}
              <select value={payment} onChange={e => setPayment(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="cash">Tunai</option>
                <option value="transfer">Transfer Bank</option>
                {channel !== 'offline' && <option value="marketplace">Marketplace</option>}
              </select>
              <input type="number" placeholder="Diskon" value={discount || ''} onChange={e => setDiscount(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
              {Number(shipping.cost) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Ongkir</span><span>{formatRupiah(shipping.cost)}</span></div>}
              {Number(discount) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Diskon</span><span className="text-red-500">-{formatRupiah(discount)}</span></div>}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200"><span>Total</span><span>{formatRupiah(total)}</span></div>
            </div>

            <Button className="w-full" size="lg" onClick={handleSubmit} disabled={cart.length === 0}>
              Proses Transaksi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}