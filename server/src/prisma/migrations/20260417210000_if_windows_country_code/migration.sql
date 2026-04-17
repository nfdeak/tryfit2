-- Migration: IF windows + country code
-- Applied: 2026-04-17

ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "countryCode" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "eatingWindowHours" INTEGER;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "fastingWindowHours" INTEGER;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "eatingStartTime" TEXT;
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "eatingEndTime" TEXT;
