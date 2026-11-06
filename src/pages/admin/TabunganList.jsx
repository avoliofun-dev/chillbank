import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatTanggal } from '../../utils/format';
import {
  PiggyBank,
  Nfc,
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';

export default function TabunganList() {
  const [tabungan, setTabungan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadTabungan = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('tabungan')
        .select(`
          id,
          nama,
          token,
          tag_ditulis,
          saldo,
          aktif,
          created_at,
          member:member_id (nama, no_hp)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTabungan(data || []);
    } catch (err) {
      console.error('Error loadTabungan:', err);
      setErrorMsg(err.message || 'Gagal memuat daftar tabungan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabungan();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
          ADMINISTRASI TABUNGAN
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Daftar Seluruh Tabungan Keluarga
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Kelola kantong tabungan yang sudah disetujui, tulis tag NFC baru, atau cetak kode QR.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="chill-card p-5 sm:p-6 space-y-4">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-ink-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-chill-600" />
            <p className="text-xs">Memuat daftar tabungan...</p>
          </div>
        ) : tabungan.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-muted space-y-2">
            <PiggyBank className="w-10 h-10 mx-auto text-chill-300" />
            <p>Belum ada tabungan yang disetujui. Setujui pesanan di menu Pesanan Masuk.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#edf4f0]">
            {tabungan.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-chill-100 text-chill-700 flex items-center justify-center shrink-0">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-ink">{item.nama}</h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Pemilik: <strong>{item.member?.nama || 'Member'}</strong> ({item.member?.no_hp || '-'})
                    </p>
                    <div className="text-[10px] text-ink-muted font-mono mt-1">
                      Token: {item.token.slice(0, 16)}...
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-black text-ink">{formatRupiah(item.saldo)}</div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        item.tag_ditulis ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {item.tag_ditulis ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Tag Sudah Ditulis
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Tag Belum Ditulis
                        </>
                      )}
                    </span>
                  </div>

                  <Link
                    to={`/admin/tulis-tag/${item.id}`}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Nfc className="w-3.5 h-3.5" />
                    <span>Tulis NFC / QR</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

