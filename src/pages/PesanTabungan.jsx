import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatTanggal } from '../utils/format';
import {
  PlusCircle,
  PiggyBank,
  Target,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function PesanTabungan() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [namaTabungan, setNamaTabungan] = useState('');
  const [targetNominal, setTargetNominal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [pesananList, setPesananList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadPesanan = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('pesanan_tabungan')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPesananList(data || []);
    } catch (err) {
      console.error('Error loadPesanan:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadPesanan();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const targetVal = targetNominal ? Number(targetNominal) : null;
      if (targetVal !== null && targetVal <= 0) {
        throw new Error('Target nominal harus lebih besar dari 0');
      }

      const { error } = await supabase.from('pesanan_tabungan').insert({
        member_id: user.id,
        nama_tabungan: namaTabungan.trim(),
        target_nominal: targetVal,
        catatan: catatan.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      setSuccessMsg('Pesanan tabungan berhasil dikirim! Menunggu persetujuan admin.');
      setNamaTabungan('');
      setTargetNominal('');
      setCatatan('');
      await loadPesanan();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengirim pesanan tabungan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
          PENGAJUAN TABUNGAN
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Pesan Kantong Tabungan
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Buat ruang khusus untuk tujuan menabung keluarga Anda.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Pemesanan */}
        <div className="chill-card p-6">
          <h2 className="text-sm font-extrabold text-ink mb-1 flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-chill-600" />
            Formulir Pemesanan
          </h2>
          <p className="text-[11px] text-ink-muted mb-5">
            Admin akan menyetujui dan memprogram tag NFC / kode QR untuk tabungan ini.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Nama Tabungan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={namaTabungan}
                onChange={(e) => setNamaTabungan(e.target.value)}
                placeholder="Contoh: Dana Liburan, Qurban, Gadget Baru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Target Nominal (Opsional)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">
                  Rp
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={targetNominal}
                  onChange={(e) => setTargetNominal(e.target.value)}
                  placeholder="Contoh: 5000000"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-base sm:text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Catatan / Rencana Penggunaan
              </label>
              <textarea
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Tabungan bersama untuk liburan akhir tahun ke Jogja..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all"
              />
            </div>

            <div className="p-3 bg-chill-50 border border-chill-200/60 rounded-xl text-[11px] text-chill-900 leading-relaxed">
              💡 <strong>Ketentuan:</strong> Tabungan baru aktif setelah disetujui Admin. Anda belum dapat melakukan setoran atau penarikan sebelum pesanan ini disetujui.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-chill-700 to-chill-500 shadow-md hover:from-chill-800 hover:to-chill-600 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Pesanan...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Kirim Pesanan Tabungan</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Riwayat Pengajuan Member */}
        <div className="chill-card p-6">
          <h2 className="text-sm font-extrabold text-ink mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-chill-600" />
            Status Pengajuan Anda
          </h2>
          <p className="text-[11px] text-ink-muted mb-4">
            Daftar pesanan tabungan yang pernah Anda buat.
          </p>

          {loadingList ? (
            <div className="py-12 text-center text-xs text-ink-muted flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-chill-600" />
              <span>Memuat daftar pesanan...</span>
            </div>
          ) : pesananList.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-muted">
              Belum ada riwayat pesanan tabungan.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {pesananList.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl border border-[#edf4f0] bg-[#fafdfb] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-ink">{order.nama_tabungan}</h4>
                      <p className="text-[10px] text-ink-muted">
                        Dibuat pada {formatTanggal(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.status === 'disetujui'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'ditolak'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status === 'disetujui' && <CheckCircle2 className="w-3 h-3" />}
                      {order.status === 'ditolak' && <XCircle className="w-3 h-3" />}
                      {order.status === 'pending' && <Clock className="w-3 h-3" />}
                      {order.status}
                    </span>
                  </div>

                  {order.target_nominal && (
                    <div className="text-[11px] text-ink-muted">
                      Target: <strong>{formatRupiah(order.target_nominal)}</strong>
                    </div>
                  )}

                  {order.catatan && (
                    <p className="text-[11px] text-ink-muted italic">"{order.catatan}"</p>
                  )}

                  {order.status === 'ditolak' && order.alasan_tolak && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                      <strong>Alasan Penolakan:</strong> {order.alasan_tolak}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

