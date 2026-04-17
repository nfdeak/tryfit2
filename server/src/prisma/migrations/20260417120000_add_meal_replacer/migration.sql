-- CreateTable
CREATE TABLE "meal_replacements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "mealIndex" INTEGER NOT NULL,
    "foodName" TEXT NOT NULL,
    "foodSource" TEXT NOT NULL,
    "foodExternalId" TEXT,
    "servingSize" TEXT NOT NULL,
    "servingQty" DOUBLE PRECISION NOT NULL,
    "servingGrams" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "fibreG" DOUBLE PRECISION NOT NULL,
    "note" TEXT DEFAULT '',
    "isAiEstimate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_replacements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_search_cache" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_search_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recent_food_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "foodSource" TEXT NOT NULL,
    "foodData" JSONB NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recent_food_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_replacements_userId_date_idx" ON "meal_replacements"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "meal_replacements_userId_date_mealIndex_key" ON "meal_replacements"("userId", "date", "mealIndex");

-- CreateIndex
CREATE INDEX "food_search_cache_query_source_idx" ON "food_search_cache"("query", "source");

-- CreateIndex
CREATE INDEX "food_search_cache_expiresAt_idx" ON "food_search_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "food_search_cache_query_source_key" ON "food_search_cache"("query", "source");

-- CreateIndex
CREATE INDEX "recent_food_logs_userId_usedAt_idx" ON "recent_food_logs"("userId", "usedAt");

-- AddForeignKey
ALTER TABLE "meal_replacements" ADD CONSTRAINT "meal_replacements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recent_food_logs" ADD CONSTRAINT "recent_food_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
