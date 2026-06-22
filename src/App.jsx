import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import ApprovalCenter from '@/pages/ApprovalCenter';
import Reports from '@/pages/Reports';
import Reconciliation from '@/pages/Reconciliation';
import MasterData from '@/pages/MasterData';
import Employees from '@/pages/Employees';
import StockIn from '@/pages/StockIn';
import StockOut from '@/pages/StockOut';
import Distribute from '@/pages/Distribute';
import Wholesale from '@/pages/Wholesale';
import MonitorStock from '@/pages/MonitorStock';
import AdminMaster from '@/pages/AdminMaster';
import WarehouseReports from '@/pages/WarehouseReports';
import POSOffline from '@/pages/POSOffline';
import POSWhatsapp from '@/pages/POSWhatsapp';
import POSMarketplace from '@/pages/POSMarketplace';
import Returns from '@/pages/Returns';
import CashFlowPage from '@/pages/CashFlowPage';
import CashDeposit from '@/pages/CashDeposit';
import CashHandover from '@/pages/CashHandover';
import ValidateReceipt from '@/pages/ValidateReceipt';
import ReceiveGoods from '@/pages/ReceiveGoods';
import Opname from '@/pages/Opname';
import MyRequests from '@/pages/MyRequests';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          {/* Owner */}
          <Route path="/approvals" element={<ApprovalCenter />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reconciliation" element={<Reconciliation />} />
          <Route path="/master-data" element={<MasterData />} />
          <Route path="/employees" element={<Employees />} />
          {/* Admin */}
          <Route path="/stock-in" element={<StockIn />} />
          <Route path="/stock-out" element={<StockOut />} />
          <Route path="/distribute" element={<Distribute />} />
          <Route path="/wholesale" element={<Wholesale />} />
          <Route path="/monitor-stock" element={<MonitorStock />} />
          <Route path="/admin-master" element={<AdminMaster />} />
          <Route path="/warehouse-reports" element={<WarehouseReports />} />
          {/* Staff */}
          <Route path="/pos-offline" element={<POSOffline />} />
          <Route path="/pos-whatsapp" element={<POSWhatsapp />} />
          <Route path="/pos-marketplace" element={<POSMarketplace />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/cashflow" element={<CashFlowPage />} />
          <Route path="/cash-deposit" element={<CashDeposit />} />
          <Route path="/cash-handover" element={<CashHandover />} />
          <Route path="/validate-receipt" element={<ValidateReceipt />} />
          <Route path="/receive-goods" element={<ReceiveGoods />} />
          <Route path="/opname" element={<Opname />} />
          <Route path="/my-requests" element={<MyRequests />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App