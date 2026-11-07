import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatTanggal } from '../../utils/format';
import {
  ShieldCheck,
  ClipboardList,
  PiggyBank,
  ArrowLeftRight,
  Users,
  Nfc,
  ChevronRight,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pesananPending: 0,
    totalTabungan: 0,
    totalSaldo: 0,
    totalTransaksi: 0,
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Pesanan Pending
      const { data: orders, error: ordersErr } = await supabase
        .from('pesanan_tabungan')
        .select(`
          id,
          nama_tabungan,
          target_nominal,
          catatan,
          status,
          created_at,
          member:member_id (nama, no_hp)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (ordersErr) throw ordersErr;
      setPendingOrders(orders || []);

      // 2. Tabungan & Saldo
      const { data: tabunganData, error: tabunganErr } = await supabase
        .from('tabungan')
        .select('saldo');

      if (tabunganErr) throw tabunganErr;
      const totalSaldoCalc = (tabunganData || []).reduce(
        (sum, t) => sum + Number(t.saldo || 0),
        0
      );

      // 3. Transaksi Count & Recent Tx
      const { data: txData, count: txCount, error: txErr } = await supabase
        .from('transaksi')
        .select(`
          id,
          tipe,
          nominal,
          catatan,
          status,
          created_at,
          tabungan:tabungan_id (nama),
          member:member_id (nama)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(6);

      if (txErr) throw txErr;
      setRecentTx(txData || []);

      setStats({
        pesananPending: (orders || []).length,
        totalTabungan: (tabunganData || []).length,
        totalSaldo: totalSaldoCalc,
        totalTransaksi: txCount || 0,
      });
    } catch (err) {
      console.error('Error loadAdminData:', err);
      setErrorMsg(err.message || 'Gagal memuat data admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApprove = async (id, namaTabungan) => {
    const konfirmasi = window.confirm(`Setujui pesanan "${namaTabungan}" dan buat token tag NFC unik?`);
    if (!konfirmasi) return;

    setActionLoading(id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data: newTabunganId, error } = await supabase.rpc('approve_pesanan', {
        p_pesanan_id: id,
      });

      if (error) throw error;

      setSuccessMsg(`Pesanan "${namaTabungan}" berhasil disetujui! Mengalihkan ke penulisan tag NFC...`);
      setTimeout(() => {
        if (newTabunganId) {
          navigate(`/admin/tulis-tag/${newTabunganId}`);
        } else {
          loadAdminData();
        }
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyetujui pesanan.');
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-ink-muted gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-chill-600" />
        <p className="text-xs font-semibold">Memuat pusat kendali administrator...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ======================================================== */}
      {/* 1. ADMIN HEADER                                          */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e2eeea] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              PUSAT KENDALI KELUARGA
            </span>
            <span className="text-xs text-ink-muted">· Hak Akses Penuh</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1 flex items-center gap-2">
            Ikhtisar Eksekutif Admin <ShieldCheck className="w-6 h-6 text-chill-600" />
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Otorisasi pesanan tabungan anggota keluarga, program tag NFC, dan audit mutasi finansial.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/admin/tabungan"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 shadow-md shadow-chill-600/20 transition-all hover:scale-[1.02]"
          >
            <Nfc className="w-4 h-4" />
            <span>Tulis Tag NFC Baru</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. STATS KPI GRID (4 CARDS)                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
        <div className="chill-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#7a938a]">
              Pesanan Pending
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black text-amber-800">
              {stats.pesananPending}
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">Permintaan butuh persetujuan</p>
          </div>
          <div className="pt-2 border-t border-[#edf4f0] text-[10px] text-amber-700 font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {stats.pesananPending > 0 ? 'Perlu tindakan admin' : 'Semua telah diproses'}
          </div>
        </div>

        <div className="chill-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#7a938a]">
              Total Dana Tabungan
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-700 truncate">
              {formatRupiah(stats.totalSaldo)}
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">Akumulasi seluruh anggota keluarga</p>
          </div>
          <div className="pt-2 border-t border-[#edf4f0] text-[10px] text-emerald-700 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Terhitung otomatis via trigger
          </div>
        </div>

        <div className="chill-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#7a938a]">
              Kantong Tabungan Aktif
            </span>
            <div className="w-8 h-8 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black text-ink">
              {stats.totalTabungan}
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">Tabungan yang siap di-tap</p>
          </div>
          <div className="pt-2 border-t border-[#edf4f0] text-[10px] text-chill-700 font-bold flex items-center gap-1">
            <Nfc className="w-3.5 h-3.5" /> Terintegrasi Web NFC
          </div>
        </div>

        <div className="chill-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#7a938a]">
              Total Audit Transaksi
            </span>
            <div className="w-8 h-8 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black text-ink">
              {stats.totalTransaksi}
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">Catatan setor & tarik tersimpan</p>
          </div>
          <div className="pt-2 border-t border-[#edf4f0] text-[10px] text-ink-muted font-medium">
            Row Level Security terlindungi
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. TWO-COLUMN EXECUTIVE WORKSPACE                        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Pesanan Menunggu Review (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="chill-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#edf4f0] pb-4">
              <div>
                <h2 className="text-base font-extrabold text-ink flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-amber-600" />
                  Pesanan Tabungan Menunggu Review
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Setujui pengajuan member untuk otomatis membuat token tag NFC 32-karakter.
                </p>
              </div>

              <Link
                to="/admin/pesanan"
                className="text-xs font-bold text-chill-700 hover:text-chill-800 bg-chill-50 hover:bg-chill-100 px-3 py-1.5 rounded-xl border border-chill-200 transition-colors"
              >
                Lihat Semua
              </Link>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted space-y-2">
                <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-500" />
                <p className="font-bold text-ink text-sm">Semua Pesanan Telah Diproses!</p>
                <p className="text-[11px]">Tidak ada pengajuan tabungan yang menunggu persetujuan saat ini.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#edf4f0]">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="py-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-ink">{order.nama_tabungan}</h4>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Diajukan oleh <strong>{order.member?.nama || 'Member'}</strong> ({order.member?.no_hp || '-'})
                        </p>
                        <p className="text-[10px] text-ink-muted">
                          Diajukan pada {formatTanggal(order.created_at)}
                          {order.target_nominal ? ` · Target ${formatRupiah(order.target_nominal)}` : ''}
                        </p>
                      </div>

                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                        Pending
                      </span>
                    </div>

                    {order.catatan && (
                      <p className="text-[11px] text-ink-muted italic bg-[#fafcfb] p-2 rounded-lg border border-[#edf4f0]">
                        "{order.catatan}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(order.id, order.nama_tabungan)}
                        disabled={actionLoading === order.id}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        {actionLoading === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Setujui & Buat Tag</span>
                      </button>

                      <Link
                        to="/admin/pesanan"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-ink-muted hover:text-ink hover:bg-gray-100 transition-colors"
                      >
                        Buka Detail
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shortcut Manajemen Eksekutif */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/admin/tabungan"
              className="chill-card p-4 flex items-center justify-between hover:border-chill-400 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-ink">Tabungan</div>
                  <div className="text-[10px] text-ink-muted">Tulis tag & cetak QR</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-chill-700 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="/admin/transaksi"
              className="chill-card p-4 flex items-center justify-between hover:border-chill-400 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-ink">Audit Transaksi</div>
                  <div className="text-[10px] text-ink-muted">Koreksi & pembatalan</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-chill-700 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="/admin/member"
              className="chill-card p-4 flex items-center justify-between hover:border-chill-400 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-ink">Member</div>
                  <div className="text-[10px] text-ink-muted">Daftar pengguna</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-chill-700 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* RIGHT COLUMN: Mutasi Finansial Terkini Seluruh Member (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="chill-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#edf4f0] pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-ink flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-chill-600" />
                  Aktivitas Mutasi Terkini
                </h3>
                <p className="text-[11px] text-ink-muted">Seluruh transaksi masuk & keluar keluarga</p>
              </div>

              <Link to="/admin/transaksi" className="text-[11px] text-chill-700 font-bold hover:underline">
                Audit
              </Link>
            </div>

            {recentTx.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-muted">
                Belum ada transaksi di seluruh sistem.
              </div>
            ) : (
              <div className="divide-y divide-[#edf4f0]">
                {recentTx.map((tx) => (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          tx.status === 'dibatalkan'
                            ? 'bg-gray-100 text-gray-400'
                            : tx.tipe === 'setor'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {tx.tipe === 'setor' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-ink truncate">
                          {tx.member?.nama || 'Member'} · {tx.tabungan?.nama || 'Tabungan'}
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          {formatTanggal(tx.created_at)} {tx.catatan ? `· ${tx.catatan}` : ''}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-black whitespace-nowrap ${
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

          {/* Keamanan & Catatan Operasional */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#f8faf9] to-[#edf6f2] border border-[#dceee5] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-chill-900">
              <ShieldCheck className="w-4 h-4 text-chill-600" />
              <span>Integritas Perhitungan Saldo</span>
            </div>
            <p className="text-[11px] text-[#4d6d62] leading-relaxed">
              Saldo tabungan dihitung secara mutlak dari akumulasi mutasi berstatus <code>sah</code> via PostgreSQL trigger. Admin dapat membatalkan transaksi yang keliru tanpa menghapus jejak audit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
