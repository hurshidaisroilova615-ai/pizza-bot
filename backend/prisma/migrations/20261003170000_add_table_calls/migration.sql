-- CreateEnum
CREATE TYPE "TableCallKind" AS ENUM ('WAITER', 'BILL');

-- CreateTable
CREATE TABLE "TableCall" (
    "id" SERIAL NOT NULL,
    "tableNumber" TEXT NOT NULL,
    "kind" "TableCallKind" NOT NULL DEFAULT 'WAITER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "TableCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableCall_resolvedAt_idx" ON "TableCall"("resolvedAt");
