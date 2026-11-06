import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, LogOut, ShieldCheck, User } from 'lucide-react';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#e2eeea] shadow-sm px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-chill-700 to-chill-400 flex items-center justify-center text-white shadow-md shadow-chill-600/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-ink flex items-center gap-1.5">
              Chill Bank <span className="text-chill-600 font-semibold text-xs bg-chill-100 px-2 py-0.5 rounded-full">Family</span>
            </div>
            <div className="text-[10px] tracking-wider text-ink-muted uppercase font-medium">
              Smart Family Savings
            </div>
          </div>
        </Link>

        {/* User Status / Role / Logout */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mode Admin
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-chill-50 text-chill-700 border border-chill-200">
                  <User className="w-3.5 h-3.5" />
                  {profile?.nama || 'Member'}
                </span>
              )}

              <button
                onClick={handleLogout}
                title="Keluar / Logout"
                className="p-2 text-ink-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-chill-700 hover:bg-chill-50 rounded-xl transition-colors"
              >
                Masuk
              </Link>
              <Link
                to="/daftar"
                className="px-4 py-2 text-xs font-semibold bg-chill-600 text-white rounded-xl shadow-sm hover:bg-chill-700 transition-colors"
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

