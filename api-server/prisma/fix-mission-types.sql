-- Fix mission types based on description content
UPDATE "Mission" SET type = 'AUTO_PHOTO' WHERE description LIKE '%รูป%';
UPDATE "Mission" SET type = 'AUTO_JOIN' WHERE description LIKE '%ครั้ง%';
UPDATE "Mission" SET type = 'MANUAL' WHERE description LIKE '%เข้าสู่ระบบ%';
