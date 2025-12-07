-- Insert sample missions for photo uploads and event participation
-- Balanced EXP rewards to make ranking up not too difficult

-- Photo Upload Missions
INSERT INTO "Mission" (id, title, description, "expReward", type, "isActive", "createdAt")
VALUES 
  (gen_random_uuid(), 'ช่างภาพมือใหม่', 'อัปโหลดรูปภาพครบ 5 รูป', 20, 'AUTO_PHOTO', true, NOW()),
  (gen_random_uuid(), 'ช่างภาพมือสมัครเล่น', 'อัปโหลดรูปภาพครบ 15 รูป', 40, 'AUTO_PHOTO', true, NOW()),
  (gen_random_uuid(), 'ช่างภาพมือโปร', 'อัปโหลดรูปภาพครบ 30 รูป', 60, 'AUTO_PHOTO', true, NOW()),
  (gen_random_uuid(), 'ช่างภาพระดับเทพ', 'อัปโหลดรูปภาพครบ 50 รูป', 100, 'AUTO_PHOTO', true, NOW());

-- Event Participation Missions
INSERT INTO "Mission" (id, title, description, "expReward", type, "isActive", "createdAt")
VALUES 
  (gen_random_uuid(), 'เข้าร่วมครั้งแรก', 'เข้าร่วมกิจกรรม 1 ครั้ง', 30, 'AUTO_JOIN', true, NOW()),
  (gen_random_uuid(), 'สมาชิกตัวจริง', 'เข้าร่วมกิจกรรม 3 ครั้ง', 50, 'AUTO_JOIN', true, NOW()),
  (gen_random_uuid(), 'ขาประจำ', 'เข้าร่วมกิจกรรม 5 ครั้ง', 80, 'AUTO_JOIN', true, NOW()),
  (gen_random_uuid(), 'ตัวพ่อของชมรม', 'เข้าร่วมกิจกรรม 10 ครั้ง', 120, 'AUTO_JOIN', true, NOW());

-- General Missions
INSERT INTO "Mission" (id, title, description, "expReward", type, "isActive", "createdAt")
VALUES 
  (gen_random_uuid(), 'ยินดีต้อนรับ', 'สมัครเป็นสมาชิกและเข้าสู่ระบบ', 10, 'MANUAL', true, NOW()),
  (gen_random_uuid(), 'แก้ไขรูปครบ', 'ส่งรูปที่แก้ไขแล้วครบ 10 รูป', 50, 'AUTO_PHOTO', true, NOW());
