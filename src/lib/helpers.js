export const formatRupiah = (num) => {
  if (num == null) return 'Rp 0';
  return 'Rp ' + Number(num).toLocaleString('id-ID');
};

export const generateInvoiceNo = (channel) => {
  const prefix = { offline: 'OFF', whatsapp: 'WA', shopee: 'SHP', tokopedia: 'TKP', lazada: 'LZD', tiktok: 'TT', grosir: 'GRS' };
  const p = prefix[channel] || 'INV';
  const ts = Date.now().toString(36).toUpperCase();
  return `${p}-${ts}`;
};

export const channelLabel = (ch) => {
  const map = { offline: 'Toko/Offline', whatsapp: 'WhatsApp', shopee: 'Shopee', tokopedia: 'Tokopedia', lazada: 'Lazada', tiktok: 'TikTok', grosir: 'Grosir' };
  return map[ch] || ch;
};

export const statusColor = (status) => {
  const map = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    voided: 'bg-gray-100 text-gray-800',
    returned: 'bg-orange-100 text-orange-800',
    confirmed: 'bg-green-100 text-green-800',
    matched: 'bg-green-100 text-green-800',
    mismatched: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
};