-- DropForeignKey
ALTER TABLE "search_candidate" DROP CONSTRAINT "search_candidate_restaurantId_fkey";

-- AlterTable
ALTER TABLE "search_candidate" ALTER COLUMN "restaurantId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "restaurant_profile_source_externalId_restaurantId_idx" ON "restaurant_profile"("source", "externalId", "restaurantId");

-- CreateIndex
CREATE INDEX "search_candidate_searchId_idx" ON "search_candidate"("searchId");

-- CreateIndex
CREATE INDEX "search_candidate_restaurantId_status_idx" ON "search_candidate"("restaurantId", "status");

-- AddForeignKey
ALTER TABLE "search_candidate" ADD CONSTRAINT "search_candidate_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
