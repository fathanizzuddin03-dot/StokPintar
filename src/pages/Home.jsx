import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import OwnerDashboard from './OwnerDashboard';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';

export default function Home() {
  const { user } = useAuth();
  const role = user?.role || 'staff';

  if (role === 'owner') return <OwnerDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  return <StaffDashboard />;
}