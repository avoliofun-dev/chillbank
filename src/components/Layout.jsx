import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export default function Layout() {
  const { isConfigured } = useAuth();

  return (
    <div className="min-h-screen flex bg-[#f8faf9] text-[#142d2b] selection:bg-chill-100 selection:text-chill-900">
      {/* Desktop Persistent Left Sidebar & Mobile Navigation */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        {!isConfigured && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 text-center flex items-center justify-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Perhatian:</strong> Kredensial Supabase belum terpasang di file <code>.env</code>. Lengkapi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code>.
            </span>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>

        <footer className="border-t border-[#e2eeea] py-5 px-6 text-center text-[11px] text-[#789389] bg-white/60">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              © 2026 <strong>Chill Bank Family</strong> · Sistem Finansial Mandiri Berbasis Web NFC & Barcode QR.
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Semua Sistem Berjalan Normal
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
