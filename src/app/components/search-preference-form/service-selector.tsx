import { findIconFor, type ServicePreference } from "@features/search";
import { useDrag } from "@use-gesture/react";
import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ServiceSelectorProps {
  services: ServicePreference[];
  selectedService: ServicePreference | null;
  className?: string;
  onChange: (service: ServicePreference) => void;
}


export default function ServiceSelector({ services, selectedService, className = "", onChange } : ServiceSelectorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const bindTimeslotScroll = useDrag(({ active, movement: [mx], event, memo = ref.current?.scrollLeft }) => {
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
    <fieldset className={`space-y-3 relative border-none p-0 m-0 min-w-0 ${className}`}>
      <legend className="block font-pop text-2xl text-fun-dark tracking-wide mb-2">When?</legend>
      <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10 rounded-r-xl" aria-hidden="true"></div>
      <div id="time-scroll-container"
        ref={ref}
        {...bindTimeslotScroll()}
        className="
          flex gap-4
          p-1 pr-24
          overflow-x-auto
          [&::-webkit-scrollbar]:hidden
          [-ms-overflow-style:none]
          [scrollbar-width:none]
          cursor-grab active:cursor-grabbing select-none
          touch-pan-y touch-pan-x
          snap-x snap-mandatory
          max-w-full
        " role="radiogroup">

          {services.map((service) => {
            const Icon = findIconFor(service);
            return (
            <label className={`
              cursor-pointer group relative flex-none w-32
              ${service.isAvailable ? "cursor-pointer" : "cursor-not-allowed"}
            `} key={service.id}>
              <input type="radio"
                name="time"
                value={service.id}
                className="peer sr-only"
                disabled={!service.isAvailable}
                onChange={event => updateValue(event.target.value)}
                checked={service.id === serviceId} />
              <div className="
                h-full rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all
                border-4
                bg-white
                border-fun-dark/10
                group-hover:border-fun-dark/30
                peer-checked:border-fun-dark
                peer-checked:bg-fun-yellow
                peer-checked:shadow-hard
              ">
                  { Icon && (<Icon className="w-8 h-8 stroke-[2.5px] text-fun-dark" />) }
                  <span className="font-sans font-bold text-fun-dark uppercase tracking-tight text-center leading-none">{service.label?.display}</span>
                </div>
                <div className="absolute -top-1 -right-1 bg-fun-green border-2 border-fun-dark rounded-full p-1 opacity-0 peer-checked:opacity-100 transition-opacity shadow-hard-hover scale-0 peer-checked:scale-100 duration-200 z-10">
                  <Check className="w-4 h-4 text-fun-cream stroke-[4px]" />
                </div>

                {!service.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center z-20 overflow-hidden rounded-2xl pointer-events-none">
                    <div className="
                      bg-fun-dark text-white
                      text-[10px] font-extrabold tracking-widest uppercase
                      px-8 py-1
                      -rotate-12
                      shadow-md
                      border-y-2 border-dashed border-white/20
                      whitespace-nowrap
                    ">
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
