-- CreateEnum
CREATE TYPE "service_timeslot" AS ENUM ('Dinner', 'Lunch', 'RightNow', 'Custom');

-- CreateEnum
CREATE TYPE "distance_range" AS ENUM ('Close', 'MidRange', 'Far');

-- CreateEnum
CREATE TYPE "search_candidate_status" AS ENUM ('Rejected', 'Returned');

-- CreateTable
CREATE TABLE "search" (
    "id" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceRange" "distance_range" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exhausted" BOOLEAN NOT NULL DEFAULT false,
    "serviceDate" DATE NOT NULL,
    "serviceTimeslot" "service_timeslot" NOT NULL,
    "serviceInstant" TIMESTAMP(3) NOT NULL,
    "serviceEnd" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_candidate" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "order" INTEGER NOT NULL,
    "searchId" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "status" "search_candidate_status" NOT NULL,
    "rejectionReason" VARCHAR(200),

    CONSTRAINT "search_candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(100),
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_profile" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "restaurantId" UUID NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "externalId" VARCHAR(255) NOT NULL,
    "externalType" VARCHAR(50) NOT NULL,
    "version" INTEGER NOT NULL,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "countryCode" VARCHAR(20),
    "state" VARCHAR(50),
    "description" TEXT,
    "imageUrl" TEXT,
    "mapUrl" TEXT,
    "rating" DECIMAL(2,1),
    "ratingCount" INTEGER,
    "phoneNumber" VARCHAR(20),
    "internationalPhoneNumber" VARCHAR(25),
    "priceRange" INTEGER,
    "priceLabel" TEXT,
    "openingHours" TEXT,
    "tags" VARCHAR(30)[],
    "operational" BOOLEAN,
    "website" TEXT,
    "sourceUrl" TEXT,

    CONSTRAINT "restaurant_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_matching_attempt" (
    "id" UUID NOT NULL,
    "restaurantId" UUID NOT NULL,
    "queryType" TEXT NOT NULL,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "radius" INTEGER,
    "query" TEXT,
    "source" VARCHAR(50) NOT NULL,
    "found" BOOLEAN NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_matching_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_candidate_searchId_status_idx" ON "search_candidate"("searchId", "status");

-- CreateIndex
CREATE INDEX "restaurant_profile_source_externalId_idx" ON "restaurant_profile"("source", "externalId");

-- CreateIndex
CREATE INDEX "restaurant_matching_attempt_source_idx" ON "restaurant_matching_attempt"("source");

-- AddForeignKey
ALTER TABLE "search_candidate" ADD CONSTRAINT "search_candidate_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "search"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_candidate" ADD CONSTRAINT "search_candidate_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_profile" ADD CONSTRAINT "restaurant_profile_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_matching_attempt" ADD CONSTRAINT "restaurant_matching_attempt_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
