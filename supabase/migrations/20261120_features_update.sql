-- ==============================================================================
-- CHILL BANK FAMILY - MIGRATION UPDATE
-- 1. Menambahkan kolom target_nominal pada tabungan & policy update target/nama oleh member
-- 2. Menambahkan kolom active_session_id pada profiles untuk proteksi single-device session
-- ==============================================================================

-- 1. Tambah kolom target_nominal di tabel tabungan (jika belum ada)
ALTER TABLE public.tabungan
ADD COLUMN IF NOT EXISTS target_nominal NUMERIC CHECK (target_nominal IS NULL OR target_nominal > 0);

-- 2. Tambah kolom active_session_id di tabel profiles (jika belum ada)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_session_id TEXT;

-- 3. Kebijakan RLS agar member dapat memperbarui data tabungannya sendiri (nama & target)
DROP POLICY IF EXISTS "Member dapat mengupdate target nominal tabungan miliknya" ON public.tabungan;
CREATE POLICY "Member dapat mengupdate target nominal tabungan miliknya"
  ON public.tabungan FOR UPDATE
  USING (auth.uid() = member_id OR public.is_admin())
  WITH CHECK (auth.uid() = member_id OR public.is_admin());

-- 4. Kebijakan RLS agar member dapat memperbarui target nominal pesanan tabungannya sendiri
DROP POLICY IF EXISTS "Member dapat mengupdate target nominal pesanan miliknya" ON public.pesanan_tabungan;
CREATE POLICY "Member dapat mengupdate target nominal pesanan miliknya"
  ON public.pesanan_tabungan FOR UPDATE
  USING (auth.uid() = member_id OR public.is_admin())
  WITH CHECK (auth.uid() = member_id OR public.is_admin());
