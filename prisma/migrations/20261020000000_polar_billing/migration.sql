-- Phase 3 billing: Polar replaces the Stripe slice.
--
-- The Stripe tables (Subscription, User.stripeCustomerId) never held live
-- billing data — the pricing page never offered a paid card and no Stripe
-- keys were configured — so the switch is a clean drop. Polar's shape needs
-- three tables instead: the customer mapping, the billing record for the
-- account UI, and the entitlement snapshot every gate reads locally
-- (src/lib/entitlements-server.ts) so access checks never wait on an API.

SET search_path TO chromabrew;

-- DropTable — the FK constraint goes with the table. Every teardown statement
-- is conditional because the production database was built by hand and
-- recorded the baseline as applied *without ever creating* the Stripe
-- tables: the teardown must succeed whether or not they are there. (The
-- first deploy of this migration stopped at
-- `relation "Subscription" does not exist` — P3018, exit 1.)
DROP TABLE IF EXISTS "Subscription";

-- DropIndex / AlterTable — same reasoning; dropping the column takes its
-- unique index with it, so each statement is a no-op on either absence.
DROP INDEX IF EXISTS "User_stripeCustomerId_key";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeCustomerId";

-- CreateTable
CREATE TABLE "PolarCustomer" (
    "id" TEXT NOT NULL,
    "polarId" TEXT NOT NULL,
    "email" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolarCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolarSubscription" (
    "id" TEXT NOT NULL,
    "polarId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PolarSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'polar',
    "expiresAt" TIMESTAMP(3),
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolarCustomer_polarId_key" ON "PolarCustomer"("polarId");

-- CreateIndex
CREATE UNIQUE INDEX "PolarCustomer_userId_key" ON "PolarCustomer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PolarSubscription_polarId_key" ON "PolarSubscription"("polarId");

-- CreateIndex
CREATE INDEX "PolarSubscription_userId_idx" ON "PolarSubscription"("userId");

-- CreateIndex
CREATE INDEX "Entitlement_key_idx" ON "Entitlement"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Entitlement_userId_key_key" ON "Entitlement"("userId", "key");

-- AddForeignKey
ALTER TABLE "PolarCustomer" ADD CONSTRAINT "PolarCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolarSubscription" ADD CONSTRAINT "PolarSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
