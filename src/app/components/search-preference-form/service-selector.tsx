import { useDrag } from "@use-gesture/react";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { findIconFor, type ServicePreference } from "@features/search";

interface ServiceSelectorProps {
  services: ServicePreference[];
  selectedService: ServicePreference | null;
  className?: string;
  onChange: (service: ServicePreference) => void;
}

export default function ServiceSelector({ services, selectedService, className = "", onChange } : ServiceSelectorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const bindTimeslotScroll = useDrag(({ _active, movement: [mx], event, memo = ref.current?.scrollLeft }) => {
    event.stopPropagation();
    if (ref.current) {
      ref.current.scrollLeft = memo - mx;
    }
    return memo;
  }, {
    axis: "x",
    filterTaps: true,
    from: () => [ref.current?.scrollLeft || 0, 0],
    eventOptions: { passive: false },
    pointer: { touch: false }
  });

  const [serviceId, setServiceId] = useState(selectedService?.id);
  useEffect(() => {
    setServiceId(selectedService?.id);
  }, [selectedService?.id]);

  const updateValue = (newServiceId: string) => {
    if (newServiceId?.length > 0 && newServiceId !== selectedService?.id) {
      const newService = services.find(service => service.id === newServiceId) || services[0];
      setServiceId(newService.id);
      onChange(newService);
    }
  };

  return (
    <fieldset className={`
      relative m-0 min-w-0 space-y-3 border-none p-0
      ${className}
    `}>
      <legend className={`
        mb-2 block font-pop text-2xl tracking-wide text-fun-dark
      `}>When?</legend>
      <div className={`
        pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-24
        rounded-r-xl
      `} aria-hidden="true"></div>
      <div id="time-scroll-container"
        ref={ref}
        {...bindTimeslotScroll()}
        className={`
          flex max-w-full cursor-grab touch-pan-x touch-pan-y snap-x
          snap-mandatory gap-4 overflow-x-auto p-1 pr-24 select-none
          [-ms-overflow-style:none]
          [scrollbar-width:none]
          active:cursor-grabbing
          [&::-webkit-scrollbar]:hidden
        `} role="radiogroup">

          {services.map((service) => {
            const Icon = findIconFor(service);
            return (
            <label className={`
              group relative w-32 flex-none cursor-pointer
              ${service.isAvailable ? "" : "cursor-not-allowed"}
            `} key={service.id}>
              <input type="radio"
                name="time"
                value={service.id}
                className="peer sr-only"
                disabled={!service.isAvailable}
                onChange={event => updateValue(event.target.value)}
                checked={service.id === serviceId} />
              <div className={`
                flex h-full flex-col items-center justify-center gap-2
                rounded-2xl border-4 border-fun-dark/10 bg-white p-4
                transition-all
                group-hover:border-fun-dark/30
                peer-checked:border-fun-dark peer-checked:bg-fun-yellow
                peer-checked:shadow-hard
              `}>
                  { Icon && (<Icon className={`
                    h-8 w-8 stroke-[2.5px] text-fun-dark
                  `} />) }
                  <span className={`
                    text-center font-sans leading-none font-bold tracking-tight
                    text-fun-dark uppercase
                  `}>{service.label?.display}</span>
                </div>
                <div className={`
                  absolute -top-1 -right-1 z-10 scale-0 rounded-full border-2
                  border-fun-dark bg-fun-green p-1 opacity-0 shadow-hard-hover
                  transition-opacity duration-200
                  peer-checked:scale-100 peer-checked:opacity-100
                `}>
                  <Check className="h-4 w-4 stroke-[4px] text-fun-cream" />
                </div>

                {!service.isAvailable && (
                  <div className={`
                    pointer-events-none absolute inset-0 z-20 flex items-center
                    justify-center overflow-hidden rounded-2xl
                  `}>
                    <div className={`
                      -rotate-12 border-y-2 border-dashed border-white/20
                      bg-fun-dark px-8 py-1 text-[10px] font-extrabold
                      tracking-widest whitespace-nowrap text-white uppercase
                      shadow-md
                    `}>
                      Coming Soon
                    </div>
                  </div>
                )}
              </label>
            );
          })}
        </div>
    </fieldset>
  );
}
