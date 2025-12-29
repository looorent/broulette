import { useEffect } from "react";
import { href, redirect } from "react-router";

import { BackToHomeButton } from "@components/back-to-home-button";
import { AddressLink, OpenMapButton, RerollButton, RestaurantPrice, RestaurantRating, RestaurantTags, ShareButton, SourceBadge, WebsiteLink } from "@components/candidate";
import { OpeningHoursCard } from "@components/candidate/opening-hour-card";
import { PhoneLink } from "@components/candidate/phone-link";
import { ErrorUnknown } from "@components/error/error-unknown";
import { NoResults } from "@components/error/no-result";
import { triggerHaptics } from "@features/browser.client";
import { getLocale } from "@features/utils/locale.server";
import { findCandidateViewModel } from "@features/view.server";

import type { Route } from "./+types/searches.$searchId_.candidates.$candidateId";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const { searchId, candidateId } = params;
  const view = await findCandidateViewModel(searchId, candidateId, new Date(), await getLocale(request), context.db);
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
    console.error(`No candidate found for searchId='${searchId}' and candidateId='${candidateId}'`);
    return redirect(href("/"));
  }
}

export default function CandidatePage({ loaderData }: Route.ComponentProps) {
  const { reRollEnabled, restaurant, search, candidate } = loaderData;

  useEffect(() => {
    triggerHaptics();
  }, []);

  if (candidate.rejected || !restaurant) {
    return (
      <NoResults momentLabel={search.label} />
    );
  } else {
    return (
      <>
        <title>{`BiteRoulette - ${search.label} - ${restaurant.name}`}</title>

        <BackToHomeButton />

        <main
          className={`
            relative flex h-full transform animate-bounce-in flex-col
            justify-between py-8 transition-transform duration-300
          `}
          aria-label={`Result: ${restaurant.name}`}
        >
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col p-8">

            {/* Header */}
            <header className="mb-6 animate-float text-center">
              <h2 className={`
                -rotate-2 transform font-pop text-4xl text-fun-cream uppercase
                drop-shadow-[3px_3px_0px_rgba(45,52,54,1)]
              `}>
                Jackpot!
              </h2>
            </header>

            <article className={`
              group relative mb-6 flex min-h-75 flex-1 rotate-1 transform
              flex-col overflow-hidden rounded-3xl border-4 border-fun-dark
              bg-fun-cream shadow-hard transition-transform duration-300
              hover:rotate-0
            `}>
              <figure className={`
                relative m-0 h-56 overflow-hidden border-b-4 border-fun-dark
                bg-fun-cream
              `}>
                <img
                  id="candidate-image"
                  src={restaurant.imageUrl}
                  className="h-full w-full animate-image-zoom object-cover"
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

              <div className="relative flex flex-1 flex-col p-6">
                <RestaurantRating rating={restaurant.rating?.label} />

                <h3 id="candidate-name" className={`
                  mt-2 mb-2 font-pop text-3xl leading-tight text-fun-dark
                `}>
                  {restaurant.name}
                </h3>

                <OpeningHoursCard openingHoursOfTheDay={restaurant.openingHoursOfTheDay} />

                <div className="mt-auto space-y-3">
                  <address className={`
                    flex flex-col gap-4 font-sans text-sm font-bold
                    text-fun-dark not-italic
                  `}>
                    <AddressLink formattedAddress={restaurant.address} mapUrl={restaurant.mapUrl} />
                    {restaurant.urls?.map(url => <WebsiteLink key={url} url={url} />)}
                    <PhoneLink nationalPhoneNumber={restaurant.phoneNumber} internationalPhoneNumber={restaurant.internationalPhoneNumber} />
                  </address>

                  <RestaurantTags tags={restaurant.tags} />
                </div>
              </div>
            </article>

            <div className="flex gap-3">
              <RerollButton enabled={reRollEnabled} searchId={search.id} />

              <OpenMapButton mapUrl={restaurant.mapUrl} />
            </div>
          </div>
        </main>
      </>
    );
  }
}

export function ErrorBoundary({
  error,
}: Route.ErrorBoundaryProps) {
  console.error("[GET candidate] Unexpected error", error);
  return (
    <ErrorUnknown />
  );
}
