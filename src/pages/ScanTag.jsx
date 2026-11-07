import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine,
  Nfc,
  Camera,
  Keyboard,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function ScanTag() {
  const navigate = useNavigate();

  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcStatus, setNfcStatus] = useState('Tekan tombol untuk mulai membaca NFC tag.');
  const [nfcError, setNfcError] = useState('');

  // Manual token input
  const [manualInput, setManualInput] = useState('');

  // Camera QR Scanner
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const qrScannerRef = useRef(null);

  useEffect(() => {
    // Periksa ketersediaan Web NFC API
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcSupported(true);
    } else {
      setNfcSupported(false);
      setNfcStatus('Browser atau perangkat ini belum mendukung Web NFC API.');
    }

    return () => {
      // Cleanup camera scanner if active
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const parseToken = (input) => {
    if (!input) return null;
    let raw = input.trim();
    if (raw.includes('#t=')) {
      raw = raw.split('#t=')[1].split(/[&?#\s]/)[0];
    } else if (raw.includes('/t/')) {
      raw = raw.split('/t/')[1].split(/[&?#\s]/)[0];
    }
    return raw;
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const token = parseToken(manualInput);
    if (!token) {
      alert('Format token atau URL tidak valid.');
      return;
    }
    navigate(`/t/${token}`);
  };

  const handleStartNfc = async () => {
    setNfcError('');
    setNfcScanning(true);
    setNfcStatus('Meminta izin NFC dari browser...');

    try {
      if (!window.isSecureContext) {
        throw new Error('Web NFC mewajibkan protokol HTTPS yang aman.');
      }

      const ndef = new window.NDEFReader();
      await ndef.scan();
      setNfcStatus('Pemindai NFC aktif! Tempelkan tag ke bagian belakang HP Anda.');

      ndef.onreadingerror = () => {
        setNfcError('Tag NFC terdeteksi tetapi tidak dapat dibaca. Coba ulangi atau gunakan tag NDEF lain.');
      };

      ndef.onreading = (event) => {
        try {
          let found = '';
          for (const record of event.message.records) {
            if (record.recordType === 'url') {
              found = typeof record.data === 'string' ? record.data : new TextDecoder().decode(record.data);
              break;
            }
            if (record.recordType === 'text') {
              found = new TextDecoder().decode(record.data);
              break;
            }
          }

          if (!found) {
            setNfcError('Tag terbaca tetapi tidak berisi URL / token yang valid.');
            return;
          }

          const token = parseToken(found);
          if (token) {
            setNfcStatus('Tag berhasil dibaca! Mengalihkan ke tabungan...');
            setTimeout(() => {
              navigate(`/t/${token}`);
            }, 500);
          } else {
            setNfcError('Tag terbaca namun token tabungan tidak ditemukan.');
          }
        } catch (err) {
          setNfcError('Gagal memproses isi tag NFC: ' + err.message);
        }
      };
    } catch (err) {
      console.error('NFC error:', err);
      setNfcScanning(false);
      setNfcError(err.message || 'Gagal memulai pembaca NFC. Periksa izin situs dan aktifkan NFC.');
      setNfcStatus('Gagal memulai NFC.');
    }
  };

  const handleStartCamera = async () => {
    setCameraError('');
    setCameraActive(true);

    try {
      // Dynamic import Html5Qrcode
      const { Html5Qrcode } = await import('html5-qrcode');
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      qrScannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5QrCode.stop().then(() => {
            setCameraActive(false);
            const token = parseToken(decodedText);
            if (token) {
              navigate(`/t/${token}`);
            } else {
              setCameraError('QR Code tidak berisi URL tabungan yang valid.');
            }
          });
        },
        () => {}
      );
    } catch (err) {
      console.error('Camera QR error:', err);
      setCameraActive(false);
      setCameraError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  };

  const handleStopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().catch(() => {});
      qrScannerRef.current = null;
    }
    setCameraActive(false);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
          PEMINDAIAN TAG
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Buka Tabungan via NFC / QR
        </h1>
        <p className="text-xs text-ink-muted mt-0.5">
          Dekatkan HP ke kartu NFC tabungan atau pindai kode QR.
        </p>
      </div>

      {/* Metode 1: Web NFC Reader */}
      <div className="chill-card p-6 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-chill-700 to-chill-400 text-white flex items-center justify-center shadow-lg shadow-chill-600/20">
          <Nfc className="w-7 h-7" />
        </div>

        <div>
          <h2 className="text-base font-extrabold text-ink">Metode 1: Tap NFC Tag</h2>
          <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1">
            Tempelkan bagian belakang ponsel ke kartu atau stiker NFC tabungan Anda.
          </p>
        </div>

        <div className="p-3 bg-chill-50 border border-chill-200/60 rounded-xl text-xs text-chill-900 leading-relaxed font-medium">
          {nfcScanning ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-chill-600" />
              {nfcStatus}
            </span>
          ) : (
            nfcStatus
          )}
        </div>

        {nfcError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{nfcError}</span>
          </div>
        )}

        {nfcSupported ? (
          <button
            onClick={handleStartNfc}
            disabled={nfcScanning}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-chill-700 to-chill-500 shadow-md hover:from-chill-800 hover:to-chill-600 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Nfc className="w-4 h-4" />
            <span>{nfcScanning ? 'Pemindai NFC Aktif...' : 'Mulai Baca Tag NFC'}</span>
          </button>
        ) : (
          <div className="text-[11px] text-ink-muted bg-gray-50 p-2.5 rounded-xl border border-gray-200">
            ℹ️ Web NFC hanya didukung di <strong>Google Chrome Android</strong> melalui koneksi HTTPS. Gunakan kamera QR atau input manual di bawah jika menggunakan browser lain/iOS.
          </div>
        )}
      </div>

      {/* Metode 2: Kamera QR Scanner */}
      <div className="chill-card p-6 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-chill-100 text-chill-700 flex items-center justify-center">
          <Camera className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-base font-extrabold text-ink">Metode 2: Scan Kode QR</h2>
          <p className="text-xs text-ink-muted max-w-sm mx-auto mt-1">
            Gunakan kamera untuk memindai kode QR yang dicetak pada tabungan.
          </p>
        </div>

        {cameraError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        <div id="qr-reader-container" className={`overflow-hidden rounded-2xl ${cameraActive ? 'min-h-[260px]' : 'hidden'}`} />

        {cameraActive ? (
          <button
            onClick={handleStopCamera}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            Hentikan Kamera
          </button>
        ) : (
          <button
            onClick={handleStartCamera}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-chill-100 text-chill-800 hover:bg-chill-200 transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>Buka Kamera Scan QR</span>
          </button>
        )}
      </div>

      {/* Metode 3: Input Token Manual (Cadangan) */}
      <div className="chill-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-chill-600" />
          <h3 className="text-xs font-bold text-ink">Metode 3: Input Token / URL Manual</h3>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-3">
          <input
            type="text"
            required
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Tempel URL atau ketik token tabungan..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#dfebe6] bg-[#f9fcfa] text-base sm:text-xs text-ink focus:outline-none focus:border-chill-500 focus:ring-4 focus:ring-chill-100 transition-all font-mono"
          />

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#f1f6f4] text-ink hover:bg-chill-100 hover:text-chill-800 transition-colors"
          >
            Buka Tabungan
          </button>
        </form>
      </div>
    </div>
  );
}

