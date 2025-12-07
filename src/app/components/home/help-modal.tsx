import { Cookie, MapPin, Scale, Server, ShieldCheck } from "lucide-react";
import { AlertBox } from "../alert-box";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function PhilosophyItem({ title, description} : { title: string, description: string}) {
  return (
    <li className="flex gap-2">
      <span><strong>{title}:</strong> {description}</span>
    </li>
  );
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <AlertBox
      isOpen={isOpen}
      onClose={onClose}
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
      <div className="space-y-8 text-fun-dark font-sans pb-4 select-text">
        <h2 className="font-pop text-3xl text-fun-red text-center transform -rotate-2 mt-8">
          Serendipity, Served.
        </h2>

        <section className="text-center space-y-4">
          <h3 className="hidden">Principle</h3>

          <p className="text-sm italic opacity-80 max-w-sm mx-auto">
            In a world of infinite choices, the hardest question is often, <em>"Where should we eat?"</em>
          </p>

          <p className="text-sm leading-relaxed">
            <strong>BiteRoulette</strong> eliminates the paradox of choice.
            We don't waste time looking for the "best" rated spot; we embrace the chaos of chance. We cut through the noise of reviews to serve you one completely random destination near you.
            Whether it's a hidden gem, a greasy spoon, or a total mystery—stop scrolling and roll the dice.
          </p>

          <div className="bg-fun-dark/5 p-4 rounded-lg border-2 border-fun-dark/10 text-left mx-auto max-w-sm">
            <h3 className="font-bold text-xs uppercase tracking-widest mb-3 text-center border-b border-fun-dark/10 pb-2">The Philosophy</h3>
            <ul className="space-y-2 text-sm list-none">
              <PhilosophyItem title="Zero Friction" description="No scrolling, no debating." />
              <PhilosophyItem title="Local Discovery" description="Uncover hidden gems." />
              <PhilosophyItem title="Pure Spontaneity" description="Let fate decide." />
            </ul>
          </div>

          <div className="font-display text-lg text-fun-dark">
            <p>Press the button. Embrace the unknown.</p>
            <p className="text-fun-red">Bon appétit.</p>
          </div>
        </section>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="grow border-t-2 border-fun-dark/10"></div>
          <ShieldCheck className="w-5 h-5 shrink-0 mx-4 text-fun-dark/30" />
          <div className="grow border-t-2 border-fun-dark/10"></div>
        </div>

        {/* --- PART 2: PRIVACY --- */}
        <section className="text-left space-y-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold uppercase tracking-wide font-pop">Privacy - The "No-Nonsense" Approach</h3>
            <p className="text-[10px] opacity-50 mt-1">Last Updated: December 7, 2025</p>
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
                  <strong>Security Note:</strong> We use cookies strictly for protection, not profit. Aside from Google's tool to block bots, our cookies are just there to prevent unauthorized activity and keep the site secure.
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
