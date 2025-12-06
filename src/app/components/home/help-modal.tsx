import { Cookie, MapPin, Scale, Server, ShieldCheck } from "lucide-react";
import { AlertBox } from "../alert-box";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// TODO review content and style
export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <AlertBox
      isOpen={isOpen}
      onClose={onClose}
      title="Our Story"
      variant="default"
      showCloseButton={true}
      actions={
        <button
          type="button"
          onClick={onClose}
          className="
            inline-flex w-full justify-center rounded-md
            bg-fun-dark px-4 py-2
            text-sm font-bold uppercase tracking-wider
            border-2 border-transparent
            hover:bg-fun-dark/90 hover:shadow-lg
            text-fun-cream
            transition-all duration-150 ease-out
            sm:ml-3 sm:w-auto
            font-pop
          "
        >
          Understood
        </button>
      }
    >
      <div className="space-y-8 text-fun-dark font-sans pb-4">

        {/* --- PART 1: THE EXPERIENCE --- */}
        <section className="text-center space-y-4">
          <h2 className="font-display text-3xl text-fun-red transform -rotate-2 mt-2">
            Serendipity, Served.
          </h2>

          <p className="text-sm italic opacity-80 max-w-sm mx-auto">
            In a world of infinite choices, the hardest question is often, "Where should we eat?"
          </p>

          <p className="text-sm leading-relaxed">
            <strong>BiteRoulette</strong> eliminates the paradox of choice. We don't just find you a place to eat; we curate an adventure. By leveraging premium location data, we cut through the noise of thousands of reviews to deliver one decisive, high-quality destination near you.
          </p>

          <div className="bg-fun-dark/5 p-4 rounded-lg border-2 border-fun-dark/10 text-left mx-auto max-w-sm">
            <h4 className="font-bold text-xs uppercase tracking-widest mb-3 text-center border-b border-fun-dark/10 pb-2">The Philosophy</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-fun-red font-bold">01.</span>
                <span><strong>Zero Friction:</strong> No scrolling, no debating.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-fun-red font-bold">02.</span>
                <span><strong>Local Discovery:</strong> Uncover hidden gems.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-fun-red font-bold">03.</span>
                <span><strong>Pure Spontaneity:</strong> Let fate decide.</span>
              </li>
            </ul>
          </div>

          <p className="font-display text-lg text-fun-dark">
            Press the button. Embrace the unknown.<br />
            <span className="text-fun-red">Bon appétit.</span>
          </p>
        </section>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="grow border-t-2 border-fun-dark/10"></div>
          <span className="shrink-0 mx-4 text-fun-dark/30"><ShieldCheck className="w-5 h-5" /></span>
          <div className="grow border-t-2 border-fun-dark/10"></div>
        </div>

        {/* --- PART 2: PRIVACY --- */}
        <section className="text-left space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold uppercase tracking-wide font-pop">Privacy Declaration</h3>
            <p className="text-xs font-bold opacity-60 uppercase tracking-widest">The "No-Nonsense" Approach</p>
            <p className="text-[10px] opacity-50 mt-1">Last Updated: December 6, 2025</p>
            <p className="text-sm mt-3">
              We treat your data with the same respect we treat your dinner plans: strictly private and to the point. We believe in data minimalism.
            </p>
          </div>

          <div className="space-y-4">
            {/* Cookies */}
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-fun-red/10 rounded-lg shrink-0 mt-1">
                <Cookie className="w-5 h-5 text-fun-red" />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide mb-1">The Zero-Cookie Diet</h4>
                <p className="text-sm opacity-80 leading-relaxed">
                  We are here to feed you, not your browser. We do not use tracking cookies. You will not find marketing pixels or third-party ad trackers here.
                </p>
                <div className="mt-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-200 text-yellow-800">
                  <strong>Security Note:</strong> The only exception is Google’s Invisible reCAPTCHA. It runs silently to keep bots out, creating a temporary, necessary token.
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-blue-100 rounded-lg shrink-0 mt-1">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide mb-1">Your Location Data</h4>
                <p className="text-sm opacity-80 leading-relaxed mb-2">
                  To work our magic, we need to know where you stand.
                </p>
                <ul className="text-xs space-y-1 list-disc pl-4 opacity-80">
                  <li><strong>Collection:</strong> Only when you tap search.</li>
                  <li><strong>Processing:</strong> Anonymized and sent to mapping providers (Google/OSM).</li>
                  <li><strong>Storage:</strong> Coordinates logged only to refine algorithms.</li>
                </ul>
              </div>
            </div>

            {/* Storage */}
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-indigo-100 rounded-lg shrink-0 mt-1">
                <Server className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide mb-1">Fortress Europe</h4>
                <p className="text-sm opacity-80 leading-relaxed">
                  Your data is securely anchored in <strong>Frankfurt, Germany</strong> (eu-central-1). We utilize Render (AWS infrastructure), ensuring rigorous European security standards.
                </p>
              </div>
            </div>

            {/* Rights */}
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-emerald-100 rounded-lg shrink-0 mt-1">
                <Scale className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide mb-1">Your Rights</h4>
                <p className="text-sm opacity-80 leading-relaxed">
                  Your data belongs to you. If you wish to review or purge your data, simply contact us.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AlertBox>
  );
}
