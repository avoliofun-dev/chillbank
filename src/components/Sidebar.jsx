import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  ScanLine,
  History,
  ClipboardList,
  PiggyBank,
  Nfc,
  ArrowLeftRight,
  Users,
} from 'lucide-react';

export default function Sidebar() {
  const { isAdmin } = useAuth();

  const memberNav = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pesan', label: 'Pesan Tabungan', icon: PlusCircle },
    { to: '/scan', label: 'Scan / Buka Tag', icon: ScanLine },
    { to: '/riwayat', label: 'Riwayat Transaksi', icon: History },
  ];

  const adminNav = [
    { to: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
    { to: '/admin/pesanan', label: 'Pesanan Masuk', icon: ClipboardList },
    { to: '/admin/tabungan', label: 'Daftar Tabungan', icon: PiggyBank },
    { to: '/admin/transaksi', label: 'Semua Transaksi', icon: ArrowLeftRight },
    { to: '/admin/member', label: 'Daftar Member', icon: Users },
  ];

  const navItems = isAdmin ? adminNav : memberNav;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-60 shrink-0">
        <div className="sticky top-24 bg-white/80 backdrop-blur-md border border-[#e3efea] rounded-2xl p-3 shadow-sm space-y-1">
          <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-chill-700/70">
            {isAdmin ? 'Menu Admin' : 'Menu Utama'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin' || item.to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-chill-100 to-chill-50 text-chill-800 shadow-sm border-l-4 border-chill-600 font-bold'
                      : 'text-ink-muted hover:bg-[#f1faf6] hover:text-chill-700'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </aside>

      {/* Mobile Horizontal Nav Bar */}
      <nav className="md:hidden sticky top-[58px] z-20 bg-white/95 backdrop-blur-md border-b border-[#e2eeea] px-3 py-2 overflow-x-auto flex gap-2 no-scrollbar">
        {navItems.map((item) => {
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
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}

