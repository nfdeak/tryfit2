-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "weightKg" REAL NOT NULL,
    "heightCm" REAL NOT NULL,
    "targetWeightKg" REAL NOT NULL,
    "mealPreference" TEXT NOT NULL,
    "cuisinePreferences" TEXT NOT NULL DEFAULT '[]',
    "mealsPerDay" INTEGER NOT NULL DEFAULT 4,
    "eatingWindow" TEXT NOT NULL DEFAULT 'standard',
    "allergies" TEXT NOT NULL DEFAULT '[]',
    "preferredIngredients" TEXT NOT NULL DEFAULT '[]',
    "avoidIngredients" TEXT NOT NULL DEFAULT '[]',
    "primaryGoal" TEXT NOT NULL,
    "dietIntensity" TEXT NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "healthConditions" TEXT NOT NULL DEFAULT '[]',
    "tdee" REAL NOT NULL,
    "targetCalories" REAL NOT NULL,
    "proteinTarget" REAL NOT NULL,
    "fatTarget" REAL NOT NULL,
    "carbTarget" REAL NOT NULL,
    "fibreTarget" REAL NOT NULL,
    "wakeUpTime" TEXT NOT NULL DEFAULT '07:00',
    "sleepTime" TEXT NOT NULL DEFAULT '23:00',
    "cookingStyle" TEXT NOT NULL DEFAULT 'home',
    "kitchenEquipment" TEXT NOT NULL DEFAULT '[]',
    "weeklyBudget" REAL,
    "budgetCurrency" TEXT NOT NULL DEFAULT 'INR',
    "waterIntakeGoal" INTEGER NOT NULL DEFAULT 8,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "weekStartDate" DATETIME NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weekSummary" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "MealPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealPlanDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealPlanId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "dayName" TEXT NOT NULL,
    "totalCalories" REAL NOT NULL,
    "totalProtein" REAL NOT NULL,
    "totalCarbs" REAL NOT NULL,
    "totalFat" REAL NOT NULL,
    "totalFibre" REAL NOT NULL,
    "meals" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "MealPlanDay_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedShoppingList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "categories" TEXT NOT NULL DEFAULT '[]',
    "peopleCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GeneratedShoppingList_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "mealIndex" INTEGER NOT NULL,
    "eaten" BOOLEAN NOT NULL DEFAULT false,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "bought" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ShoppingItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanWeek" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "weekStartDate" TEXT NOT NULL,
    CONSTRAINT "PlanWeek_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MealLog_userId_date_mealIndex_key" ON "MealLog"("userId", "date", "mealIndex");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingItem_userId_itemKey_key" ON "ShoppingItem"("userId", "itemKey");
