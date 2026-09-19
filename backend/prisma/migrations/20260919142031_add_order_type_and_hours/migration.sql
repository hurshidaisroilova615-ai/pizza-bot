-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderType" "OrderType" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "cardPaymentEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "closeTime" TEXT,
ADD COLUMN     "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openTime" TEXT,
ADD COLUMN     "pickupAddress" TEXT,
ADD COLUMN     "pickupEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timezoneOffset" INTEGER NOT NULL DEFAULT 5;
