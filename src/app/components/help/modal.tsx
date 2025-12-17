import { AlertBox } from "@components/alert/box";
import type { AppConfiguration } from "@config/server";
import {
  AlertTriangle,
  Cookie,
  Mail,
  Map,
  MapPin,
  Scroll,
  Server,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useState } from "react";

interface HelpModalProps {
  configuration: AppConfiguration;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "about" | "privacy" | "legal";

function PhilosophyItem({ title, description }: { title: string, description: string }) {
  return (
    <li className="flex gap-2">
      <span className="text-fun-dark"><strong>{title}:</strong> {description}</span>
    </li>
  );
}

export function HelpModal({ configuration, isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("about");

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center font-pop gap-2 pb-2 px-2 text-sm uppercase tracking-wide transition-all duration-200
        border-b-2
        cursor-pointer
        ${activeTab === id
          ? "border-fun-dark text-fun-dark"
          : "border-transparent text-fun-dark/40 hover:text-fun-dark hover:border-fun-dark/20"
        }
      `}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <AlertBox
      isOpen={isOpen}
      onClose={onClose}
      variant="default"
      showCloseButton={true}
      contentClassName="h-full"
      actions={
        <button
          type="button"
          onClick={onClose}
          className="
            inline-flex w-full justify-center rounded-md
            bg-fun-dark px-4 py-2
            text-sm font-bold uppercase tracking-wider
            border-2 border-fun-dark shadow-hard
            hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5
            text-fun-cream
            transition-all duration-150 ease-out
            sm:ml-3 sm:w-auto
            cursor-pointer
            -rotate-1 hover:rotate-0 hover:scale-105
            font-pop
          "
        >
          Understood
        </button>
      }
    >
      <div className="flex flex-col font-sans select-text h-full overflow-hidden">
        <div className="text-center mt-8 mb-4 sm:mb-8 shrink-0">
          <h2 className="font-pop text-3xl text-fun-red text-center transform -rotate-2 mb-4">
            Serendipity, Served.
          </h2>

          <p className="text-sm opacity-80 mb-4 sm:mb-8">
            In a world of infinite choices, the hardest question is often, <em>"Where should we eat?"</em>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b-2 border-fun-dark/5 mb-4 shrink-0">
          <TabButton id="about" label="Recipe" icon={Sparkles} />
          <TabButton id="privacy" label="Diet" icon={ShieldCheck} />
          <TabButton id="legal" label="Ingredients" icon={Scroll} />
        </div>

        {/* Tab Content Container */}
        <div className="flex-1
            min-h-0
            pr-2
            space-y-6
            animate-in fade-in zoom-in-95 duration-200
            overflow-y-auto
          ">

          {/* Tab 1: Concept */}
          {activeTab === "about" && (
            <section className="text-center space-y-6">
              <p className="text-sm leading-relaxed text-left text-fun-dark">
                <strong>BiteRoulette</strong> eliminates the paradox of choice.
                We don't waste time looking for the "best" rated spot; we embrace the chaos of chance. We cut through the noise of reviews to serve you one completely random destination near you.
              </p>

              <div className="bg-fun-dark/5 p-4 rounded-lg border-2 border-fun-dark/10 text-left mx-auto">
                <h3 className="font-bold text-xs uppercase tracking-widest mb-3 text-center border-b border-fun-dark/10 pb-2">The Philosophy</h3>
                <ul className="space-y-2 text-sm list-none">
                  <PhilosophyItem title="Zero Friction" description="No scrolling, no debating." />
                  <PhilosophyItem title="Local Discovery" description="Uncover hidden gems." />
                  <PhilosophyItem title="Pure Spontaneity" description="Let fate decide." />
                </ul>
              </div>

              <div className="font-display text-lg text-fun-dark pt-2">
                <p>Press the button. Embrace the unknown.</p>
                <p className="text-fun-red">Bon appétit.</p>
              </div>
            </section>
          )}

          {/* Tab 2: Privacy*/}
          {activeTab === "privacy" && (
            <section className="text-left space-y-5">
              <h3 className="hidden">Privacy</h3>
              <p className="text-sm leading-relaxed text-left text-fun-dark">
                We treat your data with the same respect we treat your dinner plans: strictly private and to the point.
              </p>


              {/* Cookies */}
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-fun-red/10 rounded-lg shrink-0 mt-1">
                  <Cookie className="w-5 h-5 text-fun-red" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-1">The Zero-Tracking Diet</h4>
                  <p className="text-xs leading-relaxed mb-2">
                    We are here to feed you, not your browser. We do not use tracking cookies or marketing pixels.
                  </p>
                  <p className="text-xs bg-fun-dark/5 p-2 rounded border border-fun-dark/10 text-fun-dark/80">
                    <strong>Security Note:</strong> We use cookies strictly for protection, not profit. Aside from Google's tool to block bots, our cookies are just there to prevent unauthorized activity and keep the site secure.
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-blue-100 rounded-lg shrink-0 mt-1">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-1">Your Location Data</h4>
                  <ul className="text-xs space-y-1 opacity-80 list-none">
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
                  <p className="text-xs opacity-80 leading-relaxed">
                    Your data is securely anchored in <strong>Frankfurt, Germany</strong> (eu-central-1). We utilize Render (AWS infrastructure), ensuring rigorous European security standards.
                  </p>
                </div>
              </div>


              <p className="text-[10px] opacity-70 mt-1">Last Updated: {configuration.privacy.updatedAt}</p>
            </section>
          )}

          {/* Tab 3: Legal */}
          {activeTab === "legal" && (
            <section className="text-left space-y-6">
              <h3 className="hidden">Legal</h3>

              {/* Liability */}
              <div className="flex gap-3 items-start bg-orange-50 p-4 rounded-lg border border-orange-200">
                <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-orange-800 uppercase tracking-wide mb-1">Disclaimer: We Pick, You Verify</h4>
                  <p className="text-xs text-orange-900/80 leading-relaxed">
                    BiteRoulette provides random suggestions based on third-party data. We do not guarantee the quality, safety, or operating hours of any location. Always check open times and reviews before you travel. Eat responsibly.
                  </p>
                </div>
              </div>

              {/* Attribution */}
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-fun-cream rounded-lg shrink-0 mt-1">
                  <Map className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-1">Data Sources</h4>
                  <p className="text-xs opacity-80 leading-relaxed">
                    Powered by <strong>Google Maps Platform</strong>. <br />
                    Icons provided by <strong>Lucide</strong>.
                  </p>
                </div>
              </div>

              {/* Feedback Loop */}
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-purple-100 rounded-lg shrink-0 mt-1">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wide mb-1">Feedback & Rights</h4>
                  <p className="text-xs opacity-80 leading-relaxed mb-2">
                    Found a bug? The dice got stuck? Or wish to request a data purge?
                  </p>
                  <a href={"mailto:" + configuration.privacy.contactEmail} className="text-sm font-bold text-fun-dark underline decoration-2 decoration-fun-red hover:decoration-fun-dark transition-all">
                    {configuration.privacy.contactEmail}
                  </a>
                </div>
              </div>

              {/* Version */}
              <div className="text-center pt-8 opacity-30">
                <p className="text-[10px] font-mono uppercase tracking-widest">v{configuration.version}</p>
              </div>
            </section>
          )}

        </div>
      </div>
    </AlertBox>
  );
}
