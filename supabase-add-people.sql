-- เพิ่มคอลัมน์สำหรับข้อมูลคนในครอบครัว
ALTER TABLE sos_requests ADD COLUMN has_children BOOLEAN DEFAULT false;
ALTER TABLE sos_requests ADD COLUMN has_elderly BOOLEAN DEFAULT false;
ALTER TABLE sos_requests ADD COLUMN has_disabled BOOLEAN DEFAULT false;
ALTER TABLE sos_requests ADD COLUMN has_pregnant BOOLEAN DEFAULT false;
ALTER TABLE sos_requests ADD COLUMN people_count INTEGER DEFAULT 1;

-- อัพเดทข้อมูลตัวอย่าง
UPDATE sos_requests SET has_elderly = true WHERE name = 'สมชาย วงศ์ไทย';
UPDATE sos_requests SET has_children = true WHERE name = 'ประยุทธ์ ใจดี';
