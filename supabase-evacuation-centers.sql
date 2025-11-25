-- Create Evacuation Centers table
CREATE TABLE evacuation_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  capacity INTEGER DEFAULT 0,
  current_occupancy INTEGER DEFAULT 0,
  contact_phone TEXT,
  contact_name TEXT,
  
  -- Facilities
  has_food BOOLEAN DEFAULT false,
  has_water BOOLEAN DEFAULT false,
  has_medical BOOLEAN DEFAULT false,
  has_electricity BOOLEAN DEFAULT false,
  has_toilet BOOLEAN DEFAULT false,
  has_shower BOOLEAN DEFAULT false,
  has_bedding BOOLEAN DEFAULT false,
  has_wifi BOOLEAN DEFAULT false,
  accepts_pets BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'closed')),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE evacuation_centers ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access" ON evacuation_centers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON evacuation_centers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON evacuation_centers FOR UPDATE USING (true);

-- Insert sample evacuation centers in Hatyai
INSERT INTO evacuation_centers (name, address, latitude, longitude, capacity, current_occupancy, contact_phone, contact_name, has_food, has_water, has_medical, has_electricity, has_toilet, has_shower, has_bedding, has_wifi, accepts_pets, status, notes) VALUES
  ('โรงเรียนหาดใหญ่วิทยาลัย', 'ถ.เพชรเกษม อ.หาดใหญ่', 7.0120, 100.4720, 500, 120, '074-234567', 'ผอ.สมศักดิ์', true, true, true, true, true, true, true, true, false, 'open', 'รับผู้อพยพตลอด 24 ชม.'),
  ('วัดโคกสมานคุณ', 'ถ.นิพัทธ์อุทิศ 1 อ.หาดใหญ่', 7.0050, 100.4680, 200, 180, '074-345678', 'พระครูสมาน', true, true, false, true, true, false, true, false, true, 'open', 'รับสัตว์เลี้ยงได้'),
  ('ศาลาประชาคม อ.หาดใหญ่', 'ถ.ศรีภูวนารถ อ.หาดใหญ่', 7.0086, 100.4747, 300, 300, '074-456789', 'นายอำเภอ', true, true, true, true, true, true, true, true, false, 'full', 'เต็มแล้ว กรุณาไปศูนย์อื่น'),
  ('โรงเรียนหาดใหญ่วิทยาลัย 2', 'ถ.กาญจนวนิช อ.หาดใหญ่', 7.0200, 100.4800, 400, 50, '074-567890', 'ผอ.วิชัย', true, true, false, true, true, true, true, false, false, 'open', 'เปิดใหม่ ยังรับได้อีกมาก'),
  ('มัสยิดกลางหาดใหญ่', 'ถ.นิพัทธ์อุทิศ 3 อ.หาดใหญ่', 6.9980, 100.4650, 150, 0, '074-678901', 'อิหม่ามยูซุฟ', true, true, false, true, true, false, false, false, false, 'closed', 'ปิดปรับปรุง');
