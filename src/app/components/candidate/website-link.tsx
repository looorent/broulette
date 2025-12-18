import {
  Globe
} from "lucide-react";

import { SiDeliveroo, SiFacebook, SiGoogle, SiInstagram, SiTripadvisor, SiUbereats } from "@icons-pack/react-simple-icons";

type WebsiteLinkConfiguration = {
  icon: React.ElementType;
  label: string;
  colorClass: string;
};

interface LinkFactory {
  matches: (lowerUrl: string) => boolean;
  configuration: WebsiteLinkConfiguration;
}

const FACTORIES: LinkFactory[] = [
  {
    matches: (lowerUrl: string) => lowerUrl.includes("facebook.com"),
    configuration: {
      icon: SiFacebook,
      label: "Facebook",
      colorClass: "text-[#1877F2]"
    }
  },
  {
    matches: (lowerUrl: string) => lowerUrl.includes("instagram.com"),
    configuration: {
      icon: SiInstagram,
      label: "Instagram",
      colorClass: "text-[#E4405F]"
    }
  },
  {
    matches: (lowerUrl: string) => lowerUrl.includes("tripadvisor"),
    configuration: {
      icon: SiTripadvisor,
      label: "TripAdvisor",
      colorClass: "text-[#00AF87]"
    }
  },
  {
    matches: (lowerUrl: string) => lowerUrl.includes("google") || lowerUrl.includes("goo.gl"),
    configuration: {
      icon: SiGoogle,
      label: "Google",
      colorClass: "text-[#4285F4]"
    }
  },
  {
    matches: (lowerUrl: string) => lowerUrl.includes("deliveroo"),
    configuration: {
      icon: SiDeliveroo,
      label: "Deliveroo",
      colorClass: "text-[#00CCBC]"
    }
  },
  {
    matches: (lowerUrl: string) => lowerUrl.includes("ubereats"),
    configuration: {
      icon: SiUbereats,
      label: "UberEats",
      colorClass: "text-[#06C167]"
    }
  }
];

const DEFAULT_FACTORY: LinkFactory = {
  matches: (lowerUrl: string) => lowerUrl.includes("ubereats"),
  configuration: {
    icon: Globe,
    label: "Website",
    colorClass: "text-fun-dark"
  }
}

function findWebsiteConfig(url: string): WebsiteLinkConfiguration {
  const lowerUrl = url.toLowerCase();
  return FACTORIES.find(factory => factory.matches(lowerUrl))?.configuration || DEFAULT_FACTORY.configuration;
}

export function WebsiteLink({ url }: { url: string | null | undefined }) {
  if (url) {
    const { icon: Icon, label, colorClass } = findWebsiteConfig(url);
    return (
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 shrink-0 ${colorClass}`} />
        <a href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline decoration-2"
        >
          {label}
        </a>
      </div>
    );
  } else {
    return null;
  }
}
