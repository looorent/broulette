import { Phone } from "lucide-react";

export function PhoneLink({ nationalPhoneNumber, internationalPhoneNumber }: {
  nationalPhoneNumber: string | null | undefined;
  internationalPhoneNumber: string | null | undefined;
}) {
  if (nationalPhoneNumber && nationalPhoneNumber.length > 0 || internationalPhoneNumber && internationalPhoneNumber.length > 0) {
    return (
      <div id="candidate-address" className="flex items-center gap-2">
        <Phone className="h-5 w-5 shrink-0 text-fun-blue" />
        <a
          id="candidate-phone"
          href={`tel:${internationalPhoneNumber ?? nationalPhoneNumber}`}
          className={`
            max-w-fit cursor-pointer truncate whitespace-nowrap decoration-2
            hover:underline
          `}
        >
          {nationalPhoneNumber || internationalPhoneNumber}
        </a>
      </div>
    );
  } else {
    return null;
  }
}
