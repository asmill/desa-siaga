-- Tambahkan kolom mitra_category pada tabel profiles 
-- (Babinsa, Kamtibmas, Klinik, Kader, Pemadam, Bidan, Linmas)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mitra_category text;

-- (Opsional) Beri dummy seed data jika ada user Mitra sebelumnya
UPDATE public.profiles SET mitra_category = 'Linmas' WHERE role = 'Mitra';

-- (Opsional) Mengirim data role baru untuk testing:
INSERT INTO public.profiles (phone, full_name, role, password, is_verified, mitra_category) VALUES 
('089000000001', 'Bapak Babinsa', 'Mitra', '12345678', true, 'Babinsa'),
('089000000002', 'Bapak Kamtibmas', 'Mitra', '12345678', true, 'Kamtibmas'),
('089000000003', 'Klinik Sehat', 'Mitra', '12345678', true, 'Klinik'),
('089000000004', 'Kader Posyandu', 'Mitra', '12345678', true, 'Kader'),
('089000000005', 'Tim Pemadam', 'Mitra', '12345678', true, 'Pemadam'),
('089000000006', 'Ibu Bidan', 'Mitra', '12345678', true, 'Bidan'),
('089000000007', 'Satuan Linmas', 'Mitra', '12345678', true, 'Linmas')
ON CONFLICT (phone) DO NOTHING;
