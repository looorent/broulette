import { BackToHomeButton } from "@components/back-to-home-button";
import { AddressLink, OpenMapButton, RerollButton, RestaurantPrice, RestaurantRating, RestaurantTags, ShareButton, SourceBadge, WebsiteLink } from "@components/candidate";
import { OpeningHoursCard } from "@components/candidate/opening-hour-card";
import { PhoneLink } from "@components/candidate/phone-link";
import { triggerHaptics } from "@features/browser.client";
import { formatOpeningHoursFor } from "@features/candidate.server";
import prisma from "@features/db.server/prisma";
import { formatSearchLabel } from "@features/search";
import { tagToLabel } from "@features/tag.server";
import { useEffect } from "react";
import { href, redirect } from "react-router";
import type { Route } from "./+types/searches.$searchId_.candidates.$candidateId";

const locale = "en-US"; // TODO manage locale

const LATEST = "latest";
export async function loader({ params }: Route.LoaderArgs) {
  const { searchId, candidateId } = params;

  if (LATEST === candidateId.toLowerCase()) {


    if (latestId) {
      return redirect(
        href("/searches/:searchId/candidates/:candidateId", {
          searchId: search.id,
          candidateId: latestId
        })
      );
    } else {
      return redirect(href("/"));
    }
  } else {
    const candidate = await prisma.searchCandidate.findUnique({
      where: { searchId, id: candidateId },
      include: {
        search: true,
        restaurant: { include: { identities: true } }
      }
    });

    if (candidate) {
      const hasExpired = new Date() > candidate.search.serviceEnd;
      return {
        reRollEnabled: !candidate.search.exhausted && !hasExpired,
        candidate: {
          id: candidate.id
        },
        search: {
          id: candidate.search.id,
          label: formatSearchLabel(candidate.search)
        },
        restaurant: {
          name: candidate.restaurant.name,
          description: candidate.restaurant.description,
          priceRange: candidate.restaurant.priceLabel,
          imageUrl: candidate.restaurant.imageUrl ?? "https://placehold.co/600x400?text=No+Image",
          source: findSourceIn(candidate.restaurant.identities),
          rating: candidate.restaurant.rating?.toFixed(1),
          tags: candidate.restaurant.tags?.map(tagToLabel) || [],
          phoneNumber: candidate.restaurant.phoneNumber,
          internationalPhoneNumber: candidate.restaurant.internationalPhoneNumber,
          openingHoursOfTheDay: formatOpeningHoursFor(candidate.search.serviceInstant, candidate.restaurant.openingHours, locale),
          address: candidate.restaurant.address,
          mapUrl: candidate.restaurant.mapUrl,
          website: candidate.restaurant.website
        }
      };
    } else {
      return redirect(href("/"));
    }
  }
}


export default function CandidatePage({ loaderData }: Route.ComponentProps) {
  const { reRollEnabled, restaurant, search, candidate } = loaderData;

  useEffect(() => {
    triggerHaptics();
  }, []);

  return (
    <>
      <title>{`BiteRoulette - ${search.label} - ${restaurant.name}`}</title>

      <BackToHomeButton />

      <main
        className="
          h-full
          flex flex-col justify-between
          py-8
          relative
          animate-bounce-in
          transform transition-transform duration-300
        "
        aria-label={`Result: ${restaurant.name}`}
      >
        <div className="flex-1 flex flex-col w-full max-w-md mx-auto p-8 no-scrollbar">

          {/* Header */}
          <header className="text-center mb-6 animate-float">
            <h2 className="font-pop text-4xl text-white drop-shadow-[3px_3px_0px_rgba(45,52,54,1)] uppercase transform -rotate-2">
              Jackpot!
            </h2>
          </header>

          {/* Card */}
          <article className="
            bg-fun-cream
            border-4 border-fun-dark rounded-3xl
            shadow-hard
            overflow-hidden
            flex-1
            flex flex-col
            mb-6
            transform rotate-1 hover:rotate-0 transition-transform duration-300
            relative group
            min-h-75
          ">
            <figure className="h-56 bg-fun-cream relative border-b-4 border-fun-dark overflow-hidden m-0">
              <img
                id="candidate-image"
                src={restaurant.imageUrl}
                className="w-full h-full object-cover animate-photo"
                alt={`Restaurant named '${restaurant.name}'`}
                loading="lazy"
                decoding="async"
              />

              <SourceBadge source={restaurant.source} />

              <RestaurantPrice range={restaurant.priceRange} />

              <ShareButton
                searchId={search.id}
                candidateId={candidate.id}
                restaurantName={restaurant.name}
                restaurantDescription={restaurant.description} />
            </figure>

            <div className="p-6 flex-1 flex flex-col relative">
              <RestaurantRating rating={restaurant.rating} />

              <h3 id="candidate-name" className="font-pop text-3xl text-fun-dark leading-tight mb-2 mt-2">
                {restaurant.name}
              </h3>

              <OpeningHoursCard openingHoursOfTheDay={restaurant.openingHoursOfTheDay} />

              <div className="mt-auto space-y-3">
                <address className="flex flex-col gap-4 text-fun-dark font-bold font-sans text-sm not-italic">
                  <AddressLink formattedAddress={restaurant.address} mapUrl={restaurant.mapUrl} />
                  <WebsiteLink url={restaurant.website} />
                  <PhoneLink nationalPhoneNumber={restaurant.phoneNumber} internationalPhoneNumber={restaurant.internationalPhoneNumber} />
                </address>

                <RestaurantTags tags={restaurant.tags} />
              </div>
            </div>
          </article>

          {/* Actions */}
          <div className="flex gap-3">
            <RerollButton enabled={reRollEnabled} searchId={search.id} />

            <OpenMapButton mapUrl={restaurant.mapUrl} />
          </div>
        </div>
      </main>
    </>
  );
}
