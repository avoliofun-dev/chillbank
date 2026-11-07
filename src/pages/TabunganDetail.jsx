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

  const loadData = async () => {
    if (!token || !user) return;
    setLoading(true);
    setNotFound(false);
    setIsNotOwner(false);
    setTxError('');

    try {
      // Cari data tabungan berdasarkan token
      const { data, error } = await supabase
        .from('tabungan')
        .select('*')
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

  return (
    <div className="space-y-6">
      {/* Back Link & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-chill-700 hover:text-chill-800"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
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
      <div className="chill-balance-card p-6 sm:p-8">
        <div className="flex items-center justify-between text-chill-100 text-xs font-medium mb-1">
          <span className="flex items-center gap-1.5">
            <PiggyBank className="w-4 h-4" /> {tabungan.nama}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tabungan.tag_ditulis ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'}`}>
            {tabungan.tag_ditulis ? 'Tag NFC Terhubung' : 'Tag Belum Ditulis'}
          </span>
        </div>
        <div className="text-3xl sm:text-4xl font-black tracking-tight my-2">
          {formatRupiah(tabungan.saldo)}
        </div>
        <p className="text-[11px] text-chill-100/90 mt-3">
          Dibuat pada {formatTanggal(tabungan.created_at)}
        </p>
      </div>

      {/* Tombol Aksi Setor & Tarik */}
      <div className="chill-card p-5">
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

        {/* Modal / Inline Form Transaksi */}
        {activeTab && (
          <form onSubmit={handleSimpanTransaksi} className="mt-5 pt-5 border-t border-[#edf4f0] space-y-4">
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
              {/* Shortcut Nominal Cepat untuk Mobile */}
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
                placeholder="Contoh: Sisa uang saku, bonus akhir bulan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
              />
            </div>

            <div className="p-3 bg-[#f5faf7] border border-[#dceee4] rounded-xl text-[11px] text-[#54786b]">
              Saldo saat ini: <strong>{formatRupiah(tabungan.saldo)}</strong>. Setelah transaksi, saldo tabungan akan otomatis diperbarui dan dicatat dalam riwayat.
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

      {/* Riwayat Mutasi Khusus Tabungan Ini */}
      <div className="chill-card p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-ink">Riwayat Mutasi Tabungan Ini</h2>
          <p className="text-[11px] text-ink-muted">Daftar transaksi setor dan tarik</p>
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
    </div>
  );
}

