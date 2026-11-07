import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  LogOut,
  ShieldCheck,
  User,
  PlusCircle,
  ScanLine,
  Database,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, isAdmin, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Nama halaman berdasarkan pathname
  const getPageTitle = (path) => {
    if (path.startsWith('/admin/pesanan')) return 'Manajemen Pesanan Tabungan';
    if (path.startsWith('/admin/tabungan')) return 'Daftar Tabungan & NFC Tag';
    if (path.startsWith('/admin/transaksi')) return 'Audit Mutasi Transaksi';
    if (path.startsWith('/admin/member')) return 'Daftar Anggota Keluarga';
    if (path.startsWith('/admin/tulis-tag')) return 'Program Web NFC & Cetak QR';
    if (path === '/admin') return 'Panel Eksekutif Administrator';
    if (path === '/pesan') return 'Pengajuan Tabungan Baru';
    if (path === '/scan') return 'Pindai Tag NFC & QR';
    if (path === '/riwayat') return 'Riwayat Mutasi Finansial';
    if (path.startsWith('/t/')) return 'Detail Tabungan & Transaksi';
    return 'Dashboard Tabungan Keluarga';
  };

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="no-print sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#e2eeea] px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Brand & Desktop Breadcrumbs */}
        <div className="flex items-center gap-3">
          {/* Mobile Only Logo */}
          <Link to={isAdmin ? '/admin' : '/dashboard'} className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-chill-700 to-chill-400 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-ink">Chill Bank</span>
          </Link>

          {/* Desktop Breadcrumbs / Title Context */}
          <div className="hidden md:block">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-ink-muted">
              <span>Chill Bank</span>
              <span>/</span>
              <span className="text-chill-700 font-bold capitalize">
                {isAdmin ? 'Admin' : 'Member'}
              </span>
              <span>/</span>
              <span className="text-ink font-semibold">{getPageTitle(location.pathname)}</span>
            </div>
            <h1 className="text-lg font-black text-ink tracking-tight mt-0.5">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
        </div>

        {/* Right: Date, Status Indicator, Quick Actions, Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Tanggal Aktif (Desktop Only) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f8faf9] border border-[#e2eeea] text-[11px] font-semibold text-[#577268]">
            <Calendar className="w-3.5 h-3.5 text-chill-600" />
            <span>{currentDate}</span>
          </div>

          {/* Database Live Status (Desktop Only) */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/70 text-[11px] font-bold text-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Supabase Cloud</span>
          </div>

          {/* Quick Action Button */}
          {!isAdmin ? (
            <Link
              to="/pesan"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-chill-600 text-white shadow-sm hover:bg-chill-700 transition-all hover:shadow"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Pesan Tabungan</span>
            </Link>
          ) : (
            <Link
              to="/admin/tabungan"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-chill-600 text-white shadow-sm hover:bg-chill-700 transition-all hover:shadow"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Tulis Tag NFC</span>
            </Link>
          )}

          {/* Role Pill & Mobile Logout */}
          {user ? (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                  isAdmin
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-chill-50 text-chill-800 border border-chill-200'
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> : <User className="w-3.5 h-3.5 text-chill-600" />}
                <span className="capitalize">{profile?.nama?.split(' ')[0] || (isAdmin ? 'Admin' : 'Member')}</span>
              </span>

              <button
                onClick={handleLogout}
                title="Keluar"
                className="md:hidden p-2 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-semibold text-chill-700 hover:bg-chill-50 rounded-xl transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/daftar"
                className="px-3.5 py-1.5 text-xs font-semibold bg-chill-600 text-white rounded-xl shadow-sm hover:bg-chill-700 transition-colors"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
