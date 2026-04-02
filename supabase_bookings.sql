-- Tabel untuk Jadwal Peminjaman Ambulan Warga
CREATE TABLE IF NOT EXISTS public.ambulance_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  schedule_date DATE NOT NULL,
  schedule_time TIME NOT NULL,
  destination TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Data Permulaan (Biar tidak kosong saat dilihat Supir)
INSERT INTO public.ambulance_bookings (patient_name, phone, schedule_date, schedule_time, destination, status) VALUES
('Ibu Siti (Pemeriksaan Kehamilan)', '0812345678', CURRENT_DATE + interval '1 day', '09:00:00', 'RSUD Subang', 'APPROVED'),
('Bapak Dudung (Kontrol Fisioterapi)', '0813456789', CURRENT_DATE + interval '2 days', '13:00:00', 'Puskesmas Cikalong', 'PENDING');
