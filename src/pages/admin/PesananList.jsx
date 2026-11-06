import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatTanggal } from '../../utils/format';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function PesananList() {
  const navigate = useNavigate();
  const [pesanan, setPesanan] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'disetujui' | 'ditolak'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadPesanan = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      let query = supabase
        .from('pesanan_tabungan')
        .select(`
          id,
          nama_tabungan,
          target_nominal,
          catatan,
          status,
          alasan_tolak,
          created_at,
          member:member_id (nama, no_hp)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPesanan(data || []);
    } catch (err) {
      console.error('Error loadPesanan:', err);
      setErrorMsg(err.message || 'Gagal memuat daftar pesanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPesanan();
  }, [filterStatus]);

  const handleApprove = async (id, namaTabungan) => {
    const konfirmasi = window.confirm(`Setujui pesanan tabungan "${namaTabungan}"? Sistem akan membuat token acak unik untuk tag NFC.`);
    if (!konfirmasi) return;

    setActionLoading(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: newTabunganId, error } = await supabase.rpc('approve_pesanan', {
        p_pesanan_id: id,
      });

      if (error) throw error;

      setSuccessMsg(`Pesanan "${namaTabungan}" disetujui! Mengalihkan ke halaman Tulis Tag NFC...`);
      setTimeout(() => {
        if (newTabunganId) {
          navigate(`/admin/tulis-tag/${newTabunganId}`);
        } else {
          loadPesanan();
        }
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyetujui pesanan.');
      setActionLoading(null);
    }
  };

  const handleReject = async (id, namaTabungan) => {
    const alasan = window.prompt(`Masukkan alasan penolakan untuk pesanan "${namaTabungan}":`);
    if (alasan === null) return; // User batalkan prompt

    if (!alasan.trim()) {
      alert('Harap isi alasan penolakan.');
      return;
    }

    setActionLoading(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.rpc('reject_pesanan', {
        p_pesanan_id: id,
        p_alasan: alasan.trim(),
      });

      if (error) throw error;

      setSuccessMsg(`Pesanan "${namaTabungan}" telah ditolak.`);
      await loadPesanan();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menolak pesanan.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
            ADMINISTRASI PESANAN
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Pesanan Tabungan Masuk
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Review dan setujui permintaan tabungan baru dari member keluarga.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#dfebe6] rounded-xl self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'all'
                ? 'bg-chill-100 text-chill-800'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'pending'
                ? 'bg-amber-100 text-amber-800'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('disetujui')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'disetujui'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Disetujui
          </button>
          <button
            onClick={() => setFilterStatus('ditolak')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterStatus === 'ditolak'
                ? 'bg-rose-100 text-rose-800'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Ditolak
          </button>
        </div>
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

      <div className="chill-card p-5 sm:p-6 space-y-4">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-ink-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-chill-600" />
            <p className="text-xs">Memuat daftar pesanan...</p>
          </div>
        ) : pesanan.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-muted space-y-2">
            <ClipboardList className="w-10 h-10 mx-auto text-chill-300" />
            <p>Tidak ada pesanan dengan status ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf4f0]">
            {pesanan.map((order) => (
              <div key={order.id} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-ink">
                        {order.nama_tabungan}
                      </h3>
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

                    <p className="text-xs text-ink-muted mt-1">
                      Diajukan oleh <strong>{order.member?.nama || 'Member'}</strong> ({order.member?.no_hp || 'No HP -'}) · {formatTanggal(order.created_at)}
                    </p>
                  </div>

                  {order.target_nominal && (
                    <div className="text-xs text-ink-muted sm:text-right">
                      Target: <strong className="text-ink font-bold">{formatRupiah(order.target_nominal)}</strong>
                    </div>
                  )}
                </div>

                {order.catatan && (
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-ink-muted">
                    "{order.catatan}"
                  </div>
                )}

                {order.status === 'ditolak' && order.alasan_tolak && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                    <strong>Alasan Penolakan:</strong> {order.alasan_tolak}
                  </div>
                )}

                {order.status === 'pending' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApprove(order.id, order.nama_tabungan)}
                      disabled={actionLoading === order.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      {actionLoading === order.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Setujui & Buat Tag</span>
                    </button>

                    <button
                      onClick={() => handleReject(order.id, order.nama_tabungan)}
                      disabled={actionLoading === order.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Tolak Pesanan</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

