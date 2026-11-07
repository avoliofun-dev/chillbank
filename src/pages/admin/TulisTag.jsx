import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { formatRupiah, formatTanggal } from '../../utils/format';
import {
  Nfc,
  QrCode,
  Printer,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  Download,
  Image as ImageIcon,
} from 'lucide-react';

export default function TulisTag() {
  const { id } = useParams();

  const [tabungan, setTabungan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // NFC Status
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcWriting, setNfcWriting] = useState(false);
  const [nfcSuccess, setNfcSuccess] = useState('');
  const [nfcError, setNfcError] = useState('');

  const loadTabungan = async () => {
    if (!id) return;
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
          created_at,
          member:member_id (nama, no_hp)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTabungan(data);
    } catch (err) {
      console.error('Error loadTabungan:', err);
      setErrorMsg(err.message || 'Gagal memuat detail tabungan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabungan();

    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true);
    } else {
      setNfcSupported(false);
    }
  }, [id]);

  const tagUrl = tabungan
    ? `${window.location.origin}/t/${tabungan.token}`
    : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(tagUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Gagal menyalin ke clipboard.');
    }
  };

  const markTagWritten = async () => {
    try {
      const { error } = await supabase
        .from('tabungan')
        .update({ tag_ditulis: true })
        .eq('id', tabungan.id);

      if (error) throw error;
      setTabungan((prev) => ({ ...prev, tag_ditulis: true }));
    } catch (err) {
      console.error('Error markTagWritten:', err);
    }
  };

  const handleWriteNfc = async () => {
    setNfcError('');
    setNfcSuccess('');
    setNfcWriting(true);

    try {
      if (!window.isSecureContext) {
        throw new Error('Halaman belum HTTPS. Web NFC hanya dapat bekerja pada koneksi HTTPS yang aman.');
      }

      if (!('NDEFReader' in window)) {
        throw new Error('Web NFC tidak didukung oleh browser ini. Gunakan Google Chrome pada perangkat Android terbaru.');
      }

      // Check permission if supported
      if (navigator.permissions?.query) {
        try {
          const perm = await navigator.permissions.query({ name: 'nfc' });
          if (perm.state === 'denied') {
            throw new Error('Izin akses NFC ditolak di browser. Buka setelan izin Chrome untuk mengaktifkannya.');
          }
        } catch (e) {
          if (e.message.includes('Izin')) throw e;
        }
      }

      const writer = new window.NDEFReader();
      await writer.write(
        {
          records: [
            {
              recordType: 'url',
              data: tagUrl,
            },
          ],
        },
        { overwrite: true }
      );

      await markTagWritten();
      setNfcSuccess('Berhasil menulis URL tabungan ke NFC tag! Kartu/stiker siap digunakan member.');
    } catch (err) {
      console.error('NFC write error:', err);
      setNfcError(err.message || 'Gagal menulis ke tag NFC. Periksa apakah NFC ponsel menyala.');
    } finally {
      setNfcWriting(false);
    }
  };

  // Unduh Gambar QR Code dalam Format PNG Resolusi Tinggi
  const handleDownloadPng = () => {
    if (!tabungan) return;
    setDownloading(true);

    try {
      const qrCanvas = document.getElementById('qr-canvas-hidden');
      if (!qrCanvas) {
        throw new Error('Elemen QR Canvas belum siap.');
      }

      const card = document.createElement('canvas');
      const width = 640;
      const height = 820;
      card.width = width;
      card.height = height;
      const ctx = card.getContext('2d');

      // 1. Background Kartu
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 2. Header Gradient Banner
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, '#103f3d');
      grad.addColorStop(0.5, '#14765e');
      grad.addColorStop(1, '#25a889');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, 140);

      // Brand Title di Banner
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CHILL BANK FAMILY', width / 2, 60);

      ctx.fillStyle = '#d6f5e9';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('KARTU RESMI TABUNGAN MANDIRI', width / 2, 95);

      // 3. Info Tabungan & Pemilik
      ctx.fillStyle = '#142d2b';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(tabungan.nama, width / 2, 195);

      ctx.fillStyle = '#557268';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Milik: ${tabungan.member?.nama || 'Member Keluarga'}`, width / 2, 230);

      // 4. Bingkai QR Code
      const qrSize = 360;
      const qrX = (width - qrSize) / 2;
      const qrY = 265;

      ctx.fillStyle = '#f8faf9';
      ctx.strokeStyle = '#e2eeea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 24);
      ctx.fill();
      ctx.stroke();

      // Gambar QR Canvas di tengah
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // 5. Token Box & Petunjuk di Bawah
      ctx.fillStyle = '#557268';
      ctx.font = '13px monospace';
      ctx.fillText(`Token: ${tabungan.token.slice(0, 20)}...`, width / 2, 690);

      ctx.fillStyle = '#146b57';
      ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Pindai dengan kamera HP atau tap NFC di Chill Bank', width / 2, 735);

      // 6. Border Luar Kartu
      ctx.strokeStyle = '#d5e6df';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, width - 8, height - 8);

      // Trigger Unduh File PNG
      const dataUrl = card.toDataURL('image/png');
      const link = document.createElement('a');
      const cleanName = tabungan.nama.replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `QR_${cleanName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      markTagWritten();
    } catch (err) {
      console.error('Gagal unduh PNG:', err);
      alert('Gagal membuat gambar PNG: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrintQr = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-ink-muted gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-chill-600" />
        <p className="text-xs">Memuat informasi tag tabungan...</p>
      </div>
    );
  }

  if (!tabungan) {
    return (
      <div className="chill-card p-8 text-center max-w-lg mx-auto space-y-4 my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-extrabold text-ink">Tabungan Tidak Ditemukan</h2>
        <Link
          to="/admin/tabungan"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-chill-600 text-white"
        >
          Kembali ke Daftar Tabungan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Hidden QRCodeCanvas khusus untuk generator unduhan PNG */}
      <div className="hidden" aria-hidden="true">
        <QRCodeCanvas
          id="qr-canvas-hidden"
          value={tagUrl}
          size={500}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* Header & Back */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/admin/tabungan"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-chill-700 hover:text-chill-800"
        >
          <ArrowLeft className="w-4 h-4" /> Daftar Tabungan
        </Link>
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
            tabungan.tag_ditulis
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {tabungan.tag_ditulis ? 'Tag Sudah Ditulis' : 'Menunggu Penulisan Tag'}
        </span>
      </div>

      <div className="no-print">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
          PROGRAM TAG TABUNGAN
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Tulis Tag: {tabungan.nama}
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Milik member <strong>{tabungan.member?.nama || 'Member'}</strong> ({tabungan.member?.no_hp || '-'})
        </p>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 no-print">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Bagian 1: Web NFC Tag Writer */}
      <div className="chill-card p-6 space-y-4 no-print">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-chill-100 text-chill-700 flex items-center justify-center">
            <Nfc className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-ink">1. Tulis URL ke Kartu / Stiker NFC</h2>
            <p className="text-[11px] text-ink-muted">Tulis URL token langsung ke memori tag NDEF</p>
          </div>
        </div>

        {nfcSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{nfcSuccess}</span>
          </div>
        )}

        {nfcError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{nfcError}</span>
          </div>
        )}

        <div className="p-3.5 bg-chill-50 border border-chill-200/60 rounded-xl text-xs text-chill-900 leading-relaxed">
          📱 <strong>Petunjuk Admin:</strong> Dekatkan bagian belakang ponsel Android yang menyala NFC-nya ke kartu atau stiker NFC kosong setelah menekan tombol di bawah.
        </div>

        {nfcSupported ? (
          <button
            onClick={handleWriteNfc}
            disabled={nfcWriting}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-chill-700 to-chill-500 shadow-md hover:from-chill-800 hover:to-chill-600 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {nfcWriting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mendekatkan... Tempelkan Tag NFC Sekarang!</span>
              </>
            ) : (
              <>
                <Nfc className="w-4 h-4" />
                <span>Mulai Tulis ke Tag NFC</span>
              </>
            )}
          </button>
        ) : (
          <div className="text-[11px] text-ink-muted bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1">
            <strong>Catatan Batasan Perangkat:</strong> Web NFC API hanya didukung di <strong>Google Chrome Android</strong> melalui HTTPS. Buka halaman admin ini dari HP Android untuk menulis NFC langsung, atau unduh gambar Kode QR di bawah ini.
          </div>
        )}
      </div>

      {/* Bagian 2: QR Code PNG Download & Cetak */}
      <div className="chill-card p-6 space-y-5 print:shadow-none print:border-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-chill-100 text-chill-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-ink">2. Kode QR Tabungan (Siap Unduh & Cetak)</h2>
              <p className="text-[11px] text-ink-muted">Simpan sebagai gambar PNG atau cetak untuk ditempelkan pada celengan</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPng}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Unduh Gambar PNG</span>
            </button>

            <button
              onClick={handlePrintQr}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#f1f6f4] text-ink hover:bg-chill-100 hover:text-chill-800 transition-colors"
              title="Cetak langsung lewat printer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak</span>
            </button>
          </div>
        </div>

        {/* QR Render Container (Print-Friendly) */}
        <div className="text-center p-6 bg-white border border-[#e2eeea] rounded-2xl print:border-2 print:border-black print:p-8">
          <div className="hidden print:block mb-4 text-center">
            <h1 className="text-2xl font-black text-black">CHILL BANK FAMILY</h1>
            <p className="text-base text-gray-800 font-bold mt-1">Kartu Tabungan: {tabungan.nama}</p>
            <p className="text-xs text-gray-600">Milik: {tabungan.member?.nama || 'Member'}</p>
          </div>

          <div className="inline-block p-4 bg-white rounded-2xl border border-gray-100 shadow-sm print:shadow-none print:border-none">
            <QRCodeSVG
              value={tagUrl}
              size={220}
              level="M"
              includeMargin={true}
              className="mx-auto"
            />
          </div>

          <div className="mt-4 text-[11px] font-mono text-ink-muted break-all max-w-md mx-auto p-2.5 rounded-xl bg-gray-50 border border-gray-200">
            {tagUrl}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 no-print">
            <button
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-chill-50 text-chill-800 hover:bg-chill-100 border border-chill-200 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Simpan Gambar (.PNG)</span>
            </button>

            <button
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-ink-muted hover:bg-gray-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Tersalin!' : 'Salin URL'}</span>
            </button>

            {!tabungan.tag_ditulis && (
              <button
                onClick={markTagWritten}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tandai Tag Sudah Ditulis</span>
              </button>
            )}
          </div>

          <p className="text-[10px] text-ink-muted mt-3 no-print">
            💡 <strong>Rekomendasi:</strong> Klik tombol <strong>Unduh Gambar PNG</strong> untuk mendapatkan gambar kartu tabungan beresolusi tinggi yang bisa dicetak, dilaminasi, atau dikirimkan ke anggota keluarga.
          </p>
        </div>
      </div>
    </div>
  );
}
