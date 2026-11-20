import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatTanggal } from '../utils/format';
import {
  User,
  Phone,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export default function Profil() {
  const { user, profile, updateProfile, updatePassword, isAdmin } = useAuth();

  // State Profil Dasar
  const [nama, setNama] = useState(profile?.nama || '');
  const [noHp, setNoHp] = useState(profile?.no_hp || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // State Ganti Password
  const [passwordBaru, setPasswordBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Simpan Biodata Profil
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!nama.trim()) {
      setProfileError('Nama lengkap tidak boleh kosong.');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        nama: nama.trim(),
        no_hp: noHp.trim() || null,
      });
      setProfileSuccess('Profil Anda berhasil diperbarui!');
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileError(err.message || 'Gagal memperbarui profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Simpan Password Baru
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordBaru) {
      setPasswordError('Silakan masukkan kata sandi baru.');
      return;
    }

    if (passwordBaru.length < 6) {
      setPasswordError('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (passwordBaru !== konfirmasiPassword) {
      setPasswordError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(passwordBaru);
      setPasswordSuccess('Kata sandi berhasil diganti! Gunakan kata sandi baru untuk login berikutnya.');
      setPasswordBaru('');
      setKonfirmasiPassword('');
    } catch (err) {
      console.error('Update password error:', err);
      setPasswordError(err.message || 'Gagal mengganti kata sandi.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Info */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
          PENGATURAN AKUN
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">
          Profil Member & Keamanan
        </h1>
        <p className="text-xs text-ink-muted mt-1">
          Kelola nama akun, kontak WhatsApp/HP, dan ganti kata sandi brankas digital Anda.
        </p>
      </div>

      {/* Grid: 2 Kolom di Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Form Profil & Ganti Password (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Biodata Profil */}
          <div className="chill-card p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-[#edf4f0] pb-4">
              <div className="w-10 h-10 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-ink">Informasi Pribadi</h2>
                <p className="text-[11px] text-ink-muted">Perbarui nama tampilan dan kontak nomor telepon</p>
              </div>
            </div>

            {profileError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs font-semibold text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Nomor HP / WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs font-semibold text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
                  />
                </div>
                <p className="text-[10px] text-ink-muted mt-1">
                  Digunakan admin untuk verifikasi pemesanan stiker tag NFC keluarga.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Alamat Email (Akun Utama)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-100/80 text-xs text-gray-500 cursor-not-allowed font-mono"
                  />
                </div>
                <p className="text-[10px] text-ink-muted mt-1">
                  Alamat email terikat pada sistem otentikasi Supabase.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-chill-600 text-white hover:bg-chill-700 shadow-md shadow-chill-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Perubahan Profil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Ganti Password */}
          <div className="chill-card p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-[#edf4f0] pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-ink">Ganti Kata Sandi</h2>
                <p className="text-[11px] text-ink-muted">Pastikan kata sandi Anda kuat untuk mengamankan brankas tabungan</p>
              </div>
            </div>

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs font-semibold text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-ink transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={konfirmasiPassword}
                    onChange={(e) => setKonfirmasiPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs font-semibold text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memperbarui Sandi...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Perbarui Kata Sandi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Kolom Kanan: Card Status Akun & Keamanan (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Badge Card */}
          <div className="chill-balance-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md text-white flex items-center justify-center font-black text-xl border border-white/20 shadow-inner">
                {profile?.nama ? profile.nama.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <h3 className="text-lg font-black text-white leading-tight">
                  {profile?.nama || 'Member Keluarga'}
                </h3>
                <p className="text-xs text-chill-100/80 font-mono mt-0.5">
                  {user?.email}
                </p>
                <div className="inline-block mt-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-amber-300 text-amber-950 font-black'
                      : 'bg-emerald-300 text-emerald-950 font-black'
                  }`}>
                    {isAdmin ? '★ Administrator' : '● Member Tabungan'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-chill-100">
              <div className="flex items-center justify-between">
                <span className="opacity-80">ID Pengguna:</span>
                <span className="font-mono text-[10px] bg-black/20 px-2 py-0.5 rounded">
                  {user?.id ? `${user.id.slice(0, 13)}...` : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="opacity-80">Terdaftar Sejak:</span>
                <span className="font-semibold text-[11px]">
                  {profile?.created_at ? formatTanggal(profile.created_at) : 'Aktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Security Checklist Widget */}
          <div className="chill-card p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-black text-ink">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Standar Keamanan Chill Bank</span>
            </div>

            <div className="space-y-2.5 text-xs text-ink-muted">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  <strong>Enkripsi Sandi Kriptografis:</strong> Kata sandi Anda di-hash secara aman oleh Supabase Auth.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  <strong>Row Level Security (RLS):</strong> Data tabungan Anda terisolasi dan hanya dapat diakses oleh Anda dan admin keluarga.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p>
                  <strong>Perlindungan Reset Tabungan:</strong> Tindakan reset tabungan membutuhkan konfirmasi kata sandi akun untuk mencegah ketidaksengajaan.
                </p>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-chill-50 to-[#edf7f2] border border-chill-200/60 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-chill-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#4d6d62] leading-relaxed">
              Selalu jaga kerahasiaan kata sandi Anda. Anda dapat mengubah kata sandi kapan saja jika diperlukan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
