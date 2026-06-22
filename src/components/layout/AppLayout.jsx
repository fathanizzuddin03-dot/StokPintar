import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, Send, Eye, FileText,
  ClipboardCheck, Users, Database, ShoppingCart, Undo2, Wallet, HandCoins,
  ArrowLeftRight, CheckCircle, BoxSelect, ClipboardList, Menu, X, LogOut, ChevronDown, ChevronRight,
  Truck, Settings, BarChart3, ShieldCheck, PackageSearch
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const ownerMenu = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Approval Center', path: '/approvals', icon: ShieldCheck },
  { label: 'Pusat Laporan', path: '/reports', icon: BarChart3 },
  { label: 'Rekonsiliasi Shopee', path: '/reconciliation', icon: ClipboardCheck },
  { label: 'Master Data & HPP', path: '/master-data', icon: Database },
  { label: 'Manajemen Karyawan', path: '/employees', icon: Users },
];

const adminMenu = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Barang Masuk', path: '/stock-in', icon: ArrowDownToLine },
  { label: 'Barang Keluar', path: '/stock-out', icon: ArrowUpFromLine },
  { label: 'Distribusi Barang', path: '/distribute', icon: Send },
  { label: 'Pesanan Grosir', path: '/wholesale', icon: Truck },
  { label: 'Pantau Stok', path: '/monitor-stock', icon: Eye },
  { label: 'Master Data', path: '/admin-master', icon: Database },
  { label: 'Laporan Gudang', path: '/warehouse-reports', icon: FileText },
];

const staffMenu = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Penjualan Offline', path: '/pos-offline', icon: ShoppingCart },
  { label: 'Penjualan WhatsApp', path: '/pos-whatsapp', icon: ShoppingCart },
  { label: 'Penjualan Marketplace', path: '/pos-marketplace', icon: ShoppingCart },
  { label: 'Retur & Refund', path: '/returns', icon: Undo2 },
  { label: 'Arus Kas', path: '/cashflow', icon: Wallet },
  { label: 'Setor Uang', path: '/cash-deposit', icon: HandCoins },
  { label: 'Serah Terima Uang', path: '/cash-handover', icon: ArrowLeftRight },
  { label: 'Validasi Penerimaan', path: '/validate-receipt', icon: CheckCircle },
  { label: 'Penerimaan Barang', path: '/receive-goods', icon: PackageSearch },
  { label: 'Opname & Lapor Cacat', path: '/opname', icon: BoxSelect },
  { label: 'My Requests', path: '/my-requests', icon: ClipboardList },
];

export default function AppLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const role = user?.role || 'staff';

  const menu = role === 'owner' ? ownerMenu : role === 'admin' ? adminMenu : staffMenu;

  const roleLabel = role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Staff';
  const roleColor = role === 'owner' ? 'bg-amber-500' : role === 'admin' ? 'bg-blue-500' : 'bg-emerald-500';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-base text-gray-900 tracking-tight">Gudang Pro</h1>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${roleColor}`}>{roleLabel}</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {menu.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
              {(user?.full_name || 'U')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => base44.auth.logout('/')}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-heading font-bold text-gray-900">Gudang Pro</h2>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}