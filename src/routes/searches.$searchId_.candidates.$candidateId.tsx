import { useEffect } from "react";
import { href, redirect, useRouteLoaderData } from "react-router";

import { BackToHomeButton } from "@components/back-to-home-button";
import { AddressLink, NoImageBox, OpenMapButton, RerollButton, RestaurantPrice, RestaurantRating, RestaurantTags, ShareButton, SourceBadge, WebsiteLink } from "@components/candidate";
import { OpeningHoursCard } from "@components/candidate/opening-hour-card";
import { PhoneLink } from "@components/candidate/phone-link";
import { NoResults } from "@components/error";
import { ErrorUnknown } from "@components/error/error-unknown";
import { triggerHaptics } from "@features/browser.client";
import { getLocale } from "@features/utils/locale.server";
import { logger } from "@features/utils/logger";
import { findCandidateViewModel } from "@features/view.server";
import type { loader as rootLoader } from "src/root";

import type { Route } from "./+types/searches.$searchId_.candidates.$candidateId";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const { searchId, candidateId } = params;
  const view = await findCandidateViewModel(searchId, candidateId, new Date(), await getLocale(request), context.repositories.search, context.repositories.candidate);
  if (view) {
    if (view.redirectRequired) {
      return redirect(
        href("/searches/:searchId/candidates/:candidateId", {
          searchId: view.searchId,
          candidateId: view.candidateId
        })
      );
    } else {
      return view;
    }
  } else {
    logger.error("[GET candidate] No candidate found for searchId='%s' and candidateId='%s'", searchId, candidateId);
    return redirect(href("/"));
  }
}

export default function CandidatePage({ loaderData }: Route.ComponentProps) {
  const { reRollEnabled, restaurant, search, candidate } = loaderData;
  const session = useRouteLoaderData<typeof rootLoader>("root");

  useEffect(() => {
    triggerHaptics();
  }, []);

  if (candidate.rejected || !restaurant) {
    return (
      <NoResults
        momentLabel={search.label}
        searchId={search.id}
        distanceRange={search.distanceRange}
        csrfToken={session?.csrfToken ?? ""}
      />
    );
  } else {
    return (
      <>
        <title>{`BiteRoulette - ${search.label} - ${restaurant.name}`}</title>

        <BackToHomeButton />

        <main
          className={`
            relative mx-auto flex h-dvh transform animate-bounce-in flex-col
            justify-between px-6 py-10 transition-transform duration-300
            md:h-full
          `}
          aria-label={`Result: ${restaurant.name}`}
        >
          <article className={`
            group relative mb-6 flex min-h-0 flex-1 rotate-1 transform flex-col
            overflow-hidden rounded-3xl border-4 border-fun-dark bg-fun-cream
            shadow-hard transition-transform duration-300
            hover:rotate-0
          `}>
            <figure className={`
              relative m-0 h-48 shrink-0 overflow-hidden border-b-4
              border-fun-dark bg-fun-cream
            `}>
              {
                restaurant.imageUrl ? (
                  <img
                    id="candidate-image"
                    src={restaurant.imageUrl}
                    className="h-full w-full animate-image-zoom object-cover"
                    alt={`Restaurant named '${restaurant.name}'`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <NoImageBox />
                )
              }

              <SourceBadge source={restaurant.source} />

              <RestaurantPrice range={restaurant.priceRange} />

              <ShareButton
                searchId={search.id}
                candidateId={candidate.id}
                restaurantName={restaurant.name}
                restaurantDescription={restaurant.description} />

            </figure>
            <RestaurantRating rating={restaurant.rating?.label} />

            <div className={`flex flex-1 flex-col overflow-y-auto p-6`}>
              <h3 id="candidate-name" className={`
                mt-2 mb-0 font-pop text-2xl leading-tight text-fun-dark
              `}>
                {restaurant.name}
              </h3>
              <OpeningHoursCard openingHoursOfTheDay={restaurant.openingHoursOfTheDay} />

              <div className={`mt-auto space-y-3 pt-6`}>
                <address className={`
                  flex flex-col gap-3 font-sans text-sm font-bold text-fun-dark
                  not-italic
                `}>
                  <AddressLink formattedAddress={restaurant.address} mapUrl={restaurant.mapUrl} />
                  {restaurant.urls?.map(url => <WebsiteLink key={url} url={url} />)}
                  <PhoneLink nationalPhoneNumber={restaurant.phoneNumber} internationalPhoneNumber={restaurant.internationalPhoneNumber} />
                </address>

                <RestaurantTags tags={restaurant.tags} />
              </div>
            </div>
          </article>

          <div className="flex shrink-0 gap-3">
            <RerollButton enabled={reRollEnabled} searchId={search.id} />

            <OpenMapButton mapUrl={restaurant.mapUrl} />
          </div>
        </main>
      </>
    );
  }
}

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  logger.error("[GET candidate] Unexpected error", error);
  return (
    <ErrorUnknown />
  );
}
