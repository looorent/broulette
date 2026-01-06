import {
  AlertTriangle,
  Cookie,
  Lightbulb,
  Mail,
  Map,
  MapPin,
  Scroll,
  Server,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useState } from "react";

import { AlertBox } from "@components/alert/box";
import type { AppConfiguration } from "@config/server";

import { TabButton, type TabType } from "./tab-button";

interface HelpModalProps {
  configuration: AppConfiguration;
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ configuration, isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("about");

  return (
    <AlertBox
      isOpen={isOpen}
      onClose={onClose}
      variant="default"
      showCloseButton={true}
      contentClassName="h-full"
      actions={<CloseButton onClick={onClose} />}
    >
      <div className={`
        flex h-full flex-col overflow-hidden font-sans select-text
      `}>

        {/* Header Section */}
        <div className={`
          mt-8 mb-4 shrink-0 text-center
          sm:mb-8
        `}>
          <h2 className={`
            mb-4 -rotate-2 transform text-center font-pop text-3xl text-fun-red
          `}>
            Serendipity, Served.
          </h2>

          <p className={`
            mb-4 text-sm opacity-80
            sm:mb-8
          `}>
            In a world of infinite choices, the hardest question is often, <em>"Where should we eat?"</em>
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-4 flex shrink-0 gap-4 border-b-2 border-fun-dark/5">
          <TabButton id="about" label="Recipe" icon={Sparkles} activeTab={activeTab} onSelected={setActiveTab} />
          <TabButton id="privacy" label="Diet" icon={ShieldCheck} activeTab={activeTab} onSelected={setActiveTab} />
          <TabButton id="legal" label="Ingredients" icon={Scroll} activeTab={activeTab} onSelected={setActiveTab} />
        </div>

        {/* Tab Content Container */}
        <div className={`
          min-h-0 flex-1 space-y-6 overflow-y-auto pr-2 duration-200
        `}>
          {activeTab === "about" && <RecipeTab />}
          {activeTab === "privacy" && <DietTab configuration={configuration} />}
          {activeTab === "legal" && <IngredientsTab configuration={configuration} />}
        </div>
      </div>
    </AlertBox>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex w-full -rotate-1 cursor-pointer justify-center rounded-md
        border-2 border-fun-dark bg-fun-dark px-4 py-2 font-pop text-sm
        font-bold tracking-wider text-fun-cream uppercase shadow-hard
        transition-all duration-150 ease-out
        hover:translate-x-0.5 hover:translate-y-0.5 hover:scale-105
        hover:rotate-0 hover:shadow-none
        sm:ml-3 sm:w-auto
      `}
    >
      Understood
    </button>
  );
}

function RecipeTab() {
  return (
    <section className="space-y-6 text-center">
      <p className="text-left text-sm leading-relaxed text-fun-dark">
        <strong>BiteRoulette</strong> eliminates the paradox of choice.
        We don't waste time looking for the "best" rated spot; we embrace the chaos of chance. We cut through the noise of reviews to serve you one completely random destination near you.
      </p>

      <div className={`
        mx-auto rounded-lg border-2 border-fun-dark/10 bg-fun-dark/5 p-4
        text-left
      `}>
        <h3 className={`
          mb-3 border-b border-fun-dark/10 pb-2 text-center text-xs font-bold
          tracking-widest uppercase
        `}>The Philosophy</h3>
        <ul className="list-none space-y-2 text-sm">
          <PhilosophyItem title="Zero Friction" description="No scrolling, no debating." />
          <PhilosophyItem title="Local Discovery" description="Uncover hidden gems." />
          <PhilosophyItem title="Pure Spontaneity" description="Let fate decide." />
        </ul>
      </div>

      <div className="mt-8 flex justify-end">
        <div className={`
          flex items-center justify-center gap-2 p-2 font-display text-xs
          text-fun-dark
        `}>
          <span>
            Original idea by <em>Natacha</em>
          </span>
          <Lightbulb className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
}

function DietTab({ configuration }: { configuration: AppConfiguration }) {
  return (
    <section className="space-y-5 text-left">
      <h3 className="hidden">Privacy</h3>
      <p className="text-left text-sm leading-relaxed text-fun-dark">
        We treat your data with the same respect we treat your dinner plans: strictly private and to the point.
      </p>

      <div className="flex items-start gap-3">
        <div className="mt-1 shrink-0 rounded-lg bg-fun-red/10 p-2">
          <Cookie className="h-5 w-5 text-fun-red" />
        </div>
        <div>
          <h4 className="mb-1 text-sm font-bold tracking-wide uppercase">The Zero-Tracking Diet</h4>
          <p className="mb-2 text-xs leading-relaxed">
            We are here to feed you, not your browser. We do not use tracking cookies or marketing pixels.
          </p>
          <p className={`
            rounded border border-fun-dark/10 bg-fun-dark/5 p-2 text-xs
            text-fun-dark/80
          `}>
            <strong>Security Note:</strong> We use cookies strictly for protection, not profit. Our cookies are just there to prevent unauthorized activity and keep the site secure.
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-start gap-3">
        <div className="mt-1 shrink-0 rounded-lg bg-blue-100 p-2">
          <MapPin className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h4 className="mb-1 text-sm font-bold tracking-wide uppercase">Your Location Data</h4>
          <ul className="list-none space-y-1 text-xs opacity-80">
            <li><strong>Collection:</strong> Only when you tap search ("feed me").</li>
            <li><strong>Processing:</strong> Anonymized and sent to mapping providers (Google/Overpass/TripAdvisor).</li>
            <li><strong>Storage:</strong> Coordinates logged only to refine algorithms.</li>
          </ul>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-1 shrink-0 rounded-lg bg-indigo-100 p-2">
          <Server className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h4 className="mb-1 text-sm font-bold tracking-wide uppercase">Fortress Europe</h4>
          <p className="text-xs leading-relaxed opacity-80">
            Your data is securely anchored in <strong>Frankfurt, Germany</strong> (eu-central-1).
          </p>
        </div>
      </div>

      <p className="mt-1 text-[10px] opacity-70">Last Updated: {configuration.privacy.updatedAt}</p>
    </section>
  );
}

function IngredientsTab({ configuration }: { configuration: AppConfiguration }) {
  return (
    <section className="space-y-6 text-left">
      <h3 className="hidden">Legal</h3>

      <div className={`
        flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50
        p-4
      `}>
        <AlertTriangle className="h-6 w-6 shrink-0 text-orange-500" />
        <div>
          <h4 className={`
            mb-1 text-sm font-bold tracking-wide text-orange-800 uppercase
          `}>Disclaimer: We Pick, You Verify</h4>
          <p className="text-xs leading-relaxed text-orange-900/80">
            BiteRoulette provides random suggestions based on third-party data. We do not guarantee the quality, safety, or operating hours of any location. Always check open times and reviews before you travel. Eat responsibly.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-1 shrink-0 rounded-lg bg-fun-cream p-2">
          <Map className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h4 className="mb-1 text-sm font-bold tracking-wide uppercase">Data Sources</h4>
          <p className="text-xs leading-relaxed opacity-80">
            Powered by <strong>Google Maps Platform</strong>, <strong>TripAdvisor</strong> and <strong>OpenStreetMap</strong>. <br />
            Icons provided by <strong>Lucide</strong> and <strong>SimpleIcons</strong>.
          </p>
        </div>
      </div>

      {/* Feedback Loop */}
      <div className="flex items-start gap-3">
        <div className="mt-1 shrink-0 rounded-lg bg-purple-100 p-2">
          <Mail className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h4 className="mb-1 text-sm font-bold tracking-wide uppercase">Feedback & Rights</h4>
          <p className="mb-2 text-xs leading-relaxed opacity-80">
            Found a bug? The dice got stuck? Or wish to request a data purge?
          </p>
          <a href={"mailto:" + configuration.privacy.contactEmail} className={`
            text-sm font-bold text-fun-dark underline decoration-fun-red
            decoration-2 transition-all
            hover:decoration-fun-dark
          `}>
            {configuration.privacy.contactEmail}
          </a>
        </div>
      </div>

      {/* Version */}
      <div className="text-center opacity-30">
        <p className="text-xs tracking-widest uppercase">v{configuration.version}</p>
      </div>
    </section>
  );
}

function PhilosophyItem({ title, description }: { title: string, description: string }) {
  return (
    <li className="flex gap-2">
      <span className="text-fun-dark"><strong>{title}:</strong> {description}</span>
    </li>
  );
}
