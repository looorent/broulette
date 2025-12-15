-- DropIndex
DROP INDEX "restaurant_identity_source_externalId_key";

-- AlterTable
ALTER TABLE "restaurant" ADD COLUMN     "internationalPhoneNumber" VARCHAR(25),
ADD COLUMN     "operational" BOOLEAN,
ADD COLUMN     "ratingCount" INTEGER,
ADD COLUMN     "sourceWebpage" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "restaurant_identity_source_externalId_idx" ON "restaurant_identity"("source", "externalId");
