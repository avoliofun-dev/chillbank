import React, { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  PlusCircle,
  ScanLine,
  History,
  ClipboardList,
  PiggyBank,
  ArrowLeftRight,
  Users,
  Sparkles,
  LogOut,
  ShieldCheck,
  User,
  Nfc,
  CreditCard,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isAdmin && user) {
      // Ambil jumlah pesanan pending untuk badge admin
      supabase
        .from('pesanan_tabungan')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .then(({ count }) => {
          setPendingCount(count || 0);
        });
    }
  }, [isAdmin, user]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const memberNavGroups = [
    {
      group: 'KANTOR UTAMA',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/pesan', label: 'Pesan Tabungan', icon: PlusCircle },
      ],
    },
    {
      group: 'AKSES & RIWAYAT',
      items: [
        { to: '/scan', label: 'Scan / Buka Tag', icon: ScanLine },
        { to: '/riwayat', label: 'Riwayat Transaksi', icon: History },
      ],
    },
  ];

  const adminNavGroups = [
    {
      group: 'PANEL KONTROL',
      items: [
        { to: '/admin', label: 'Ringkasan Eksekutif', icon: LayoutDashboard },
        {
          to: '/admin/pesanan',
          label: 'Pesanan Tabungan',
          icon: ClipboardList,
          badge: pendingCount > 0 ? pendingCount : null,
        },
      ],
    },
    {
      group: 'MANAJEMEN KEUANGAN',
      items: [
        { to: '/admin/tabungan', label: 'Daftar Tabungan & NFC', icon: PiggyBank },
        { to: '/admin/transaksi', label: 'Audit Seluruh Transaksi', icon: ArrowLeftRight },
        { to: '/admin/member', label: 'Daftar Anggota Keluarga', icon: Users },
      ],
    },
  ];

  const currentGroups = isAdmin ? adminNavGroups : memberNavGroups;

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR: Full-Height Fixed Professional Layout  */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col justify-between w-64 lg:w-72 h-screen sticky top-0 bg-white border-r border-[#e2eeea] p-5 shrink-0 z-30 select-none shadow-[2px_0_15px_-4px_rgba(20,45,43,0.02)]">
        <div className="space-y-6">
          {/* Brand Header */}
          <Link
            to={isAdmin ? '/admin' : '/dashboard'}
            className="flex items-center gap-3 px-1.5 py-1 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-chill-700 to-chill-400 flex items-center justify-center text-white shadow-md shadow-chill-600/25 group-hover:scale-105 transition-all">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-tight text-ink flex items-center gap-1.5">
                Chill Bank
                <span className="text-[10px] bg-chill-100 text-chill-800 font-bold px-2 py-0.5 rounded-full">
                  Family
                </span>
              </div>
              <div className="text-[10px] tracking-wider text-ink-muted uppercase font-semibold">
                Smart Savings Vault
              </div>
            </div>
          </Link>

          {/* Role Status Banner */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-chill-50/80 to-[#f3f9f6] border border-chill-200/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-chill-900">
                {isAdmin ? 'Mode Administrator' : 'Mode Tabungan Member'}
              </span>
            </div>
            <span
              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                isAdmin
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {profile?.role || (isAdmin ? 'Admin' : 'Member')}
            </span>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-5">
            {currentGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-[#849c93]">
                  {group.group}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/admin' || item.to === '/dashboard'}
                      className={({ isActive }) =>
                        `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-gradient-to-r from-chill-700 to-chill-600 text-white shadow-md shadow-chill-600/20 font-bold'
                            : 'text-[#506c64] hover:bg-[#f1faf6] hover:text-chill-800'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 transition-colors ${
                                isActive
                                  ? 'text-white'
                                  : 'text-[#7a958c] group-hover:text-chill-700'
                              }`}
                            />
                            <span>{item.label}</span>
                          </div>

                          {item.badge ? (
                            <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                              {item.badge}
                            </span>
                          ) : (
                            isActive && (
                              <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                            )
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Profile & Logout Card */}
        <div className="pt-4 border-t border-[#edf4f0] space-y-3">
          <div className="p-2.5 rounded-2xl bg-[#f8faf9] border border-[#e2eeea] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-chill-600 to-chill-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {profile?.nama ? profile.nama.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-ink truncate">
                  {profile?.nama || 'Member Keluarga'}
                </div>
                <div className="text-[10px] text-ink-muted truncate">
                  {user?.email || 'user@chillbank.com'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Keluar dari akun"
              className="p-2 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[10px] text-center text-[#8ca59b] font-medium">
            Chill Bank v2.0 · Web NFC & QR
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE BAR: Responsive Horizontal Navigation             */}
      {/* ======================================================== */}
      <nav className="md:hidden sticky top-[57px] z-20 bg-white/95 backdrop-blur-md border-b border-[#e2eeea] px-3 py-2 overflow-x-auto flex gap-2 no-scrollbar shadow-xs">
        {currentGroups
          .flatMap((g) => g.items)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin' || item.to === '/dashboard'}
                className={({ isActive }) =>
                  `whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
                    isActive
                      ? 'bg-chill-100 text-chill-800 font-bold'
                      : 'text-ink-muted hover:bg-chill-50'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                )}
              </NavLink>
            );
          })}
      </nav>
    </>
  );
}
