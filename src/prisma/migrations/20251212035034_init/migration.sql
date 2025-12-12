-- CreateEnum
CREATE TYPE "ServiceTimeslot" AS ENUM ('Dinner', 'Lunch', 'RightNow', 'Custom');

-- CreateEnum
CREATE TYPE "DistanceRange" AS ENUM ('Close', 'MidRange', 'Far');

-- CreateEnum
CREATE TYPE "SearchCandidateStatus" AS ENUM ('Rejected', 'Returned', 'Pending');

-- CreateTable
CREATE TABLE "Search" (
    "id" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceRange" "DistanceRange" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exhausted" BOOLEAN NOT NULL DEFAULT false,
    "serviceDate" DATE NOT NULL,
    "serviceTimeslot" "ServiceTimeslot" NOT NULL,
    "serviceInstant" TIMESTAMP(3) NOT NULL,
    "serviceEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchCandidate" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL,
    "searchId" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "status" "SearchCandidateStatus" NOT NULL DEFAULT 'Pending',
    "rejectionReason" VARCHAR(50),

    CONSTRAINT "SearchCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" VARCHAR(100) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "countryCode" VARCHAR(20),
    "state" VARCHAR(50),
    "description" TEXT,
    "imageUrl" TEXT,
    "rating" DECIMAL(2,1),
    "phoneNumber" VARCHAR(20),
    "priceRange" INTEGER,
    "openingHours" TEXT,
    "tags" VARCHAR(30)[],

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantIdentity" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "externalId" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,

    CONSTRAINT "RestaurantIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchCandidate_searchId_status_idx" ON "SearchCandidate"("searchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantIdentity_source_externalId_key" ON "RestaurantIdentity"("source", "externalId");

-- AddForeignKey
ALTER TABLE "SearchCandidate" ADD CONSTRAINT "SearchCandidate_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchCandidate" ADD CONSTRAINT "SearchCandidate_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantIdentity" ADD CONSTRAINT "RestaurantIdentity_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
