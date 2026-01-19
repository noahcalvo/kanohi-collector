-- 1. Add the new column
ALTER TABLE "User" ADD COLUMN "clerkId" TEXT;

-- 2. Populate clerkId for users with id starting with 'user_'
UPDATE "User" SET "clerkId" = "id" WHERE "id" LIKE 'user\_%';

-- 3. Delete users whose id does NOT start with 'user_'
DELETE FROM "User" WHERE "id" NOT LIKE 'user\_%';