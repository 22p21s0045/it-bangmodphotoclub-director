-- Seed missions for IT Bangmod Photo Club
-- Clear existing missions first
DELETE FROM "UserMission";
DELETE FROM "Mission";

-- Photo Upload Missions (AUTO_PHOTO)
INSERT INTO "Mission" (id, title, description, "expReward", type, "isActive", "createdAt") VALUES
(gen_random_uuid(), 'ช่างภาพมือใหม่', 'อัปโหลดรูปภาพครบ 10 รูป', 30, 'AUTO_PHOTO', true, NOW()),
(gen_random_uuid(), 'ช่างภาพมือโปร', 'อัปโหลดรูปภาพครบ 30 รูป', 60, 'AUTO_PHOTO', true, NOW()),
(gen_random_uuid(), 'ตากล้องเทพ', 'อัปโหลดรูปภาพครบ 100 รูป', 150, 'AUTO_PHOTO', true, NOW()),
(gen_random_uuid(), 'ตำนานแห่งชมรม', 'อัปโหลดรูปภาพครบ 200 รูป', 300, 'AUTO_PHOTO', true, NOW());

-- Event Participation Missions (AUTO_JOIN)
INSERT INTO "Mission" (id, title, description, "expReward", type, "isActive", "createdAt") VALUES
(gen_random_uuid(), 'สมาชิกตัวจริง', 'เข้าร่วมกิจกรรม 3 ครั้ง', 50, 'AUTO_JOIN', true, NOW()),
(gen_random_uuid(), 'ขาประจำ', 'เข้าร่วมกิจกรรม 10 ครั้ง', 120, 'AUTO_JOIN', true, NOW()),
(gen_random_uuid(), 'ขาประจำตลอดกาล', 'เข้าร่วมกิจกรรม 25 ครั้ง', 250, 'AUTO_JOIN', true, NOW()),
(gen_random_uuid(), 'หัวใจชมรม', 'เข้าร่วมกิจกรรม 50 ครั้ง', 500, 'AUTO_JOIN', true, NOW());
