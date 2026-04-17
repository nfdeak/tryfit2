-- AlterTable: add planDuration and mealPrepGuide to MealPlan
ALTER TABLE "MealPlan" ADD COLUMN "planDuration" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "MealPlan" ADD COLUMN "mealPrepGuide" JSONB;

-- AlterTable: add planDuration to UserProfile
ALTER TABLE "UserProfile" ADD COLUMN "planDuration" INTEGER NOT NULL DEFAULT 7;

-- CreateTable: water_logs
CREATE TABLE "water_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "glasses" INTEGER NOT NULL,
    "goalGlasses" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "water_logs_userId_date_idx" ON "water_logs"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "water_logs_userId_date_key" ON "water_logs"("userId", "date");

-- AddForeignKey
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
