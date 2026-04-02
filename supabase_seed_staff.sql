-- 1. Tambah kolom password ke tabel profiles (jika belum ada)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password text;

-- 2. Membersihkan data dummy (jika ada) menggunakan nomor yang sama agar tidak bentrok
DELETE FROM public.profiles WHERE phone IN ('080000000001', '080000000002', '080000000003', '080000000004', '080000000005', '080000000006');

-- 3. Memasukkan data pengguna Staff dengan password yang diminta
INSERT INTO public.profiles (phone, full_name, role, password, is_verified) VALUES 
('080000000001', 'Bapak Admin Pusat', 'Admin', '12345678', true),
('080000000002', 'Ibu DPMD', 'DPMD', '12345678', true),
('080000000003', 'Pak Kades (PEMDES)', 'PEMDES', '12345678', true),
('080000000004', 'Supardi (Supir)', 'Supir', '12345678', true),
('080000000005', 'Relawan Siaga', 'Relawan', '12345678', true),
('080000000006', 'Mitra Medis', 'Mitra', '12345678', true);

-- Info Akun Valid (Login dengan Nomor di bawah beserta password "12345678"):
-- Admin: 080000000001
-- DPMD: 080000000002
-- PEMDES: 080000000003
-- Supir: 080000000004
-- Relawan: 080000000005
-- Mitra: 080000000006
