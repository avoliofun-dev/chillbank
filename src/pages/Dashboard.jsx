import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatRupiah, formatTanggal } from '../utils/format';
import {
  Sparkles,
  ScanLine,
  History,
  PlusCircle,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [tabunganList, setTabunganList] = useState([]);
  const [pesananList, setPesananList] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Ambil data tabungan aktif
      const { data: tabunganData, error: tabunganErr } = await supabase
        .from('tabungan')
        .select('*')
        .eq('member_id', user.id)
        .eq('aktif', true)
        .order('created_at', { ascending: false });

      if (tabunganErr) throw tabunganErr;
      setTabunganList(tabunganData || []);

      // 2. Ambil data pesanan tabungan
      const { data: pesananData, error: pesananErr } = await supabase
        .from('pesanan_tabungan')
        .select('*')
        .eq('member_id', user.id)
        .order('created_at', { ascending: false });

      if (pesananErr) throw pesananErr;
      setPesananList(pesananData || []);

      // 3. Ambil 10 transaksi terakhir milik member
      const { data: txData, error: txErr } = await supabase
        .from('transaksi')
        .select(`
          id,
          tipe,
          nominal,
          catatan,
          status,
          created_at,
          tabungan:tabungan_id (nama)
        `)
        .eq('member_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (txErr) throw txErr;
      setTransaksiList(txData || []);
    } catch (err) {
      console.error('Error loadDashboardData:', err);
      setErrorMsg(err.message || 'Gagal memuat data dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const totalSaldo = tabunganList.reduce((acc, curr) => acc + Number(curr.saldo || 0), 0);
  const latestOrder = pesananList.length > 0 ? pesananList[0] : null;

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-ink-muted gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-chill-600" />
        <p className="text-xs">Memuat informasi tabungan Anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
            DASHBOARD KELUARGA
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
            Hai, {profile?.nama || 'Member'} 👋
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Sedikit demi sedikit, tabungan impianmu bertumbuh santai.
          </p>
        </div>

        <Link
          to="/pesan"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-chill-100 text-chill-800 hover:bg-chill-200 transition-colors w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Pesan Tabungan Baru</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Saldo Utama Card */}
      {tabunganList.length > 0 ? (
        <div className="chill-balance-card p-6 sm:p-8">
          <div className="flex items-center justify-between text-chill-100 text-xs font-medium mb-2">
            <span>Total Saldo Semua Tabungan</span>
            <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> {tabunganList.length} Tabungan Aktif
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight my-2">
            {formatRupiah(totalSaldo)}
          </div>
          <p className="text-xs text-chill-100/90 flex items-center gap-1.5 mt-4">
            Terus konsisten menabung untuk mewujudkan impian bersama ✨
          </p>
        </div>
      ) : (
        /* Empty State bila belum ada tabungan yang disetujui */
        <div className="chill-card p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-chill-50 text-chill-600 flex items-center justify-center">
            <PiggyBank className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-ink">Belum Ada Tabungan Aktif</h3>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1">
              Ajukan tabungan baru, lalu admin akan menyetujuinya dan menyiapkan tag NFC atau barcode QR Anda.
            </p>
          </div>

          {latestOrder && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              Pesanan Terakhir: <strong className="capitalize">{latestOrder.nama_tabungan}</strong> ({latestOrder.status})
            </div>
          )}

          <div>
            <Link
              to="/pesan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Pesanan Tabungan</span>
            </Link>
          </div>
        </div>
      )}

      {/* Action Shortcut Buttons */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link
          to="/scan"
          className="chill-card p-4 flex items-center gap-3 hover:border-chill-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-chill-100 text-chill-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-ink">Scan / Buka Tag</div>
            <div className="text-[11px] text-ink-muted">Tap NFC atau kamera QR</div>
          </div>
        </Link>

        <Link
          to="/riwayat"
          className="chill-card p-4 flex items-center gap-3 hover:border-chill-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-mint text-chill-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-ink">Riwayat Transaksi</div>
            <div className="text-[11px] text-ink-muted">Setoran & penarikan</div>
          </div>
        </Link>
      </div>

      {/* Tabungan Saya List */}
      {tabunganList.length > 0 && (
        <div className="chill-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#edf4f0] pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-ink">Tabungan Saya</h2>
              <p className="text-[11px] text-ink-muted">Daftar kantong tabungan aktif</p>
            </div>
            <Link
              to="/pesan"
              className="text-xs font-bold text-chill-700 hover:text-chill-800 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Tambah
            </Link>
          </div>

          <div className="divide-y divide-[#edf4f0]">
            {tabunganList.map((t) => (
              <div
                key={t.id}
                className="py-3.5 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-chill-100 to-chill-50 text-chill-700 flex items-center justify-center font-bold">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-ink">{t.nama}</h3>
                    <div className="text-[10px] text-ink-muted mt-0.5 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.tag_ditulis ? 'bg-green-500' : 'bg-amber-400'}`} />
                      {t.tag_ditulis ? 'Tag NFC Siap' : 'Menunggu Penulisan Tag'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-ink">
                      {formatRupiah(t.saldo)}
                    </div>
                  </div>
                  <Link
                    to={`/t/${t.token}`}
                    className="p-2 text-ink-muted hover:text-chill-700 hover:bg-chill-50 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10 Transaksi Terakhir */}
      <div className="chill-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#edf4f0] pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-ink">Aktivitas Transaksi Terbaru</h2>
            <p className="text-[11px] text-ink-muted">10 catatan mutasi terakhir</p>
          </div>
          {transaksiList.length > 0 && (
            <Link
              to="/riwayat"
              className="text-xs font-bold text-chill-700 hover:text-chill-800"
            >
              Lihat Semua
            </Link>
          )}
        </div>

        {transaksiList.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">
            Belum ada transaksi tercatat. Mulai menabung dengan tap NFC atau buka tabungan Anda.
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
                      {tx.tabungan?.nama && (
                        <span className="text-[10px] text-ink-muted font-normal bg-[#edf2ee] px-2 py-0.5 rounded-full">
                          {tx.tabungan.nama}
                        </span>
                      )}
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

