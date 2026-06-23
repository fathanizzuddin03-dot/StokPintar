import React, { useState, useEffect } from 'react';
import { db } from '@/api/dbClient';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { generateInvoiceNo } from '@/lib/helpers';
import POSForm from '@/components/pos/POSForm';

export default function POSOffline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [staffStocks, setStaffStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      db.entities.StaffStock.filter({ staff_id: user.id }),
      db.entities.Product.list(),
    ]).then(([ss, prods]) => {
      const available = prods.filter(p => ss.find(s => s.product_id === p.id && s.quantity > 0));
      setStaffStocks(ss);
      setProducts(available);
    }).finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (data) => {
    const invoice = generateInvoiceNo('offline');
    await db.entities.Transaction.create({
      invoice_no: invoice, channel: 'offline', items: JSON.stringify(data.items),
      subtotal: data.subtotal, shipping_cost: 0, discount: data.discount,
      total: data.total, hpp_total: data.hpp_total, profit: data.profit,
      payment_method: data.payment_method, customer_name: data.customer.name,
      customer_phone: data.customer.phone, staff_id: user.id, staff_name: user.full_name,
      status: 'completed',
    });

    for (const item of data.items) {
      const ss = staffStocks.find(s => s.product_id === item.product_id);
      if (ss) await db.entities.StaffStock.update(ss.id, { quantity: ss.quantity - item.qty });
    }

    if (data.payment_method === 'cash') {
      await db.entities.CashFlow.create({
        type: 'sale_cash', amount: data.total, staff_id: user.id, staff_name: user.full_name,
        reference_id: invoice, notes: `Penjualan offline ${invoice}`,
      });
    }

    toast({ title: 'Transaksi berhasil', description: invoice });
    return invoice;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">Penjualan Offline / Toko</h1>
        <p className="text-sm text-gray-500 mt-1">Catat penjualan langsung di toko</p>
      </div>
      <POSForm products={products} onSubmit={handleSubmit} channel="offline" staffName={user?.full_name} />
    </div>
  );
}