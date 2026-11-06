import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, loading, isAdmin, isConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-ink-muted">
        <Loader2 className="w-8 h-8 animate-spin text-chill-600" />
        <span className="text-xs font-medium">Memuat data akun...</span>
      </div>
    );
  }

  // Jika Supabase belum dikonfigurasi, biarkan lewat atau arahkan sesuai kebutuhan
  if (!isConfigured) {
    return children;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

