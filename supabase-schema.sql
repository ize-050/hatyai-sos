-- Create enum types
CREATE TYPE help_type AS ENUM ('food', 'medical', 'evacuation', 'boat');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'resolved');
CREATE TYPE update_type AS ENUM ('info', 'warning', 'success');

-- Create SOS Requests table
CREATE TABLE sos_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  phone TEXT NOT NULL,
  help_type help_type NOT NULL,
  severity severity_level NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  photo_url TEXT,
  status request_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Updates table
CREATE TABLE updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  type update_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sos_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Allow public read access" ON sos_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON sos_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON updates FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON updates FOR INSERT WITH CHECK (true);

-- Insert sample data
INSERT INTO updates (message, type) VALUES
  ('ศูนย์อพยพโรงเรียนหาดใหญ่วิทยาลัย เปิดรับผู้ประสบภัยแล้ว', 'info'),
  ('แจ้งเตือน: ระดับน้ำคลองอู่ตะเภาเพิ่มสูงขึ้น 50 ซม.', 'warning'),
  ('ทีมกู้ภัยช่วยเหลือผู้ประสบภัยแล้ว 45 ครัวเรือน', 'success'),
  ('เปิดรับบริจาคสิ่งของที่ศาลากลางจังหวัดสงขลา', 'info');

INSERT INTO sos_requests (name, phone, help_type, severity, description, latitude, longitude, status) VALUES
  ('สมชาย วงศ์ไทย', '081-234-5678', 'evacuation', 'high', 'น้ำท่วมสูง 2 เมตร ต้องการเรือช่วยเหลือด่วน มีผู้สูงอายุ 2 คน', 7.0086, 100.4747, 'pending'),
  ('มาลี สุขใจ', '089-876-5432', 'medical', 'high', 'ต้องการยาเบาหวานและยาความดัน หมดแล้ว', 7.0120, 100.4680, 'pending'),
  ('วิชัย ดีมาก', '086-111-2222', 'food', 'medium', 'ครอบครัว 5 คน ต้องการอาหารและน้ำดื่ม', 7.0050, 100.4800, 'in_progress'),
  ('สุดา รักดี', '087-333-4444', 'boat', 'medium', 'ต้องการเรือเพื่อเดินทางไปซื้อของ', 7.0200, 100.4650, 'pending'),
  ('ประยุทธ์ ใจดี', '088-555-6666', 'food', 'low', 'ต้องการอาหารเสริมสำหรับเด็กทารก', 6.9980, 100.4720, 'resolved');
