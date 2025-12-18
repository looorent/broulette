import { SourceBadge } from "@components/candidate";
import { shareSocial, triggerHaptics } from "@features/browser.client";
import prisma from "@features/db.server/prisma";
import { findSourceIn } from "@features/discovery.server";
import { formatSearchLabel } from "@features/search";
import { findTagIcon } from "@features/tag";
import { tagToLabel } from "@features/tag.server";
import { ArrowLeft, MapPin, Navigation, Phone, RefreshCw, Share2, Star } from "lucide-react";
import { useEffect } from "react";
import { href, redirect, useSubmit } from "react-router";
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
        currentUrl: href("/searches/:searchId/candidates/:candidateId", { searchId: candidate.searchId, candidateId: candidate.id }),
        newCandidateUrl: href("/searches/:searchId/candidates", { searchId: candidate.searchId }),
        reRollEnabled: !candidate.search.exhausted && !hasExpired,
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
          mapUrl: candidate.restaurant.mapUrl
        }
      };
    } else {
      return redirect(href("/"));
    }
  }
}

function Tag({id, label}: {id: string, label: string}) {
  const Icon = findTagIcon(id);
  return (
    <span className="inline-flex items-center px-2 py-1 bg-fun-cream border-2 border-fun-dark rounded-lg text-xs font-bold">
      {Icon && (<Icon className="w-3 h-3 mr-1.5" />)}
      {label}
    </span>
  );
}

export default function CandidatePage({ loaderData }: Route.ComponentProps) {
  const { currentUrl, newCandidateUrl, reRollEnabled, restaurant, search } = loaderData;
  const submit = useSubmit();

  const shareResult = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareSocial(restaurant.name || "", restaurant.description, currentUrl);
    triggerHaptics();
  };

  const reRoll = () => {
    if (reRollEnabled) {
      triggerHaptics();
      submit({
        searchId: search.id
      }, {
        method: "POST",
        action: newCandidateUrl,
        replace: true,
        viewTransition: true
      });
    }
  };

  useEffect(() => {
    triggerHaptics();
  }, []);

  return (
    <>
      <title>{`BiteRoulette - ${search.label} - ${restaurant.name}`}</title>

      <BackToHomeButton />

      <main
        className="h-full flex flex-col justify-between py-8 relative animate-bounce-in transform transition-transform duration-300"
        aria-label="Restaurant Result"
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
              />

              {restaurant.source && <SourceBadge source={restaurant.source} />}

              {restaurant.priceRange && (
                <div className="absolute top-3 right-3 bg-fun-yellow border-[3px] border-fun-dark px-3 py-1 rounded-xl font-bold text-fun-dark shadow-hard-hover text-sm z-10">
                  <span id="candidate-price">{restaurant.priceRange}</span>
                </div>
              )}

              <button
                onClick={shareResult}
                className="absolute top-3 left-3 bg-fun-cream/95 backdrop-blur-md border-[3px] border-fun-dark p-3 rounded-xl shadow-hard-hover text-fun-dark active:scale-95 transition-transform z-20 cursor-pointer"
                title="Share"
                aria-label="Share Restaurant"
              >
                <Share2 className="w-6 h-6 stroke-[2.5px]" />
              </button>
            </figure>

            <div className="p-6 flex-1 flex flex-col relative">
              {restaurant.rating && (
                <div className="absolute -top-5 left-6 bg-fun-green border-[3px] border-fun-dark rounded-full px-3 py-1 font-bold text-white shadow-hard-hover flex items-center gap-1 transform -rotate-3 z-20">
                  <Star className="w-4 h-4 fill-fun-cream" />
                  <span id="candidate-rating">{restaurant.rating}</span>
                </div>
              )}

              <h3 id="candidate-name" className="font-pop text-3xl text-fun-dark leading-tight mb-2 mt-2">
                {restaurant.name}
              </h3>

              {restaurant.description && (
                <p id="candidate-desc" className="font-sans font-medium text-fun-dark/70 text-lg leading-snug mb-4 line-clamp-3">
                  {restaurant.description}
                </p>
              )}

              <div className="mt-auto space-y-3">
                <address className="flex flex-col gap-2 text-fun-dark font-bold font-sans text-sm not-italic">
                  {restaurant.address && (
                    <a
                      href={restaurant.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <MapPin className="w-5 h-5 text-fun-red shrink-0" />
                      <span id="candidate-address">{restaurant.address}</span>
                    </a>
                  )}

                  {(restaurant.internationalPhoneNumber || restaurant.phoneNumber) && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-fun-blue shrink-0" />
                      <a
                        id="candidate-phone"
                        href={`tel:${restaurant.internationalPhoneNumber ?? restaurant.phoneNumber}`}
                        className="hover:underline decoration-2 decoration-fun-blue"
                      >
                        {restaurant.phoneNumber || restaurant.internationalPhoneNumber}
                      </a>
                    </div>
                  )}
                </address>

                {restaurant.tags.length > 0 && (
                  <div id="candidate-tags" className="flex gap-2 flex-wrap pt-2">
                    {restaurant.tags.map(tag => <Tag key={tag.id} id={tag.id} label={tag.label} />)}
                  </div>
                )}
              </div>
            </div>
          </article>

          {/* Actions */}
          <div className="flex gap-3">
            {reRollEnabled && (
              <button
                onClick={reRoll}
                className="w-20 bg-fun-yellow border-4 border-fun-dark rounded-2xl flex items-center justify-center shadow-hard transition-transform active:translate-y-1 active:shadow-none hover:brightness-110 cursor-pointer"
                title="Spin Again"
                aria-label="Reroll"
              >
                <RefreshCw className="w-8 h-8 stroke-[3px] text-fun-dark" />
              </button>
            )}

            {restaurant.mapUrl && (
              <a
                href={restaurant.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-fun-green border-4 border-fun-dark rounded-2xl py-4 shadow-hard flex items-center justify-center gap-2 transition-transform active:translate-y-1 active:shadow-none hover:brightness-110 cursor-pointer"
              >
                <span className="font-pop text-2xl text-fun-dark uppercase tracking-wide">Let's Eat!</span>
                <Navigation className="w-6 h-6 stroke-[3px] text-fun-dark" />
              </a>
            )}
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
