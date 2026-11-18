CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "WalletType" AS ENUM ('BANK', 'EWALLET', 'CASH');

CREATE TYPE "CategoryType" AS ENUM ('INCOME', 'EXPENSE');

CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');

CREATE TYPE "TransactionSource" AS ENUM ('MANUAL', 'BILL', 'SPLIT');

CREATE TYPE "BillCycle" AS ENUM ('MONTHLY', 'YEARLY');

CREATE TYPE "DebtStatus" AS ENUM ('UNPAID', 'PENDING', 'PAID');

CREATE TYPE "DiscountType" AS ENUM ('NOMINAL', 'PERCENT');

CREATE TYPE "ReminderChannel" AS ENUM ('TELEGRAM', 'EMAIL');

CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "avatarUrl" TEXT,
    "bankInfo" TEXT,
    "telegramChatId" TEXT,
    "telegramUsername" TEXT,
    "telegramLinkCode" TEXT,
    "telegramLinkExpiresAt" TIMESTAMP(3),
    "emailReminders" BOOLEAN NOT NULL DEFAULT true,
    "defaultRemindDays" INTEGER[] DEFAULT ARRAY[3, 1, 0]::INTEGER[],
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "WalletType" NOT NULL,
    "openingBalance" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "icon" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "walletId" UUID NOT NULL,
    "toWalletId" UUID,
    "categoryId" UUID,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "note" TEXT,
    "source" "TransactionSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Bill" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "cycle" "BillCycle" NOT NULL,
    "anchorDay" INTEGER NOT NULL,
    "nextDueDate" DATE NOT NULL,
    "walletId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "remindDays" INTEGER[] DEFAULT ARRAY[3, 1, 0]::INTEGER[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillPayment" (
    "id" UUID NOT NULL,
    "billId" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReminderLog" (
    "id" UUID NOT NULL,
    "billId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "channel" "ReminderChannel" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Split" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "walletId" UUID NOT NULL,
    "taxBps" INTEGER NOT NULL DEFAULT 0,
    "serviceBps" INTEGER NOT NULL DEFAULT 0,
    "discountType" "DiscountType" NOT NULL DEFAULT 'NOMINAL',
    "discountValue" INTEGER NOT NULL DEFAULT 0,
    "subtotal" INTEGER NOT NULL,
    "grandTotal" INTEGER NOT NULL,
    "shareToken" TEXT NOT NULL,
    "expenseTransactionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Split_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitPerson" (
    "id" UUID NOT NULL,
    "splitId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "share" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "SplitPerson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitItem" (
    "id" UUID NOT NULL,
    "splitId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "SplitItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SplitAssignment" (
    "itemId" UUID NOT NULL,
    "personId" UUID NOT NULL,

    CONSTRAINT "SplitAssignment_pkey" PRIMARY KEY ("itemId","personId")
);

CREATE TABLE "Debt" (
    "id" UUID NOT NULL,
    "personId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "DebtStatus" NOT NULL DEFAULT 'UNPAID',
    "markedPaidAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "walletId" UUID,
    "transactionId" UUID,

    CONSTRAINT "Debt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Profile_telegramChatId_key" ON "Profile"("telegramChatId");

CREATE UNIQUE INDEX "Profile_telegramLinkCode_key" ON "Profile"("telegramLinkCode");

CREATE INDEX "Profile_isDemo_createdAt_idx" ON "Profile"("isDemo", "createdAt");

CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

CREATE UNIQUE INDEX "Wallet_userId_name_key" ON "Wallet"("userId", "name");

CREATE UNIQUE INDEX "Category_userId_name_type_key" ON "Category"("userId", "name", "type");

CREATE INDEX "Transaction_userId_date_createdAt_idx" ON "Transaction"("userId", "date" DESC, "createdAt" DESC);

CREATE INDEX "Bill_userId_nextDueDate_idx" ON "Bill"("userId", "nextDueDate");

CREATE UNIQUE INDEX "BillPayment_transactionId_key" ON "BillPayment"("transactionId");

CREATE INDEX "BillPayment_billId_dueDate_idx" ON "BillPayment"("billId", "dueDate");

CREATE UNIQUE INDEX "ReminderLog_billId_dueDate_daysBefore_channel_key" ON "ReminderLog"("billId", "dueDate", "daysBefore", "channel");

CREATE UNIQUE INDEX "Split_shareToken_key" ON "Split"("shareToken");

CREATE UNIQUE INDEX "Split_expenseTransactionId_key" ON "Split"("expenseTransactionId");

CREATE INDEX "Split_userId_date_idx" ON "Split"("userId", "date" DESC);

CREATE UNIQUE INDEX "SplitPerson_splitId_name_key" ON "SplitPerson"("splitId", "name");

CREATE INDEX "SplitItem_splitId_idx" ON "SplitItem"("splitId");

CREATE UNIQUE INDEX "Debt_personId_key" ON "Debt"("personId");

CREATE UNIQUE INDEX "Debt_transactionId_key" ON "Debt"("transactionId");

ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Bill" ADD CONSTRAINT "Bill_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Bill" ADD CONSTRAINT "Bill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Split" ADD CONSTRAINT "Split_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Split" ADD CONSTRAINT "Split_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Split" ADD CONSTRAINT "Split_expenseTransactionId_fkey" FOREIGN KEY ("expenseTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SplitPerson" ADD CONSTRAINT "SplitPerson_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "Split"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SplitItem" ADD CONSTRAINT "SplitItem_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "Split"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SplitAssignment" ADD CONSTRAINT "SplitAssignment_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "SplitItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SplitAssignment" ADD CONSTRAINT "SplitAssignment_personId_fkey" FOREIGN KEY ("personId") REFERENCES "SplitPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_personId_fkey" FOREIGN KEY ("personId") REFERENCES "SplitPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
