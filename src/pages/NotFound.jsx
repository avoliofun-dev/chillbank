import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="text-6xl font-black text-chill-700">404</div>
      <h1 className="text-xl font-bold text-ink">Halaman Tidak Ditemukan</h1>
      <p className="text-xs text-ink-muted max-w-sm">
        Halaman yang Anda tuju mungkin telah dipindahkan atau tautan yang dimasukkan tidak valid.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-chill-600 text-white hover:bg-chill-700 transition-all shadow-md"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </Link>
    </div>
  );
}

