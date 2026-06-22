import React, { useRef } from 'react';
import { formatRupiah } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

export default function PrintReceipt({ receipt, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
      <html><head><title>Struk ${receipt.invoice_no}</title>
      <style>
        body { font-family: monospace; font-size: 12px; padding: 16px; max-width: 320px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 2px 0; }
        .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
      </style></head>
      <body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const channelLabel = { offline: 'Toko', whatsapp: 'WhatsApp', shopee: 'Shopee', tokopedia: 'Tokopedia', lazada: 'Lazada', tiktok: 'TikTok', grosir: 'Grosir' }[receipt.channel] || receipt.channel;
  const paymentLabel = { cash: 'Tunai', transfer: 'Transfer Bank', marketplace: 'Marketplace' }[receipt.payment_method] || receipt.payment_method;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Bukti Pembayaran</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        {/* Receipt preview */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div ref={printRef} className="font-mono text-xs space-y-1">
            <div className="center bold title">GUDANG PRO</div>
            <div className="center">Bukti Pembayaran</div>
            <div className="line" />
            <div className="row"><span>No. Invoice</span><span className="bold">{receipt.invoice_no}</span></div>
            <div className="row"><span>Tanggal</span><span>{new Date().toLocaleDateString('id-ID')}</span></div>
            <div className="row"><span>Channel</span><span>{channelLabel}</span></div>
            <div className="row"><span>Kasir</span><span>{receipt.staff_name}</span></div>
            {receipt.customer_name && <div className="row"><span>Pelanggan</span><span>{receipt.customer_name}</span></div>}
            {receipt.customer_phone && <div className="row"><span>No HP</span><span>{receipt.customer_phone}</span></div>}
            <div className="line" />
            {receipt.items.map((item, i) => (
              <div key={i}>
                <div className="bold">{item.name}</div>
                <div className="row">
                  <span>{item.qty} x {formatRupiah(item.price)}</span>
                  <span>{formatRupiah(item.qty * item.price)}</span>
                </div>
              </div>
            ))}
            <div className="line" />
            <div className="row"><span>Subtotal</span><span>{formatRupiah(receipt.subtotal)}</span></div>
            {receipt.shipping_cost > 0 && <div className="row"><span>Ongkir</span><span>{formatRupiah(receipt.shipping_cost)}</span></div>}
            {receipt.discount > 0 && <div className="row"><span>Diskon</span><span>-{formatRupiah(receipt.discount)}</span></div>}
            <div className="line" />
            <div className="row bold"><span>TOTAL</span><span>{formatRupiah(receipt.total)}</span></div>
            <div className="row"><span>Pembayaran</span><span>{paymentLabel}</span></div>
            <div className="line" />
            <div className="center">Terima kasih atas pembelian Anda!</div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Tutup</Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 mr-2" /> Cetak
          </Button>
        </div>
      </div>
    </div>
  );
}