import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { generateInvoiceNo } from '@/lib/helpers';
import POSForm from '@/components/pos/POSForm';

export default function POSMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staffStocks, setStaffStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketplace, setMarketplace] = useState('shopee');

  useEffect(() => {
    if (!user) return;
    Promise.all([
      base44.entities.StaffStock.filter({ staff_id: user.id }),
      base44.entities.Product.list(),
      base44.entities.Expedition.list(),
    ]).then(([ss, prods, exp]) => {
      const available = prods.filter(p => ss.find(s => s.product_id === p.id && s.quantity > 0));
      setStaffStocks(ss);
      setProducts(available);
      setExpeditions(exp);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (data) => {
    const invoice = generateInvoiceNo(marketplace);
    await base44.entities.Transaction.create({
      invoice_no: invoice, channel: marketplace, items: JSON.stringify(data.items),
      subtotal: data.subtotal, shipping_cost: data.shipping_cost, discount: data.discount,
      total: data.total, hpp_total: data.hpp_total, profit: data.profit,
      payment_method: 'marketplace', customer_name: data.customer.name,
      customer_phone: data.customer.phone, customer_address: data.customer.address,
      expedition: data.expedition, staff_id: user.id, staff_name: user.full_name,
      status: 'processing',
    });

    for (const item of data.items) {
      const ss = staffStocks.find(s => s.product_id === item.product_id);
      if (ss) await base44.entities.StaffStock.update(ss.id, { quantity: ss.quantity - item.qty });
    }

    toast({ title: 'Transaksi berhasil', description: invoice });
    return invoice;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Penjualan Marketplace</h1>
        <p className="text-sm text-gray-500 mt-1">Catat pesanan dari marketplace</p>
      </div>
      <div className="flex gap-2">
        {['shopee', 'tokopedia', 'lazada', 'tiktok'].map(mp => (
          <button key={mp} onClick={() => setMarketplace(mp)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${marketplace === mp ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {mp}
          </button>
        ))}
      </div>
      <POSForm products={products} onSubmit={handleSubmit} channel={marketplace} expeditions={expeditions} staffName={user?.full_name} />
    </div>
  );
}