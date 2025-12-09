-- CreateEnum
CREATE TYPE "ServiceTimeslot" AS ENUM ('Dinner', 'Lunch', 'RightNow');

-- CreateEnum
CREATE TYPE "DistanceRange" AS ENUM ('Close', 'MidRange', 'Far');

-- CreateTable
CREATE TABLE "Search" (
    "id" UUID NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceRange" "DistanceRange" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceDate" DATE NOT NULL,
    "serviceTimeslot" "ServiceTimeslot" NOT NULL,

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Selection" (
    "id" UUID NOT NULL,
    "searchId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restaurantName" VARCHAR(100) NOT NULL,
    "restaurantLatitude" DOUBLE PRECISION NOT NULL,
    "restaurantLongitude" DOUBLE PRECISION NOT NULL,
    "restaurantAddress" TEXT,
    "restaurantDescription" TEXT,
    "restaurantImageUrl" TEXT,
    "restaurantRating" DECIMAL(2,1),
    "restaurantPhoneNumber" VARCHAR(20),
    "restaurantPriceRange" INTEGER,
    "restaurantTags" VARCHAR(30)[],
    "restaurantSource" VARCHAR(20),

    CONSTRAINT "Selection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Selection" ADD CONSTRAINT "Selection_searchId_fkey" FOREIGN KEY ("searchId") REFERENCES "Search"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
