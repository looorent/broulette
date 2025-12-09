import { MapPin, Navigation, Phone, RefreshCw, Share2, Star } from "lucide-react";
import { useEffect } from "react";
import { redirect, useSubmit } from "react-router";
import { delay } from "~/functions/delay";
import { triggerHaptics } from "~/functions/haptics";
import { shareSocial } from "~/functions/share";
import { Search } from "~/types/search";
import { createDefaultSelection } from "~/types/selection";
import type { Route } from "../selection/+types/page";
import type { Coordinates } from "~/types/location";
import { createMapLink } from "~/functions/address/map";
import { SourceBadge } from "./components/source-badge";

export async function loader({ params }: Route.LoaderArgs) {
  const search = new Search(params.searchId);
  const selection = createDefaultSelection(search.id);
  if ("latest" === params.searchId.toLowerCase()) {
    throw redirect(selection.toUrl());
  } else {
    await delay(1000);
    return {
      search: {
        id: search.id,
        newSelectionUrl: search.toNewSelectionUrl()
      },
      selection: {
        id: selection.id,
        url: selection.toUrl(),
        restaurant: selection.restaurant
      }
    };
  }
}

export default function SelectionPage({ loaderData }: Route.ComponentProps) {
  const { selection } = loaderData;
  const submit = useSubmit();

  const shareResult = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareSocial(selection?.restaurant?.name || "", selection?.restaurant?.description, location.href);
    triggerHaptics();
  };

  const reRoll = () => {
    triggerHaptics();
    submit({
      searchId: loaderData.search.id
    }, {
      method: "POST",
      action: loaderData.search.newSelectionUrl,
      replace: true,
      viewTransition: true
    });
  };

  useEffect(() => {
    triggerHaptics();
  }, []);

  return (
    <main
      className="
        h-full flex flex-col
        justify-between
        py-8
        relative
        animate-bounce-in
        transform transition-transform duration-300"
      aria-label="Restaurant Result">
      <div className="
        flex-1 flex flex-col
        w-full max-w-md mx-auto
        p-8
        no-scrollbar
      ">
        <header className="text-center mb-6 animate-float">
          <h2 className="font-pop text-4xl text-white drop-shadow-[3px_3px_0px_rgba(45,52,54,1)] uppercase transform -rotate-2">It's a Match!</h2>
        </header>

        <article className="
          bg-fun-cream
            border-[5px] border-fun-dark rounded-3xl
            shadow-hard
            overflow-hidden
            flex-1 flex flex-col
            mb-6
            transform rotate-1 hover:rotate-0 transition-transform duration-300
            relative group
            min-h-[300px]
        ">
          <figure className="h-48
            bg-gray-200
            relative
            border-b-[5px] border-fun-dark overflow-hidden
            m-0
          ">
            <img id="selection-image"
              src={selection?.restaurant?.imageUrl ?? "https://placehold.co/600x400?text=No+Image"}
              className="w-full h-full object-cover animate-photo"
              alt="Picture of the restaurant" />

              <SourceBadge source={selection?.restaurant?.source} />

              {
                selection?.restaurant?.priceRange && (
                  <div className="
                    absolute top-3 right-3
                    bg-fun-yellow
                    border-[3px] border-fun-dark
                    px-3 py-1 rounded-xl
                    font-bold
                    text-fun-dark shadow-hard-hover
                    text-sm z-10
                  ">
                    <span id="selection-price">{selection.restaurant.priceRange}</span>
                  </div>
                )
              }

              <button onClick={shareResult}
                className="
                  absolute top-3 left-3
                  bg-fun-cream/95
                  backdrop-blur-md
                  border-[3px] border-fun-dark p-3
                  rounded-xl shadow-hard-hover
                  text-fun-dark
                  active:scale-95 transition-transform
                  z-20
                  cursor-pointer
                "
                title="Share"
                aria-label="Share Restaurant"
              >
                <Share2 className="w-6 h-6 stroke-[2.5px]" />
              </button>
          </figure>

          <div className="p-6 flex-1 flex flex-col relative">
            <div className="
              absolute -top-5 left-6
              bg-fun-green
              border-[3px] border-fun-dark rounded-full
              px-3 py-1
              font-bold text-white
              shadow-hard-hover
              flex items-center
              gap-1
              transform -rotate-3
              z-20
            ">
              <Star className="w-4 h-4 fill-fun-cream" />
              <span id="selection-rating">{ selection?.restaurant?.rating ?? "" }</span>
            </div>

            <h3 id="selection-name"
              className="font-pop text-3xl text-fun-dark leading-tight mb-2 mt-2">
              { selection?.restaurant?.name ?? "" }
            </h3>

            {
              selection?.restaurant?.description && (
                <p
                  id="selection-desc"
                  className="
                    font-sans font-medium
                    text-fun-dark/70 text-lg
                    leading-snug mb-4 line-clamp-3
                  ">
                  {selection.restaurant.description}
                </p>
              )
            }

            <div className="mt-auto space-y-3">
              <address className="flex flex-col gap-2 text-fun-dark font-bold font-sans text-sm not-italic">
                {
                  selection?.restaurant?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-fun-red shrink-0" />
                      <span id="selection-address">{ selection.restaurant.address ?? "" }</span>
                    </div>
                  )
                }

                {
                  selection?.restaurant?.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-fun-blue shrink-0" />
                      <a
                        id="selection-phone"
                        href="#"
                        className="hover:underline decoration-2 decoration-fun-blue"
                      >{selection?.restaurant?.phoneNumber}</a>
                    </div>
                  )
                }
              </address>

              {
                selection?.restaurant?.tagNames?.length > 0 ? (
                  <div id="selection-tags"
                    className="flex gap-2 flex-wrap pt-2">
                    {selection.restaurant.tagNames.map(tagName => {
                      return (
                        <span
                          key={tagName}
                          className="
                            px-2 py-1
                            bg-fun-cream
                            border-2 border-fun-dark rounded-lg
                            text-xs font-bold
                          ">
                          {tagName}
                        </span>
                      );
                    })}
                  </div>
                ) : null
              }
            </div>
          </div>
        </article>

        <div className="flex gap-3">
          <button
            onClick={reRoll}
            className="w-20
              bg-fun-yellow
              border-4 border-fun-dark rounded-2xl
              flex items-center justify-center
              shadow-hard transition-transform active:translate-y-1 active:shadow-none hover:brightness-110
              cursor-pointer
            "
            title="Spin Again"
            aria-label="Reroll">
            <RefreshCw className="w-8 h-8 stroke-[3px] text-fun-dark" />
          </button>

          {selection?.restaurant?.location?.latitude && selection?.restaurant?.location?.longitude && (
            <a
              href={createMapLink(selection.restaurant.location, selection.restaurant.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex-1 bg-fun-green
                border-4 border-fun-dark rounded-2xl
                py-4
                shadow-hard flex items-center justify-center
                gap-2 transition-transform active:translate-y-1 active:shadow-none hover:brightness-110
                cursor-pointer
              "
            >
              <span className="font-pop text-2xl text-fun-dark uppercase tracking-wide">Let's Eat!</span>
              <Navigation className="w-6 h-6 stroke-[3px] text-fun-dark" />
            </a>
          ) }
        </div>
      </div>
    </main>
  );
}
