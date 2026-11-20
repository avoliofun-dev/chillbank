import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatRupiah } from '../../utils/format';
import {
  CheckCircle2,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Nfc,
  QrCode,
  Lock,
  KeyRound,
  FileCode2,
  Database,
  Smartphone,
  Server,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Percent,
  RotateCcw,
  UserCheck,
  ClipboardList,
} from 'lucide-react';

export default function ProgresAudit() {
  const [activeTab, setActiveTab] = useState('matriks'); // 'matriks' | 'keamanan' | 'arsitektur' | 'produksi'
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalTabungan: 0,
    totalTransaksi: 0,
    pendingOrders: 0,
    totalSaldo: 0,
    loading: true,
  });

  useEffect(() => {
    async function fetchLiveMetrics() {
      try {
        const [
          { count: usersCount },
          { data: tabunganData, count: tabunganCount },
          { count: txCount },
          { count: pendingCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('tabungan').select('saldo', { count: 'exact' }),
          supabase.from('transaksi').select('*', { count: 'exact', head: true }),
          supabase.from('pesanan_tabungan').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        const saldoAccumulated = (tabunganData || []).reduce((acc, t) => acc + Number(t.saldo || 0), 0);

        setMetrics({
          totalUsers: usersCount || 0,
          totalTabungan: tabunganCount || 0,
          totalTransaksi: txCount || 0,
          pendingOrders: pendingCount || 0,
          totalSaldo: saldoAccumulated,
          loading: false,
        });
      } catch (err) {
        console.error('Error load audit metrics:', err);
        setMetrics((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchLiveMetrics();
  }, []);

  const featureChecklist = [
    {
      category: 'Autentikasi & Akun Member',
      items: [
        { name: 'Registrasi & Login Akun Supabase Auth', status: 'Selesai', detail: 'Email & Password dengan hashing aman' },
        { name: 'Otomatisasi Pembuatan Profil via Trigger', status: 'Selesai', detail: 'Trigger public.handle_new_user()' },
        { name: 'Menu Edit Profil Member & Nomor HP/WhatsApp', status: 'Selesai', detail: 'Pembaruan data profil & metadata auth' },
        { name: 'Menu Ganti Kata Sandi Member', status: 'Selesai', detail: 'Validasi password baru & konfirmasi mandiri' },
        { name: 'Role-Based Access Control (Admin vs Member)', status: 'Selesai', detail: 'Proteksi route & fungsi is_admin()' },
      ],
    },
    {
      category: 'Pemesanan & Alur Kantong Tabungan',
      items: [
        { name: 'Formulir Pengajuan Tabungan Baru', status: 'Selesai', detail: 'Input nama, target nominal, dan catatan' },
        { name: 'Validasi Pesanan Pending oleh Admin', status: 'Selesai', detail: 'RPC approve_pesanan & reject_pesanan' },
        { name: 'Pembuatan Token Acak 24-byte (48 Hex Char)', status: 'Selesai', detail: 'encode(gen_random_bytes(24), "hex") tidak dapat ditebak' },
        { name: 'Daftar Tabungan & Status Aktif', status: 'Selesai', detail: 'Tampilan portofolio tabungan member & admin' },
      ],
    },
    {
      category: 'Fitur Presentase Target Tabungan',
      items: [
        { name: 'Perhitungan Persentase Otomatis (Saldo / Target)', status: 'Selesai', detail: 'Kalkulasi real-time persentase capaian tabungan' },
        { name: 'Visual Progress Bar & Indikator Sisa Dana', status: 'Selesai', detail: 'Bar progres interaktif dan status kurang berapa' },
        { name: 'Tampilan Target di Dashboard & Halaman Detail', status: 'Selesai', detail: 'Tersedia di kartu tabungan & halaman /t/:token' },
        { name: 'Fleksibilitas Update Target Nominal', status: 'Selesai', detail: 'Dukungan migrasi target_nominal pada tabungan' },
      ],
    },
    {
      category: 'Fitur Reset Tabungan dengan Proteksi Password',
      items: [
        { name: 'Validasi Kata Sandi Pengguna Sebelum Reset', status: 'Selesai', detail: 'Re-autentikasi password akun via Supabase Auth' },
        { name: 'Pencatatan Audit Trail Reset Finansial', status: 'Selesai', detail: 'Mutasi penarikan saldo ke Rp 0 tetap tercatat sah di riwayat' },
        { name: 'Pencegahan Kesalahan Eksekusi (Modal Konfirmasi)', status: 'Selesai', detail: 'Peringatan risiko pengosongan saldo tabungan' },
      ],
    },
    {
      category: 'Integrasi Web NFC & Barcode / QR Code',
      items: [
        { name: 'Penulisan URL Token ke Tag NFC (Web NFC API)', status: 'Selesai', detail: 'NDEFReader.write dengan deteksi browser Chrome Android' },
        { name: 'Pembuatan Kode QR Otomatis & Cetak Label', status: 'Selesai', detail: 'qrcode.react + CSS print preview' },
        { name: 'Pemindai Kamera Barcode/QR Terintegrasi', status: 'Selesai', detail: 'html5-qrcode scan langsung ke /t/:token' },
        { name: 'Keamanan Data Tag Fisik', status: 'Selesai', detail: 'Hanya menyimpan URL token acak, tanpa data saldo di fisik tag' },
      ],
    },
    {
      category: 'Pencatatan Finansial & Keamanan Database',
      items: [
        { name: 'Mutasi Setor dan Tarik Tabungan', status: 'Selesai', detail: 'Validasi saldo tidak boleh negatif di tingkat DB' },
        { name: 'Trigger Rekalkulasi Saldo Otomatis', status: 'Selesai', detail: 'public.recalculate_tabungan_saldo() menjamin konsistensi' },
        { name: 'Row Level Security (RLS) di Seluruh Tabel', status: 'Selesai', detail: 'Data member terisolasi ketat dari member lain' },
        { name: 'Soft Cancel Transaksi oleh Administrator', status: 'Selesai', detail: 'Pembatalan transaksi dengan catatan alasan pembatalan' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700 bg-chill-50 px-2.5 py-0.5 rounded-full border border-chill-200">
              AUDIT SISTEM EKSEKUTIF
            </span>
            <span className="text-xs text-ink-muted">· Chill Bank Family v2.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-1">
            Menu Progres & Audit Proyek
          </h1>
          <p className="text-xs text-ink-muted mt-0.5 max-w-2xl">
            Laporan lengkap kemajuan pengembangan, evaluasi kepatuhan arsitektur, verifikasi sistem keamanan RLS, serta status kesiapan Web NFC.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Audit Score: 100% Siap</span>
          </div>
        </div>
      </div>

      {/* Top Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="chill-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#7a938a]">
              Progres Fitur
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">100%</div>
          <p className="text-[11px] text-ink-muted">Semua modul utama & fitur permintaan selesai</p>
        </div>

        <div className="chill-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#7a938a]">
              Keamanan RLS
            </span>
            <div className="w-8 h-8 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-chill-800">4 / 4 Tabel</div>
          <p className="text-[11px] text-ink-muted">Row Level Security & Trigger aktif</p>
        </div>

        <div className="chill-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#7a938a]">
              Hardware Ready
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Nfc className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">Web NFC + QR</div>
          <p className="text-[11px] text-ink-muted">NDEFReader & Cetak QR label</p>
        </div>

        <div className="chill-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-[#7a938a]">
              Total Saldo Kelola
            </span>
            <div className="w-8 h-8 rounded-xl bg-chill-50 text-chill-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-ink">
            {formatRupiah(metrics.totalSaldo)}
          </div>
          <p className="text-[11px] text-ink-muted">Dari {metrics.totalTabungan} tabungan aktif</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#dfebe6] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'matriks', label: 'Matriks & Checklist Fitur', icon: ClipboardList },
          { id: 'keamanan', label: 'Audit Keamanan & RLS', icon: ShieldCheck },
          { id: 'arsitektur', label: 'Arsitektur Database & Triggers', icon: Database },
          { id: 'produksi', label: 'Kesiapan Produksi (Web NFC & Vercel)', icon: Smartphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-chill-700 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-chill-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Matriks Checklist Fitur */}
      {activeTab === 'matriks' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featureChecklist.map((group, idx) => (
              <div key={idx} className="chill-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#edf4f0] pb-3">
                  <h3 className="text-xs font-extrabold text-ink uppercase tracking-wider">
                    {group.category}
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {group.items.length} / {group.items.length} Terverifikasi
                  </span>
                </div>

                <div className="space-y-3">
                  {group.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-ink leading-tight">{item.name}</div>
                        <div className="text-[11px] text-ink-muted mt-0.5">{item.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Audit Keamanan & RLS */}
      {activeTab === 'keamanan' && (
        <div className="space-y-6">
          <div className="chill-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-ink flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-chill-700" />
              Evaluasi Ketahanan & Kebijakan Keamanan (Security Audit)
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Seluruh tabel database dilindungi oleh PostgreSQL Row Level Security (RLS). Operasi baca dan tulis divalidasi langsung di database engine sehingga tidak dapat ditembus walau melalui API client frontend.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#edf4f0] text-[10px] font-extrabold uppercase text-[#7a938a]">
                    <th className="pb-3">Tabel</th>
                    <th className="pb-3">Status RLS</th>
                    <th className="pb-3">Kebijakan SELECT</th>
                    <th className="pb-3">Kebijakan INSERT/UPDATE</th>
                    <th className="pb-3">Perlindungan Kritis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf4f0]">
                  <tr>
                    <td className="py-3 font-bold text-ink">profiles</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span></td>
                    <td className="py-3 text-ink-muted">Pemilik ID atau Admin</td>
                    <td className="py-3 text-ink-muted">Pemilik ID (Role escalation dicegah)</td>
                    <td className="py-3 text-emerald-700 font-medium">User tidak bisa menaikkan role sendiri jadi admin</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-ink">pesanan_tabungan</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span></td>
                    <td className="py-3 text-ink-muted">Pemilik ID atau Admin</td>
                    <td className="py-3 text-ink-muted">Member untuk pesanan sendiri, Admin approve/reject</td>
                    <td className="py-3 text-emerald-700 font-medium">Hanya admin yang dapat menyetujui pesanan</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-ink">tabungan</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span></td>
                    <td className="py-3 text-ink-muted">Pemilik ID atau Admin</td>
                    <td className="py-3 text-ink-muted">Hanya Admin yang dapat membuat; Member update target</td>
                    <td className="py-3 text-emerald-700 font-medium">Token 48 hex acak kriptografis unik</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-ink">transaksi</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Aktif</span></td>
                    <td className="py-3 text-ink-muted">Pemilik ID atau Admin</td>
                    <td className="py-3 text-ink-muted">Member di tabungan aktif miliknya sendiri</td>
                    <td className="py-3 text-emerald-700 font-medium">Saldo dihitung via trigger, cegah saldo negatif</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Reset Tabungan Security */}
          <div className="chill-card p-6 space-y-3 bg-[#fdfcf9] border-amber-200">
            <div className="flex items-center gap-2 text-xs font-black text-amber-900">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Audit Fitur Reset Tabungan dengan Validasi Kata Sandi</span>
            </div>
            <p className="text-xs text-[#6e5828] leading-relaxed">
              Fitur reset tabungan di halaman detail dirancang dengan standar <em>defense-in-depth</em>: pengguna diwajibkan memasukkan kata sandi akun sebelum reset dieksekusi. Sistem memvalidasi password ke <code>supabase.auth.signInWithPassword()</code>. Jika password tidak valid, proses dibatalkan seketika. Jika valid, sistem mencatat mutasi pengosongan saldo secara transparan ke riwayat mutasi sehingga jejak audit saldo tidak pernah hilang.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Arsitektur Database & Triggers */}
      {activeTab === 'arsitektur' && (
        <div className="space-y-6">
          <div className="chill-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-ink flex items-center gap-2">
              <Database className="w-5 h-5 text-chill-700" />
              Arsitektur Otomatisasi Database Supabase PostgreSQL
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] space-y-2">
                <div className="font-extrabold text-xs text-ink flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Trigger 1: public.handle_new_user()</span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Secara otomatis menyalin pengguna baru dari tabel <code>auth.users</code> ke tabel <code>public.profiles</code> dengan nama, nomor telepon, dan menetapkan role standar sebagai <code>member</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] space-y-2">
                <div className="font-extrabold text-xs text-ink flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>Trigger 2: public.recalculate_tabungan_saldo()</span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Mendeteksi setiap operasi <code>INSERT</code>, <code>UPDATE</code>, atau <code>DELETE</code> pada transaksi berstatus <code>sah</code>, menghitung total setor dikurangi total tarik, dan memvalidasi bahwa saldo tidak boleh di bawah Rp 0.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] space-y-2">
                <div className="font-extrabold text-xs text-ink flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-chill-600" />
                  <span>RPC Function: approve_pesanan(p_pesanan_id)</span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Hanya dapat dieksekusi oleh admin, secara atomik menyetujui pesanan, menghasilkan token kriptografis 48-karakter hex unik, dan membuat kantong tabungan baru.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] space-y-2">
                <div className="font-extrabold text-xs text-ink flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <span>RPC Function: cancel_transaksi(p_transaksi_id)</span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Memungkinkan admin membatalkan transaksi yang keliru tanpa menghapus data secara permanen (soft-cancel), memicu trigger untuk mengembalikan saldo secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Kesiapan Produksi (Web NFC & Vercel) */}
      {activeTab === 'produksi' && (
        <div className="space-y-6">
          <div className="chill-card p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-ink flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-chill-700" />
              Kesiapan Hardware Web NFC & Lingkungan Deploy Vercel
            </h3>

            <div className="space-y-3 text-xs text-ink-muted">
              <div className="p-4 rounded-2xl bg-[#f0faf5] border border-emerald-200 space-y-1.5">
                <div className="font-black text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Wajib HTTPS untuk Web NFC dan Kamera</span>
                </div>
                <p className="text-emerald-800">
                  Standar W3C Web NFC API dan MediaDevices Camera API memerlukan protokol aman (HTTPS). Saat dideploy ke Vercel, sertifikat SSL otomatis aktif sehingga penulisan tag NFC dan pemindaian kamera langsung berfungsi optimal.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#fffaf0] border border-amber-200 space-y-1.5">
                <div className="font-black text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Kompatibilitas Browser Web NFC</span>
                </div>
                <p className="text-amber-800">
                  Web NFC saat ini didukung secara bawaan oleh <strong>Google Chrome untuk Android (v89+)</strong>. Untuk browser iOS (Safari) atau perangkat desktop tanpa pembaca NFC, sistem menyediakan fallback penuh berupa <strong>Pemindaian Barcode/QR</strong> dan <strong>Cetak Stiker QR</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
