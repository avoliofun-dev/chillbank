import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatTanggal } from '../utils/format';
import {
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  ArrowLeft,
  Target,
  RotateCcw,
  Lock,
  KeyRound,
  Edit3,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
} from 'lucide-react';

export default function TabunganDetail() {
  const { token } = useParams();
  const { user } = useAuth();

  const [tabungan, setTabungan] = useState(null);
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNotOwner, setIsNotOwner] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Form Transaksi
  const [activeTab, setActiveTab] = useState(null); // 'setor' | 'tarik' | null
  const [nominal, setNominal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState('');

  // Form Target Tabungan
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [savingTarget, setSavingTarget] = useState(false);

  // Rename Nama Tabungan
  const [editingNama, setEditingNama] = useState(false);
  const [namaInput, setNamaInput] = useState('');
  const [savingNama, setSavingNama] = useState(false);

  // Modal Reset Tabungan dengan Password
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetCatatan, setResetCatatan] = useState('Bongkar Celengan / Reset Saldo ke Rp 0');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  const loadData = async () => {
    if (!token || !user) return;
    setLoading(true);
    setNotFound(false);
    setIsNotOwner(false);
    setTxError('');

    try {
      // Cari data tabungan beserta target_nominal dari pesanan_tabungan
      const { data, error } = await supabase
        .from('tabungan')
        .select(`
          *,
          pesanan:pesanan_id (
            id,
            target_nominal
          )
        `)
        .eq('token', token)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
        return;
      }

      // Validasi kepemilikan
      if (data.member_id !== user.id) {
        setIsNotOwner(true);
        return;
      }

      setTabungan(data);
      const currentTarget = data.target_nominal || data.pesanan?.target_nominal || '';
      setTargetInput(currentTarget ? String(currentTarget) : '');
      setNamaInput(data.nama || '');

      // Ambil transaksi khusus tabungan ini
      const { data: txData, error: txErr } = await supabase
        .from('transaksi')
        .select('*')
        .eq('tabungan_id', data.id)
        .order('created_at', { ascending: false });

      if (txErr) throw txErr;
      setTransaksiList(txData || []);
    } catch (err) {
      console.error('Error loadData:', err);
      setTxError(err.message || 'Gagal memuat detail tabungan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token, user]);

  // Simpan Transaksi Setor / Tarik
  const handleSimpanTransaksi = async (e) => {
    e.preventDefault();
    setTxError('');
    setTxSuccess('');

    const numNominal = Number(nominal);
    if (!numNominal || numNominal <= 0) {
      setTxError('Nominal harus lebih dari Rp 0');
      return;
    }

    if (activeTab === 'tarik' && numNominal > Number(tabungan.saldo || 0)) {
      setTxError(
        `Saldo tidak mencukupi untuk penarikan! Saldo saat ini: ${formatRupiah(tabungan.saldo)}`
      );
      return;
    }

    const konfirmasi = window.confirm(
      `Konfirmasi ${activeTab === 'setor' ? 'Setoran' : 'Penarikan'} sebesar ${formatRupiah(numNominal)}?`
    );
    if (!konfirmasi) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from('transaksi').insert({
        tabungan_id: tabungan.id,
        member_id: user.id,
        tipe: activeTab,
        nominal: numNominal,
        catatan: catatan.trim() || null,
        status: 'sah',
      });

      if (error) throw error;

      setTxSuccess(
        `Berhasil mencatat ${activeTab === 'setor' ? 'setoran' : 'penarikan'} sebesar ${formatRupiah(numNominal)}!`
      );
      setNominal('');
      setCatatan('');
      setActiveTab(null);
      await loadData();
    } catch (err) {
      setTxError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handler Rename Nama Tabungan
  const handleSaveNama = async (e) => {
    e.preventDefault();
    if (!namaInput.trim()) return;
    setSavingNama(true);
    setTxError('');
    setTxSuccess('');
    try {
      const { error } = await supabase
        .from('tabungan')
        .update({ nama: namaInput.trim() })
        .eq('id', tabungan.id);
      if (error) throw error;
      setTxSuccess('Nama tabungan berhasil diubah!');
      setEditingNama(false);
      await loadData();
    } catch (err) {
      setTxError(err.message || 'Gagal mengubah nama tabungan.');
    } finally {
      setSavingNama(false);
    }
  };

  // Simpan Target Tabungan
  const handleSaveTarget = async (e) => {
    e.preventDefault();
    setSavingTarget(true);
    setTxError('');
    setTxSuccess('');

    try {
      const numTarget = targetInput ? Number(targetInput) : null;
      if (numTarget !== null && numTarget <= 0) {
        throw new Error('Target harus lebih besar dari Rp 0 atau biarkan kosong.');
      }

      // Coba perbarui ke tabungan langsung, dan jika ada pesanan_id, perbarui juga ke pesanan_tabungan
      let updated = false;
      try {
        const { error: tabunganErr } = await supabase
          .from('tabungan')
          .update({ target_nominal: numTarget })
          .eq('id', tabungan.id);
        if (!tabunganErr) updated = true;
      } catch (err) {
        // Fallback jika kolom belum dibuat di tabungan
      }

      if (tabungan.pesanan_id) {
        const { error: pesananErr } = await supabase
          .from('pesanan_tabungan')
          .update({ target_nominal: numTarget })
          .eq('id', tabungan.pesanan_id);
        if (!pesananErr) updated = true;
      }

      setTxSuccess('Target tabungan berhasil diperbarui!');
      setEditingTarget(false);
      await loadData();
    } catch (err) {
      console.error('Update target error:', err);
      setTxError(err.message || 'Gagal memperbarui target tabungan.');
    } finally {
      setSavingTarget(false);
    }
  };

  // Eksekusi Reset Tabungan dengan Validasi Password
  const handleResetTabungan = async (e) => {
    e.preventDefault();
    setResetError('');

    if (!resetPassword) {
      setResetError('Silakan masukkan kata sandi akun Anda untuk konfirmasi.');
      return;
    }

    if (Number(tabungan.saldo || 0) <= 0) {
      setResetError('Saldo tabungan ini sudah Rp 0.');
      return;
    }

    setResetting(true);

    try {
      // 1. Validasi Password Akun Pengguna via Supabase Auth
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: resetPassword,
      });

      if (authErr) {
        throw new Error('Kata sandi salah! Validasi gagal, reset tabungan dibatalkan demi keamanan.');
      }

      // 2. Buat transaksi penarikan reset seluruh saldo tabungan
      const saldoSaatIni = Number(tabungan.saldo);
      const { error: txErr } = await supabase.from('transaksi').insert({
        tabungan_id: tabungan.id,
        member_id: user.id,
        tipe: 'tarik',
        nominal: saldoSaatIni,
        catatan: resetCatatan.trim() || 'Bongkar Celengan / Reset Tabungan (Verifikasi Sandi)',
        status: 'sah',
      });

      if (txErr) throw txErr;

      setTxSuccess(`Tabungan "${tabungan.nama}" berhasil direset menjadi Rp 0. Seluruh saldo Rp ${saldoSaatIni.toLocaleString('id-ID')} telah dibongkar dan tercatat di riwayat mutasi.`);
      setShowResetModal(false);
      setResetPassword('');
      await loadData();
    } catch (err) {
      console.error('Reset tabungan error:', err);
      setResetError(err.message || 'Gagal melakukan reset tabungan.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-ink-muted gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-chill-600" />
        <p className="text-xs">Memverifikasi token tag tabungan...</p>
      </div>
    );
  }

  // Bukan milik user yang sedang login
  if (isNotOwner) {
    return (
      <div className="chill-card p-8 text-center max-w-lg mx-auto space-y-4 my-8">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-ink">Tabungan Ini Bukan Milik Anda</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          Tag NFC atau kode QR ini terdaftar pada akun keluarga yang lain. Pastikan Anda masuk menggunakan akun yang sesuai.
        </p>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Token tidak ditemukan
  if (notFound || !tabungan) {
    return (
      <div className="chill-card p-8 text-center max-w-lg mx-auto space-y-4 my-8">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-ink">Tabungan Tidak Ditemukan</h2>
        <p className="text-xs text-ink-muted leading-relaxed">
          Token tag tidak valid atau belum disetujui oleh admin.
        </p>
        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Kalkulasi Target Nominal & Persentase
  const activeTarget = tabungan.target_nominal || tabungan.pesanan?.target_nominal || null;
  const numSaldo = Number(tabungan.saldo || 0);
  const numTarget = Number(activeTarget || 0);
  const targetPercent = numTarget > 0 ? Math.min(100, Math.round((numSaldo / numTarget) * 100)) : null;
  const sisaTarget = numTarget > 0 ? Math.max(0, numTarget - numSaldo) : 0;
  const isTargetAchieved = numTarget > 0 && numSaldo >= numTarget;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-chill-700 hover:text-chill-800"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard Tabungan
        </Link>
        <span className="text-[10px] text-ink-muted font-mono bg-[#edf2ee] px-2.5 py-1 rounded-full">
          Token: {token.slice(0, 10)}...
        </span>
      </div>

      {txError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{txError}</span>
        </div>
      )}

      {txSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{txSuccess}</span>
        </div>
      )}

      {/* Saldo Kartu Tabungan */}
      <div className="chill-balance-card p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between text-chill-100 text-xs font-medium">
          <span className="flex items-center gap-1.5 font-bold tracking-wide">
            <PiggyBank className="w-4 h-4" /> {tabungan.nama}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditingNama(!editingNama); setNamaInput(tabungan.nama || ''); }}
              className="flex items-center gap-1 text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white/90 px-2 py-0.5 rounded-lg transition-colors"
            >
              <Edit3 className="w-3 h-3" /> Ubah Nama
            </button>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${tabungan.tag_ditulis ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/30' : 'bg-amber-400/20 text-amber-200 border border-amber-300/30'}`}>
              {tabungan.tag_ditulis ? 'Tag NFC Terhubung' : 'Tag Belum Ditulis'}
            </span>
          </div>
        </div>

        {/* Inline Form Ubah Nama Tabungan */}
        {editingNama && (
          <form onSubmit={handleSaveNama} className="flex gap-2 items-center">
            <input
              type="text"
              value={namaInput}
              onChange={(e) => setNamaInput(e.target.value)}
              placeholder="Nama baru tabungan..."
              maxLength={60}
              className="flex-1 px-3 py-1.5 rounded-xl border border-white/30 bg-white/10 text-white text-xs placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 font-bold"
            />
            <button
              type="submit"
              disabled={savingNama || !namaInput.trim()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-chill-700 hover:bg-chill-50 transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
            >
              {savingNama ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              Simpan
            </button>
            <button
              type="button"
              onClick={() => setEditingNama(false)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/80 transition-colors shrink-0"
            >
              Batal
            </button>
          </form>
        )}

        <div>
          <span className="text-[11px] text-chill-200 font-medium">Saldo Tabungan Saat Ini</span>
          <div className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-0.5">
            {formatRupiah(tabungan.saldo)}
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-chill-100/90">
          <span>Dibuat pada {formatTanggal(tabungan.created_at)}</span>
          <span className="font-mono text-[10px] bg-black/20 px-2 py-0.5 rounded">
            ID Tabungan: {tabungan.id.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* WIDGET TARGET TABUNGAN & PERSENTASE CAPAIAN              */}
      {/* ======================================================== */}
      <div className="chill-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#edf4f0] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink">
                Target Tabungan
              </h2>
              <p className="text-[11px] text-ink-muted">Pantau progres dan persentase pencapaian impian Anda</p>
            </div>
          </div>

          <button
            onClick={() => setEditingTarget(!editingTarget)}
            className="text-xs font-bold text-chill-700 hover:text-chill-800 bg-chill-50 hover:bg-chill-100 px-3 py-1.5 rounded-xl border border-chill-200 transition-colors flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editingTarget ? 'Tutup' : activeTarget ? 'Ubah Target' : 'Atur Target'}</span>
          </button>
        </div>

        {/* Form Ubah Target */}
        {editingTarget && (
          <form onSubmit={handleSaveTarget} className="p-4 rounded-2xl bg-[#f8faf9] border border-[#e2eeea] space-y-3">
            <div className="text-xs font-bold text-ink">
              Tentukan Target Nominal Tabungan (Rp)
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="Contoh: 1000000 (Kosongkan jika tanpa target)"
                className="flex-1 px-3 py-2 rounded-xl border border-[#dfebe6] bg-white text-xs font-bold text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100"
              />
              <button
                type="submit"
                disabled={savingTarget}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingTarget ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Simpan</span>
              </button>
            </div>
            <p className="text-[10px] text-ink-muted">
              Masukkan target dana yang ingin dicapai agar persentase tabungan terhitung otomatis.
            </p>
          </form>
        )}

        {/* Display Progress Bar & Status */}
        {numTarget > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-ink-muted text-[11px]">Sasaran Target:</span>
                <span className="font-extrabold text-ink ml-1.5">{formatRupiah(numTarget)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                  isTargetAchieved
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-chill-100 text-chill-800 border border-chill-200'
                }`}>
                  {targetPercent}% Tercapai
                </span>
              </div>
            </div>

            {/* Large Styled Progress Bar */}
            <div className="w-full bg-[#e8f2ee] rounded-full h-3.5 overflow-hidden p-0.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${
                  isTargetAchieved
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : 'bg-gradient-to-r from-chill-600 via-chill-500 to-emerald-400'
                }`}
                style={{ width: `${targetPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
              <span>{isTargetAchieved ? '🎉 Luar biasa! Target tabungan ini telah terpenuhi.' : `Kurang ${formatRupiah(sisaTarget)} lagi untuk mencapai 100%`}</span>
              <span className="font-bold text-ink">{formatRupiah(numSaldo)} / {formatRupiah(numTarget)}</span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-ink-muted space-y-1">
            <p>Tabungan ini belum memiliki target nominal.</p>
            <p className="text-[11px] text-[#7a958c]">
              Tekan tombol <strong>"Atur Target"</strong> di atas untuk mengaktifkan perhitungan persentase pencapaian.
            </p>
          </div>
        )}
      </div>

      {/* Tombol Aksi Finansial: Setor, Tarik, & Reset */}
      <div className="chill-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setActiveTab('setor');
              setTxError('');
            }}
            className={`py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'setor'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Setor Tabungan</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('tarik');
              setTxError('');
            }}
            className={`py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'tarik'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Tarik Tabungan</span>
          </button>
        </div>

        {/* Modal / Inline Form Transaksi Setor / Tarik */}
        {activeTab && (
          <form onSubmit={handleSimpanTransaksi} className="pt-4 border-t border-[#edf4f0] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ink flex items-center gap-1.5 capitalize">
                {activeTab === 'setor' ? (
                  <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-rose-600" />
                )}
                Konfirmasi {activeTab} Tabungan
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab(null)}
                className="text-xs text-ink-muted hover:text-ink font-semibold"
              >
                Batal
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Nominal (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="Contoh: 50000"
                className="w-full px-3.5 py-3 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-base sm:text-sm text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all font-bold"
              />
              {/* Shortcut Nominal Cepat */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
                {[10000, 20000, 50000, 100000, 200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setNominal(String(amt))}
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#edf4f0] text-chill-800 hover:bg-chill-100 rounded-lg shrink-0 transition-colors"
                  >
                    +{formatRupiah(amt).replace(',00', '')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Sisa uang jajan, hadiah ulang tahun"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
              />
            </div>

            <div className="p-3 bg-[#f5faf7] border border-[#dceee4] rounded-xl text-[11px] text-[#54786b]">
              Saldo saat ini: <strong>{formatRupiah(tabungan.saldo)}</strong>. Setelah transaksi, saldo tabungan akan otomatis diperbarui dan dicatat dalam riwayat mutasi.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                activeTab === 'setor'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Transaksi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Transaksi {activeTab}</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* ======================================================== */}
      {/* MENU RESET TABUNGAN (DENGAN PROTEKSI PASSWORD)          */}
      {/* ======================================================== */}
      <div className="chill-card p-5 border-rose-200 bg-[#fffdfd] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-rose-950 uppercase tracking-wide flex items-center gap-1.5">
                <span>Reset Tabungan / Bongkar Celengan</span>
                <span className="text-[9px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full border border-rose-200">
                  Proteksi Sandi
                </span>
              </h3>
              <p className="text-[11px] text-rose-800/80 mt-0.5">
                Kosongkan saldo tabungan ke Rp 0 setelah uang celengan dibongkar. Memerlukan verifikasi kata sandi akun Anda.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setResetError('');
              setResetPassword('');
              setShowResetModal(true);
            }}
            disabled={numSaldo <= 0}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 transition-all shrink-0 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Reset Saldo</span>
          </button>
        </div>
      </div>

      {/* Riwayat Mutasi Khusus Tabungan Ini */}
      <div className="chill-card p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-ink">Riwayat Mutasi Tabungan Ini</h2>
          <p className="text-[11px] text-ink-muted">Daftar transaksi setor, tarik, dan pembongkaran celengan</p>
        </div>

        {transaksiList.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">
            Belum ada transaksi di tabungan ini. Lakukan setoran pertama Anda!
          </div>
        ) : (
          <div className="divide-y divide-[#edf4f0]">
            {transaksiList.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.status === 'dibatalkan'
                        ? 'bg-gray-100 text-gray-400'
                        : tx.tipe === 'setor'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {tx.tipe === 'setor' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink flex items-center gap-2">
                      <span className="capitalize">{tx.tipe === 'setor' ? 'Setoran' : 'Penarikan'}</span>
                      {tx.status === 'dibatalkan' && (
                        <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                          Dibatalkan
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5">
                      {formatTanggal(tx.created_at)} {tx.catatan ? `· ${tx.catatan}` : ''}
                    </div>
                  </div>
                </div>

                <div
                  className={`text-xs font-black ${
                    tx.status === 'dibatalkan'
                      ? 'text-gray-400 line-through'
                      : tx.tipe === 'setor'
                      ? 'text-emerald-700'
                      : 'text-rose-600'
                  }`}
                >
                  {tx.tipe === 'setor' ? '+' : '-'}
                  {formatRupiah(tx.nominal)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL DIALOG RESET TABUNGAN DENGAN VALIDASI PASSWORD      */}
      {/* ======================================================== */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="chill-card p-6 max-w-md w-full space-y-4 shadow-2xl border-rose-300 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-[#edf4f0] pb-3">
              <div className="flex items-center gap-2 text-rose-700 font-black text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Konfirmasi Reset Saldo Tabungan</span>
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-1 text-ink-muted hover:text-ink rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1.5 leading-relaxed">
              <p className="font-bold">
                ⚠️ Peringatan Keamanan Finansial:
              </p>
              <p>
                Tindakan ini akan mengosongkan seluruh saldo tabungan <strong>"{tabungan.nama}"</strong> sebesar <strong>{formatRupiah(tabungan.saldo)}</strong> menjadi <strong>Rp 0</strong>.
              </p>
              <p className="text-[11px] text-rose-700">
                Data mutasi reset akan tercatat secara sah di riwayat transaksi untuk menjaga integritas saldo brankas digital.
              </p>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleResetTabungan} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Masukkan Kata Sandi Akun Anda <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-muted">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Kata sandi akun Chill Bank Anda"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-rose-300 bg-white text-xs font-bold text-ink focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-ink-muted mt-1">
                  Verifikasi ini memastikan reset hanya dapat dilakukan oleh pemilik akun yang sah.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Catatan Reset (Opsional)
                </label>
                <input
                  type="text"
                  value={resetCatatan}
                  onChange={(e) => setResetCatatan(e.target.value)}
                  placeholder="Contoh: Beli keperluan sekolah / Bongkar celengan"
                  className="w-full px-3 py-2 rounded-xl border border-[#dfebe6] bg-white text-xs text-ink focus:outline-none focus:border-chill-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {resetting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Sandi...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Verifikasi & Reset Saldo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
