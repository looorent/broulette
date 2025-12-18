import { AddressLink, OpenMapButton, RerollButton, RestaurantDescription, RestaurantPrice, RestaurantRating, RestaurantTags, ShareButton, SourceBadge, WebsiteLink } from "@components/candidate";
import { PhoneLink } from "@components/candidate/phone-link";
import { triggerHaptics } from "@features/browser.client";
import prisma from "@features/db.server/prisma";
import { findSourceIn } from "@features/discovery.server";
import { formatSearchLabel } from "@features/search";
import { tagToLabel } from "@features/tag.server";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { href, redirect } from "react-router";
import type { Route } from "./+types/searches.$searchId_.candidates.$candidateId";


const LATEST = "latest";
export async function loader({ params }: Route.LoaderArgs) {
  const { searchId, candidateId } = params;

  if (LATEST === candidateId.toLowerCase()) {
    const search = await prisma.search.findWithLatestCandidate(params.searchId);
    const latestId = search?.candidates?.[0]?.id;

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
          <article className="bg-fun-cream border-[5px] border-fun-dark rounded-3xl shadow-hard overflow-hidden flex-1 flex flex-col mb-6 transform rotate-1 hover:rotate-0 transition-transform duration-300 relative group min-h-[300px]">

            <figure className="h-48 bg-gray-200 relative border-b-[5px] border-fun-dark overflow-hidden m-0">
              <img
                id="candidate-image"
                src={restaurant.imageUrl}
                className="w-full h-full object-cover animate-photo"
                alt={`Photo of ${restaurant.name}`}
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

              <RestaurantDescription description={restaurant.description} />

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

function BackToHomeButton() {
  return (
    <a
      href="/"
      aria-label="Back to Lobby"
      className="
        fixed z-100 top-4 right-4

        flex items-center gap-2 justify-center
        px-2 py-2

        bg-fun-cream/95 backdrop-blur-md
        border-[3px] border-fun-dark rounded-md shadow-hard-hover
        text-fun-dark font-bold font-pop uppercase text-sm tracking-wide

        animate-slide-in-from-top-right

        cursor-pointer transition-transform duration-500
        hover:rotate-0 hover:brightness-115 active:scale-120
      "
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Lobby</span>
    </a>
  );
}
