import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LogOut, AlertTriangle, X, ShieldAlert } from 'lucide-react';

const AuthContext = createContext({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isAdmin: false,
  isMember: false,
  isConfigured: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => {},
  updatePassword: async () => {},
  requestLogout: () => {},
  cancelLogout: () => {},
  confirmLogout: async () => {},
});

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 Jam tidak ada aktivitas

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Modal Konfirmasi Keluar
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Ambil data profile dari tabel profiles
  const fetchProfile = async (userId) => {
    if (!userId || !isSupabaseConfigured) {
      setProfile(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Gagal mengambil profil:', error.message);
        return null;
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error fetchProfile:', err);
      return null;
    }
  };

  // Buat atau dapatkan session ID unik perangkat ini
  const getOrCreateDeviceId = () => {
    let deviceId = localStorage.getItem('chill_session_id');
    if (!deviceId) {
      deviceId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('chill_session_id', deviceId);
    }
    return deviceId;
  };

  // Sinkronkan active_session_id ke database saat login/memuat
  const syncSessionIdToDatabase = async (userId) => {
    if (!userId || !isSupabaseConfigured) return;
    const deviceId = getOrCreateDeviceId();
    try {
      await supabase
        .from('profiles')
        .update({ active_session_id: deviceId })
        .eq('id', userId);
    } catch (e) {
      // Abaikan jika kolom belum tersedia
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Ambil session awal
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id).finally(() => setLoading(false));
        syncSessionIdToDatabase(initialSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Dengarkan perubahan status otentikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ==============================================================================
  // 3. AUTO-LOGOUT JIKA TIDAK ADA AKTIVITAS SELAMA 1 JAM
  // ==============================================================================
  useEffect(() => {
    if (!user) return;

    // Catat waktu aktivitas awal
    if (!localStorage.getItem('chill_last_active')) {
      localStorage.setItem('chill_last_active', Date.now().toString());
    }

    let lastThrottle = 0;
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastThrottle > 4000) { // Throttle tiap 4 detik
        lastThrottle = now;
        localStorage.setItem('chill_last_active', now.toString());
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    const checkInactivity = () => {
      const lastActive = parseInt(localStorage.getItem('chill_last_active') || '0', 10);
      if (lastActive && Date.now() - lastActive > INACTIVITY_TIMEOUT_MS) {
        // Otomatis logout karena timeout 1 jam
        signOut().finally(() => {
          window.location.href = '/login?reason=inactivity';
        });
      }
    };

    // Periksa setiap 20 detik
    const timer = setInterval(checkInactivity, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user]);

  // ==============================================================================
  // 4. DETEKSI LOGIN DI PERANGKAT LAIN (SINGLE DEVICE SESSION ENFORCEMENT)
  // ==============================================================================
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const deviceId = getOrCreateDeviceId();

    // 4.1 Dengarkan Supabase Realtime channel jika profile.active_session_id berubah
    const channel = supabase
      .channel(`profile-session-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newSessionId = payload.new?.active_session_id;
          const currentDeviceSession = localStorage.getItem('chill_session_id');
          if (newSessionId && currentDeviceSession && newSessionId !== currentDeviceSession) {
            // Perangkat lain telah login!
            signOut().finally(() => {
              window.location.href = '/login?reason=multi_device';
            });
          }
        }
      )
      .subscribe();

    // 4.2 Polling cadangan berkala setiap 25 detik (jika websocket terputus)
    const pollInterval = setInterval(async () => {
      try {
        const currentDeviceSession = localStorage.getItem('chill_session_id');
        if (!currentDeviceSession) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('active_session_id')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data?.active_session_id && data.active_session_id !== currentDeviceSession) {
          // Terdeteksi login di perangkat lain
          signOut().finally(() => {
            window.location.href = '/login?reason=multi_device';
          });
        }
      } catch (err) {
        // Abaikan jika network error sementara
      }
    }, 25000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user]);

  // ==============================================================================
  // 5. AUTH METHODS
  // ==============================================================================
  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi. Silakan periksa file .env.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    if (data?.user) {
      // Buat session ID baru untuk login ini (menendang perangkat lama)
      const newDeviceId = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('chill_session_id', newDeviceId);
      localStorage.setItem('chill_last_active', Date.now().toString());

      try {
        await supabase
          .from('profiles')
          .update({ active_session_id: newDeviceId })
          .eq('id', data.user.id);
      } catch (e) {
        // Abaikan jika kolom belum ada
      }

      await fetchProfile(data.user.id);
    }
    return data;
  };

  const signUp = async ({ email, password, nama, no_hp }) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi. Silakan periksa file .env.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama,
          no_hp,
          role: 'member',
        },
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    localStorage.removeItem('chill_session_id');
    localStorage.removeItem('chill_last_active');
  };

  // Trigger modal konfirmasi keluar
  const requestLogout = () => {
    setShowLogoutModal(true);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    if (user?.id) {
      return await fetchProfile(user.id);
    }
  };

  const updateProfile = async ({ nama, no_hp }) => {
    if (!user) throw new Error('Pengguna belum login.');
    const { data, error } = await supabase
      .from('profiles')
      .update({ nama, no_hp })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    // Sinkronkan ke auth user_metadata
    await supabase.auth.updateUser({
      data: { nama, no_hp },
    });
    setProfile(data);
    return data;
  };

  const updatePassword = async (newPassword) => {
    if (!user) throw new Error('Pengguna belum login.');
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  };

  const isAdmin = profile?.role === 'admin';
  const isMember = profile?.role === 'member' || (!isAdmin && !!user);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        isAdmin,
        isMember,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
        updatePassword,
        requestLogout,
        cancelLogout,
        confirmLogout,
      }}
    >
      {children}

      {/* ======================================================== */}
      {/* POPUP MODAL KONFIRMASI KELUAR (LOGOUT MODAL)             */}
      {/* ======================================================== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="chill-card p-6 max-w-sm w-full space-y-4 shadow-2xl border-rose-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <button
                onClick={cancelLogout}
                className="p-1 text-ink-muted hover:text-ink rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-ink">
                Keluar dari Akun?
              </h3>
              <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                Apakah Anda yakin ingin keluar dari <strong>Chill Bank Family</strong>? Sesi brankas digital Anda akan diakhiri demi keamanan.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={cancelLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold text-ink-muted hover:text-ink bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ya, Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
