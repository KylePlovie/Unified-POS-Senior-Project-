-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "availableAt" TEXT NOT NULL DEFAULT 'I_BAR,SERVICE_BAR,QUICKIE_BAR',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BarRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromBar" TEXT NOT NULL,
    "toBar" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fulfilledAt" DATETIME,
    "lineItemId" TEXT,
    "tabId" TEXT,
    "requestedById" TEXT NOT NULL,
    "fulfilledById" TEXT,
    CONSTRAINT "BarRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BarRequest_fulfilledById_fkey" FOREIGN KEY ("fulfilledById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MenuItem_category_idx" ON "MenuItem"("category");

-- CreateIndex
CREATE INDEX "MenuItem_active_idx" ON "MenuItem"("active");

-- CreateIndex
CREATE INDEX "BarRequest_toBar_status_idx" ON "BarRequest"("toBar", "status");

-- CreateIndex
CREATE INDEX "BarRequest_status_idx" ON "BarRequest"("status");
