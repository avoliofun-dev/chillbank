import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatTanggal } from '../../utils/format';
import {
  Users,
  ShieldCheck,
  User,
  Phone,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function MemberList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const loadMembers = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error loadMembers:', err);
      setErrorMsg(err.message || 'Gagal memuat daftar member.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-chill-700">
            PENGGUNA TERDAFTAR
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Daftar Anggota Keluarga
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Daftar seluruh akun member dan admin yang terdaftar di Chill Bank Family.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-full bg-chill-100 text-chill-800 text-xs font-bold w-fit">
          {members.length} Akun Terdaftar
        </div>
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
            <p className="text-xs">Memuat daftar anggota...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center text-xs text-ink-muted">
            Belum ada member terdaftar.
          </div>
        ) : (
          <div className="divide-y divide-[#edf4f0]">
            {members.map((m) => (
              <div key={m.id} className="py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                      m.role === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-chill-100 text-chill-700'
                    }`}
                  >
                    {m.role === 'admin' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-ink">{m.nama}</h3>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          m.role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-chill-100 text-chill-800'
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {m.no_hp || 'Tanpa No HP'}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Bergabung {formatTanggal(m.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-ink-muted font-mono hidden sm:block">
                  ID: {m.id.slice(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

