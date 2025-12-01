import { ChevronUp } from "lucide-react";
import { useState } from "react";

export async function PreferenceChip() {
    const [locationLabel, setLocationLabel] = useState("Near you");
    const [distanceLabel, setDistanceLabel] = useState("Walkable");
    const [momentLabel, setMomentLabel] = useState("Now");

    return (
        <section className="w-full px-2 pb-0">
            <button className="w-full bg-fun-green 
                border-4 border-b-0 border-fun-dark rounded-t-[3rem]
                p-4 pb-6 shadow-sheet flex flex-col 
                -mb-3
                items-center justify-center gap-2 
                transition-transform hover:translate-y-3 active:translate-y-0 cursor-pointer group relative z-40 animate-float">
                <div className="w-16 h-1.5 bg-fun-dark/20 rounded-full mb-0.5 transition-colors group-hover:bg-fun-dark/40"></div>
                <div className="flex items-center gap-2 font-pop text-fun-dark text-lg">
                    <span>{locationLabel}</span>
                    •
                    <span>{distanceLabel}</span>
                    •
                    <span>{momentLabel}</span>

                    <ChevronUp className="w-5 h-5 stroke-[3px]" />
                </div>
            </button>
        </section>
    );
}
