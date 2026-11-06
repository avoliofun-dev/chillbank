import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, Phone, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function Register() {
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await signUp({
        email,
        password,
        nama,
        no_hp: noHp,
      });
      setSuccessMsg('Pendaftaran berhasil! Silakan masuk dengan email dan kata sandi Anda.');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Pendaftaran gagal. Periksa kembali informasi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-chill-700 to-chill-400 text-white shadow-lg shadow-chill-600/25 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Buat Akun Member
          </h1>
          <p className="text-sm text-ink-muted mt-1.5">
            Mulai kelola tabungan mandiri keluarga dengan mudah
          </p>
        </div>

        {/* Card Form */}
        <div className="chill-card p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Ayah Narendra"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Nomor WhatsApp / HP
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@keluarga.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-chill-700 to-chill-500 shadow-md shadow-chill-600/20 hover:from-chill-800 hover:to-chill-600 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <span>Daftar Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#edf4f0] text-center text-xs text-ink-muted">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="text-chill-700 font-bold hover:underline">
              Masuk di Sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

