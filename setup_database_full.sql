-- 1. Buat Tabel Profiles (Data Pengguna) dengan kolom tambahan 'password'
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text UNIQUE NOT NULL,
  role text DEFAULT 'Masyarakat',
  full_name text,
  password text,
  ktp text,
  gender text,
  address text,
  dusun text,
  rt text,
  rw text,
  lat double precision,
  lng double precision,
  photo_url text,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Buat Tabel SOS Events (Riwayat Darurat)
CREATE TABLE IF NOT EXISTS public.sos_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES public.profiles(id),
  patient_name text,
  patient_lat double precision,
  patient_lng double precision,
  emergency_type text,
  location_method text,
  driver_id uuid REFERENCES public.profiles(id),
  driver_name text,
  status text DEFAULT 'PENDING',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Mengaktifkan Realtime untuk kedua tabel agar UI web bergerak asinkron 
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.sos_events;

-- 4. Set RLS (Row Level Security) ke PUBLIC agar API gampang diakses
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for users" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for events" ON public.sos_events;

CREATE POLICY "Enable all for users" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for events" ON public.sos_events FOR ALL USING (true) WITH CHECK (true);

-- 5. Masukkan Data Staf / Petugas (Seed Data)
DELETE FROM public.profiles WHERE phone IN ('080000000001', '080000000002', '080000000003', '080000000004', '080000000005', '080000000006');

INSERT INTO public.profiles (phone, full_name, role, password, is_verified) VALUES 
('080000000001', 'Bapak Admin Pusat', 'Admin', '12345678', true),
('080000000002', 'Ibu DPMD', 'DPMD', '12345678', true),
('080000000003', 'Pak Kades (PEMDES)', 'PEMDES', '12345678', true),
('080000000004', 'Supardi (Supir)', 'Supir', '12345678', true),
('080000000005', 'Relawan Siaga', 'Relawan', '12345678', true),
('080000000006', 'Mitra Medis', 'Mitra', '12345678', true);
