import { BackToHomeButton } from "@components/back-to-home-button";
import { AddressLink, OpenMapButton, RerollButton, RestaurantPrice, RestaurantRating, RestaurantTags, ShareButton, SourceBadge, WebsiteLink } from "@components/candidate";
import { OpeningHoursCard } from "@components/candidate/opening-hour-card";
import { PhoneLink } from "@components/candidate/phone-link";
import { triggerHaptics } from "@features/browser.client";
import { findCandidateViewModel } from "@features/view.server";
import { useEffect } from "react";
import { href, redirect } from "react-router";
import type { Route } from "./+types/searches.$searchId_.candidates.$candidateId";

const locale = "en-US"; // TODO manage locale

export async function loader({ params }: Route.LoaderArgs) {
  const { searchId, candidateId } = params;

  const view = await findCandidateViewModel(searchId, candidateId, new Date(), locale);
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
    // TODO manage error
    return redirect(href("/"));
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
            <h2 className="font-pop text-4xl text-fun-cream drop-shadow-[3px_3px_0px_rgba(45,52,54,1)] uppercase transform -rotate-2">
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
              <RestaurantRating rating={restaurant.rating?.label} />

              <h3 id="candidate-name" className="font-pop text-3xl text-fun-dark leading-tight mb-2 mt-2">
                {restaurant.name}
              </h3>

              <OpeningHoursCard openingHoursOfTheDay={restaurant.openingHoursOfTheDay} />

              <div className="mt-auto space-y-3">
                <address className="flex flex-col gap-4 text-fun-dark font-bold font-sans text-sm not-italic">
                  <AddressLink formattedAddress={restaurant.address} mapUrl={restaurant.mapUrl} />
                  {restaurant.urls?.map(url => <WebsiteLink key={url} url={url} />)}
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
