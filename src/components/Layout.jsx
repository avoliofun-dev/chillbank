import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export default function Layout() {
  const { isConfigured } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f7f6] text-[#142d2b]">
      <Navbar />

      {!isConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Perhatian:</strong> Kredensial Supabase belum terpasang di file <code>.env</code>. Silakan isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>.
          </span>
        </div>
      )}

      <Sidebar />

      <div className="max-w-6xl w-full mx-auto flex-1 px-4 sm:px-6 py-6 flex flex-col md:flex-row gap-6">
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <footer className="mt-auto border-t border-[#e2eeea] py-6 text-center text-xs text-ink-muted bg-white/50">
        <p>© 2026 Chill Bank Family. Pencatatan Tabungan Mandiri Berbasis NFC & QR.</p>
      </footer>
    </div>
  );
}

