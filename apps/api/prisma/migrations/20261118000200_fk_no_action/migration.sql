ALTER TABLE "Bill" DROP CONSTRAINT "Bill_categoryId_fkey";

ALTER TABLE "Bill" DROP CONSTRAINT "Bill_walletId_fkey";

ALTER TABLE "Debt" DROP CONSTRAINT "Debt_transactionId_fkey";

ALTER TABLE "Debt" DROP CONSTRAINT "Debt_walletId_fkey";

ALTER TABLE "Split" DROP CONSTRAINT "Split_expenseTransactionId_fkey";

ALTER TABLE "Split" DROP CONSTRAINT "Split_walletId_fkey";

ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";

ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_toWalletId_fkey";

ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_walletId_fkey";

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Bill" ADD CONSTRAINT "Bill_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Bill" ADD CONSTRAINT "Bill_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Split" ADD CONSTRAINT "Split_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Split" ADD CONSTRAINT "Split_expenseTransactionId_fkey" FOREIGN KEY ("expenseTransactionId") REFERENCES "Transaction"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "Debt" ADD CONSTRAINT "Debt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
