-- Rename EDITOR to CONTENT and add PRE_SALES
ALTER TYPE "AdminRole" RENAME VALUE 'EDITOR' TO 'CONTENT';
ALTER TYPE "AdminRole" ADD VALUE 'PRE_SALES';

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Admin_passwordResetTokenHash_key" ON "Admin"("passwordResetTokenHash");
