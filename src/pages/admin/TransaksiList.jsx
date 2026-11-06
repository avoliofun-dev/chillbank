import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatTanggal } from '../../utils/format';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Filter,
} from 'lucide-react';

export default function TransaksiList() {
  const [transaksi, setTransaksi] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'setor' | 'tarik' | 'dibatalkan'
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadTransaksi = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      let query = supabase
        .from('transaksi')
        .select(`
          id,
          tabungan_id,
          member_id,
          tipe,
          nominal,
          catatan,
          status,
          alasan_batal,
          created_at,
          tabungan:tabungan_id (nama),
          member:member_id (nama, no_hp)
        `)
        .order('created_at', { ascending: false });

      if (filterType === 'setor' || filterType === 'tarik') {
        query = query.eq('tipe', filterType);
      } else if (filterType === 'dibatalkan') {
        query = query.eq('status', 'dibatalkan');
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransaksi(data || []);
    } catch (err) {
      console.error('Error loadTransaksi:', err);
      setErrorMsg(err.message || 'Gagal memuat daftar transaksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransaksi();
  }, [filterType]);

  const handleCancelTransaksi = async (id, namaMember, nominal) => {
    const alasan = window.prompt(
      `Batalkan transaksi ${formatRupiah(nominal)} milik ${namaMember}?\nMasukkan alasan pembatalan:`
    );
    if (alasan === null) return;

    if (!alasan.trim()) {
      alert('Alasan pembatalan harus diisi.');
      return;
    }

    setCancellingId(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.rpc('cancel_transaksi', {
        p_transaksi_id: id,
        p_alasan: alasan.trim(),
      });

      if (error) throw error;

      setSuccessMsg('Transaksi berhasil dibatalkan (soft-cancel) dan saldo tabungan telah disesuaikan kembali secara otomatis oleh database.');
      await loadTransaksi();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membatalkan transaksi.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
            AUDIT MUTASI
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Semua Transaksi Keluarga
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Daftar seluruh transaksi masuk dan keluar serta pembatalan koreksi.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#dfebe6] rounded-xl self-start sm:self-auto shadow-sm">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'all'
                ? 'bg-chill-100 text-chill-800'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('setor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'setor'
                ? 'bg-emerald-100 text-emerald-800'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Setoran
          </button>
          <button
            onClick={() => setFilterType('tarik')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'tarik'
                ? 'bg-rose-100 text-rose-800'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Penarikan
          </button>
          <button
            onClick={() => setFilterType('dibatalkan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filterType === 'dibatalkan'
                ? 'bg-gray-200 text-gray-800'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Dibatalkan
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
            <p className="text-xs">Memuat seluruh transaksi...</p>
          </div>
        ) : transaksi.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-muted space-y-2">
            <ArrowLeftRight className="w-10 h-10 mx-auto text-chill-300" />
            <p>Tidak ada transaksi yang sesuai kriteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf4f0]">
            {transaksi.map((tx) => (
              <div key={tx.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
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
                      <span className="text-[10px] text-ink-muted font-normal bg-[#edf2ee] px-2 py-0.5 rounded-full">
                        {tx.tabungan?.nama || 'Tabungan'}
                      </span>
                      {tx.status === 'dibatalkan' && (
                        <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                          Dibatalkan
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5">
                      Member: <strong>{tx.member?.nama || 'Member'}</strong> · {formatTanggal(tx.created_at)}
                      {tx.catatan ? ` · "${tx.catatan}"` : ''}
                    </div>
                    {tx.status === 'dibatalkan' && tx.alasan_batal && (
                      <div className="text-[10px] text-rose-600 mt-1 italic">
                        Alasan pembatalan: {tx.alasan_batal}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div
                    className={`text-sm font-black ${
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

                  {tx.status === 'sah' && (
                    <button
                      onClick={() =>
                        handleCancelTransaksi(
                          tx.id,
                          tx.member?.nama || 'Member',
                          tx.nominal
                        )
                      }
                      disabled={cancellingId === tx.id}
                      className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {cancellingId === tx.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>Batalkan</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

