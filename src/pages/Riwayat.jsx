import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatTanggal } from '../utils/format';
import {
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  AlertCircle,
  Loader2,
  Calendar,
} from 'lucide-react';

export default function Riwayat() {
  const { user } = useAuth();
  const [transaksiList, setTransaksiList] = useState([]);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'setor' | 'tarik'
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadRiwayat = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');

    try {
      let query = supabase
        .from('transaksi')
        .select(`
          id,
          tipe,
          nominal,
          catatan,
          status,
          alasan_batal,
          created_at,
          tabungan:tabungan_id (nama)
        `)
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('tipe', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransaksiList(data || []);
    } catch (err) {
      console.error('Error loadRiwayat:', err);
      setErrorMsg(err.message || 'Gagal memuat riwayat transaksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiwayat();
  }, [user, filterType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
            CATATAN AKTIVITAS
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Daftar seluruh mutasi setoran dan penarikan tabungan keluarga Anda.
          </p>
        </div>

        {/* Filter Buttons */}
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
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Transaksi Card */}
      <div className="chill-card p-5 sm:p-6 space-y-4">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-ink-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-chill-600" />
            <p className="text-xs">Memuat daftar mutasi transaksi...</p>
          </div>
        ) : transaksiList.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-muted space-y-2">
            <History className="w-10 h-10 mx-auto text-chill-300" />
            <p>Belum ada data transaksi yang sesuai filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf4f0]">
            {transaksiList.map((tx) => (
              <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.status === 'dibatalkan'
                        ? 'bg-gray-100 text-gray-400'
                        : tx.tipe === 'setor'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {tx.tipe === 'setor' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink flex items-center gap-2">
                      <span className="capitalize">{tx.tipe === 'setor' ? 'Setoran' : 'Penarikan'}</span>
                      {tx.tabungan?.nama && (
                        <span className="text-[10px] text-ink-muted font-normal bg-[#edf2ee] px-2 py-0.5 rounded-full">
                          {tx.tabungan.nama}
                        </span>
                      )}
                      {tx.status === 'dibatalkan' && (
                        <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">
                          Dibatalkan Admin
                        </span>
                      )}
                    </div>

                    <div className="text-[10px] text-ink-muted mt-0.5">
                      {formatTanggal(tx.created_at)} {tx.catatan ? `· ${tx.catatan}` : ''}
                    </div>

                    {tx.status === 'dibatalkan' && tx.alasan_batal && (
                      <div className="text-[10px] text-rose-600 mt-1 italic">
                        Alasan pembatalan: {tx.alasan_batal}
                      </div>
                    )}
                  </div>
                </div>

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

