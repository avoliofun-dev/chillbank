import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pesananPending: 0,
    totalTabungan: 0,
    totalSaldo: 0,
    totalTransaksi: 0,
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

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
          member:member_id (nama)
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

      // 3. Transaksi Count
      const { count: txCount, error: txErr } = await supabase
        .from('transaksi')
        .select('*', { count: 'exact', head: true });

      if (txErr) throw txErr;

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

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-ink-muted gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-chill-600" />
        <p className="text-xs">Memuat ringkasan admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
          PANEL KENDALI
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
          Ringkasan Admin <ShieldCheck className="w-6 h-6 text-chill-600" />
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Kelola pesanan tabungan keluarga, program tag NFC, dan audit mutasi transaksi.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Statistik 4 Kolom */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="chill-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
            <span>Pesanan Pending</span>
            <ClipboardList className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-ink">
            {stats.pesananPending}
          </div>
          <p className="text-[10px] text-ink-muted mt-1">Menunggu persetujuan</p>
        </div>

        <div className="chill-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
            <span>Total Tabungan</span>
            <PiggyBank className="w-4 h-4 text-chill-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-ink">
            {stats.totalTabungan}
          </div>
          <p className="text-[10px] text-ink-muted mt-1">Kantong aktif</p>
        </div>

        <div className="chill-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
            <span>Total Saldo Keluarga</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 truncate">
            {formatRupiah(stats.totalSaldo)}
          </div>
          <p className="text-[10px] text-ink-muted mt-1">Akumulasi tabungan</p>
        </div>

        <div className="chill-card p-4 sm:p-5">
          <div className="flex items-center justify-between text-ink-muted text-xs mb-2">
            <span>Total Mutasi</span>
            <ArrowLeftRight className="w-4 h-4 text-chill-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-ink">
            {stats.totalTransaksi}
          </div>
          <p className="text-[10px] text-ink-muted mt-1">Transaksi tercatat</p>
        </div>
      </div>

      {/* Pesanan Menunggu Review */}
      <div className="chill-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#edf4f0] pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-ink">Pesanan Tabungan Menunggu Review</h2>
            <p className="text-[11px] text-ink-muted">Setujui pesanan untuk membuat token tabungan unik</p>
          </div>
          <Link
            to="/admin/pesanan"
            className="text-xs font-bold text-chill-700 hover:text-chill-800"
          >
            Lihat Semua Pesanan
          </Link>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-ink-muted">
            ✨ Tidak ada pesanan tabungan yang menunggu review saat ini.
          </div>
        ) : (
          <div className="divide-y divide-[#edf4f0]">
            {pendingOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="py-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-ink">
                    {order.nama_tabungan}
                    <span className="ml-2 font-normal text-ink-muted">
                      oleh {order.member?.nama || 'Member'}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5">
                    {formatTanggal(order.created_at)}
                    {order.target_nominal ? ` · Target: ${formatRupiah(order.target_nominal)}` : ''}
                  </div>
                </div>

                <Link
                  to="/admin/pesanan"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-chill-100 text-chill-800 hover:bg-chill-200 transition-colors"
                >
                  Proses
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shortcut Menu Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          to="/admin/tabungan"
          className="chill-card p-4 flex items-center justify-between hover:border-chill-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chill-100 text-chill-700 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Daftar Tabungan</div>
              <div className="text-[10px] text-ink-muted">Tulis tag NFC / cetak QR</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-chill-700" />
        </Link>

        <Link
          to="/admin/transaksi"
          className="chill-card p-4 flex items-center justify-between hover:border-chill-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chill-100 text-chill-700 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Audit Transaksi</div>
              <div className="text-[10px] text-ink-muted">Koreksi & pembatalan</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-chill-700" />
        </Link>

        <Link
          to="/admin/member"
          className="chill-card p-4 flex items-center justify-between hover:border-chill-300 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chill-100 text-chill-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-ink">Kelola Member</div>
              <div className="text-[10px] text-ink-muted">Data akun keluarga</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-chill-700" />
        </Link>
      </div>
    </div>
  );
}

