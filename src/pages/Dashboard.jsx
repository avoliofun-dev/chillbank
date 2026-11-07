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
  Nfc,
  Eye,
  EyeOff,
  TrendingUp,
  CheckCircle2,
  Copy,
  Target,
  FileSpreadsheet,
} from 'lucide-react';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [tabunganList, setTabunganList] = useState([]);
  const [pesananList, setPesananList] = useState([]);
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);

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

  // Kalkulasi total setor dan tarik dari transaksi berstatus sah
  const totalSetor = transaksiList
    .filter((t) => t.tipe === 'setor' && t.status === 'sah')
    .reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);

  const totalTarik = transaksiList
    .filter((t) => t.tipe === 'tarik' && t.status === 'sah')
    .reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);

  const nfcReadyCount = tabunganList.filter((t) => t.tag_ditulis).length;
  const latestOrder = pesananList.length > 0 ? pesananList[0] : null;

  const handleCopy = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/t/${token}`);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-ink-muted gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-chill-600" />
        <p className="text-xs font-semibold">Menyiapkan dashboard finansial Anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ======================================================== */}
      {/* 1. GREETING & ACTION BAR                                 */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-[#e2eeea] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700 bg-chill-50 px-2.5 py-0.5 rounded-full border border-chill-200">
              IKHTISAR PORTOFOLIO
            </span>
            <span className="text-xs text-ink-muted">· Akun Pribadi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1 flex items-center gap-2">
            Halo, {profile?.nama || 'Member'} 👋
          </h1>
          <p className="text-xs text-ink-muted mt-0.5 max-w-xl">
            Semua tabungan mandiri dan mutasi setoran NFC Anda tercatat rapi di brankas digital keluarga.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#f1faf6] text-chill-800 hover:bg-chill-100 border border-chill-200 transition-all hover:scale-[1.02]"
          >
            <ScanLine className="w-4 h-4 text-chill-600" />
            <span>Tap NFC / QR</span>
          </Link>

          <Link
            to="/pesan"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 shadow-md shadow-chill-600/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Pesan Kantong Tabungan</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EXECUTIVE METRICS GRID (4 CARDS ON DESKTOP)          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
        {/* Card 1: Saldo Utama (Fintech Card Style) */}
        <div className="chill-balance-card p-6 flex flex-col justify-between min-h-[170px] sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-chill-100 text-xs font-medium z-10">
            <span className="flex items-center gap-1.5 font-bold tracking-wider text-[11px] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-chill-300" /> Saldo Tabungan
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
                title={showBalance ? 'Sembunyikan Saldo' : 'Tampilkan Saldo'}
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <Nfc className="w-4 h-4 text-chill-200/80" />
            </div>
          </div>

          <div className="my-2 z-10">
            <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {showBalance ? formatRupiah(totalSaldo) : '••••••••••'}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-chill-100/90 z-10 pt-2 border-t border-white/10">
            <span>{tabunganList.length} Kantong Tabungan Aktif</span>
            <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full font-bold">
              Mandiri
            </span>
          </div>
        </div>

        {/* Card 2: Mutasi Setor */}
        <div className="chill-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#7a938a]">
              Setoran Tercatat
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              {formatRupiah(totalSetor)}
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Akumulasi setoran dari 10 mutasi terakhir
            </p>
          </div>
          <div className="pt-2 border-t border-[#edf4f0] text-[10px] text-emerald-700 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Dana tersimpan aman
          </div>
        </div>

        {/* Card 3: Mutasi Tarik */}
        <div className="chill-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#7a938a]">
              Penarikan Dana
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-xl sm:text-2xl font-black text-rose-600">
              {formatRupiah(totalTarik)}
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Dana yang pernah ditarik dari tabungan
            </p>
          </div>
          <div className="pt-2 border-t border-[#edf4f0] text-[10px] text-ink-muted font-medium">
            Validasi database RLS aktif
          </div>
        </div>

        {/* Card 4: Status NFC Tag */}
        <div className="chill-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-bold text-[11px] uppercase tracking-wider text-[#7a938a]">
              Status Tag NFC
            </span>
            <div className="w-8 h-8 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
              <Nfc className="w-4 h-4" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-xl sm:text-2xl font-black text-ink">
              {nfcReadyCount} <span className="text-sm font-semibold text-ink-muted">/ {tabunganList.length}</span>
            </div>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Tabungan telah diprogram dengan NFC
            </p>
          </div>
          <div className="pt-2 border-t border-[#edf4f0] text-[10px] font-bold text-chill-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Siap di-tap kapan saja
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN DASHBOARD CONTENT SPLIT (2/3 & 1/3)              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Portfolio Kantong Tabungan (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Kantong Tabungan */}
          <div className="chill-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#edf4f0] pb-4">
              <div>
                <h2 className="text-base font-extrabold text-ink flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-chill-600" />
                  Kantong Tabungan Saya
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Setiap tabungan memiliki token unik untuk kartu NFC fisik atau kode QR.
                </p>
              </div>

              <Link
                to="/pesan"
                className="text-xs font-bold text-chill-700 hover:text-chill-800 bg-chill-50 hover:bg-chill-100 px-3 py-1.5 rounded-xl border border-chill-200 transition-colors flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Tambah Kantong
              </Link>
            </div>

            {/* List / Grid Tabungan */}
            {tabunganList.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-chill-50 text-chill-600 flex items-center justify-center">
                  <PiggyBank className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-base text-ink">Belum Ada Tabungan yang Aktif</h3>
                <p className="text-xs text-ink-muted max-w-md mx-auto">
                  Ajukan tabungan baru sekarang. Admin akan menyetujui dan memprogram tag NFC atau kode QR untuk Anda.
                </p>
                <Link
                  to="/pesan"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 shadow-md transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Pesan Tabungan Sekarang</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tabunganList.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-[#dfebe6] bg-[#fafcfb] hover:border-chill-400 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-chill-100 to-chill-50 text-chill-700 flex items-center justify-center font-bold shrink-0">
                          <PiggyBank className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            item.tag_ditulis
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {item.tag_ditulis ? 'NFC Terpasang' : 'Tag Belum Ditulis'}
                        </span>
                      </div>

                      <h3 className="font-black text-sm text-ink mt-3 group-hover:text-chill-700 transition-colors">
                        {item.nama}
                      </h3>
                      <div className="text-lg font-black text-chill-900 mt-1">
                        {showBalance ? formatRupiah(item.saldo) : '••••••••'}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#edf4f0] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopy(item.token)}
                        className="text-[10px] font-mono text-ink-muted hover:text-chill-700 flex items-center gap-1"
                        title="Salin tautan tabungan"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedToken === item.token ? 'Tersalin!' : `${item.token.slice(0, 10)}...`}</span>
                      </button>

                      <Link
                        to={`/t/${item.token}`}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 transition-all flex items-center gap-1 shadow-xs"
                      >
                        <span>Buka</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tabel Mutasi Transaksi Terbaru */}
          <div className="chill-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#edf4f0] pb-4">
              <div>
                <h2 className="text-base font-extrabold text-ink flex items-center gap-2">
                  <History className="w-5 h-5 text-chill-600" />
                  Aktivitas Mutasi Terakhir
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  10 catatan setor dan tarik tabungan Anda secara real-time.
                </p>
              </div>

              {transaksiList.length > 0 && (
                <Link
                  to="/riwayat"
                  className="text-xs font-bold text-chill-700 hover:text-chill-800 hover:underline"
                >
                  Lihat Semua
                </Link>
              )}
            </div>

            {transaksiList.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-muted">
                Belum ada mutasi transaksi. Lakukan setoran pertama melalui tap NFC atau buka detail tabungan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#edf4f0] text-[10px] font-extrabold uppercase tracking-wider text-[#7a938a]">
                      <th className="pb-3 font-semibold">Tipe & Tabungan</th>
                      <th className="pb-3 font-semibold">Waktu</th>
                      <th className="pb-3 font-semibold">Catatan</th>
                      <th className="pb-3 font-semibold text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf4f0]">
                    {transaksiList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#f9fcfb] transition-colors">
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                tx.status === 'dibatalkan'
                                  ? 'bg-gray-100 text-gray-400'
                                  : tx.tipe === 'setor'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-rose-50 text-rose-600'
                              }`}
                            >
                              {tx.tipe === 'setor' ? (
                                <ArrowDownLeft className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-ink capitalize flex items-center gap-1.5">
                                {tx.tipe === 'setor' ? 'Setoran' : 'Penarikan'}
                                {tx.status === 'dibatalkan' && (
                                  <span className="text-[8px] bg-rose-50 text-rose-600 px-1 py-0.2 rounded font-extrabold">
                                    Batal
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-ink-muted">
                                {tx.tabungan?.nama || 'Tabungan'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-3 text-[11px] text-ink-muted whitespace-nowrap">
                          {formatTanggal(tx.created_at)}
                        </td>
                        <td className="py-3.5 pr-3 text-[11px] text-ink-muted max-w-[180px] truncate">
                          {tx.catatan || '-'}
                        </td>
                        <td className="py-3.5 text-right whitespace-nowrap font-black">
                          <span
                            className={
                              tx.status === 'dibatalkan'
                                ? 'text-gray-400 line-through'
                                : tx.tipe === 'setor'
                                ? 'text-emerald-700'
                                : 'text-rose-600'
                            }
                          >
                            {tx.tipe === 'setor' ? '+' : '-'}
                            {formatRupiah(tx.nominal)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Widgets & Order Tracker (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Widget 1: NFC Tap Quick Hub */}
          <div className="chill-card p-6 bg-gradient-to-br from-white via-white to-chill-50/50 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-chill-700 to-chill-400 text-white flex items-center justify-center shadow-md shadow-chill-600/20 shrink-0">
                <Nfc className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-ink">Buka Tag Tabungan</h3>
                <p className="text-[11px] text-ink-muted">Pindai fisik tag NFC atau QR</p>
              </div>
            </div>

            <p className="text-xs text-[#526f65] leading-relaxed">
              Punya kartu tabungan fisik dengan stiker NFC atau cetakan QR? Tekan tombol di bawah untuk membuka tabungan instan.
            </p>

            <Link
              to="/scan"
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-chill-700 to-chill-500 text-white shadow-md hover:from-chill-800 hover:to-chill-600 transition-all flex items-center justify-center gap-2"
            >
              <ScanLine className="w-4 h-4" />
              <span>Mulai Pindai NFC / QR</span>
            </Link>
          </div>

          {/* Widget 2: Status Pesanan Terbaru */}
          <div className="chill-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#edf4f0] pb-3">
              <h3 className="font-extrabold text-sm text-ink flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-chill-600" />
                Status Pesanan Tabungan
              </h3>
              <Link to="/pesan" className="text-[11px] text-chill-700 font-bold hover:underline">
                Kelola
              </Link>
            </div>

            {pesananList.length === 0 ? (
              <div className="text-center py-6 text-xs text-ink-muted">
                Belum ada pengajuan pesanan tabungan.
              </div>
            ) : (
              <div className="space-y-3">
                {pesananList.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-xl border border-[#edf4f0] bg-[#fafcfb] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-xs text-ink">{order.nama_tabungan}</span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          order.status === 'disetujui'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'ditolak'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="text-[10px] text-ink-muted">
                      {order.target_nominal ? `Target ${formatRupiah(order.target_nominal)} · ` : ''}
                      {formatTanggal(order.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Widget 3: Tips & Edukasi Finansial */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-chill-50 to-[#edf7f2] border border-chill-200/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-chill-900">
              <Sparkles className="w-4 h-4 text-chill-600" />
              <span>Tips Celengan Mandiri</span>
            </div>
            <p className="text-[11px] text-[#4d6d62] leading-relaxed">
              Tempelkan tag NFC pada celengan fisik di kamar Anda. Setiap kali memasukkan uang receh atau kertas, cukup tap ponsel ke celengan untuk mencatat saldonya secara instan!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
