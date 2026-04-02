CREATE TABLE IF NOT EXISTS public.ambulances (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plate_number text UNIQUE NOT NULL,
  vehicle_name text NOT NULL,
  status text DEFAULT 'Active',
  driver_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for ambulances" ON public.ambulances;
CREATE POLICY "Enable all for ambulances" ON public.ambulances FOR ALL USING (true) WITH CHECK (true);

-- Seed Minimal
INSERT INTO public.ambulances (plate_number, vehicle_name) VALUES 
('B 1111 SIAGA', 'Ambulan Desa Utara - Unit 1'),
('C 9999 SEHAT', 'Ambulan Siaga Puskesmas');
