import { Phone } from "lucide-react";

export function PhoneLink({ nationalPhoneNumber, internationalPhoneNumber }: {
  nationalPhoneNumber: string | null | undefined;
  internationalPhoneNumber: string | null | undefined;
}) {
  if (nationalPhoneNumber && nationalPhoneNumber.length > 0 || internationalPhoneNumber && internationalPhoneNumber.length > 0) {
    return (
      <div id="candidate-address" className="flex items-center gap-2">
        <Phone className="w-5 h-5 text-fun-blue shrink-0" />
        <a
          id="candidate-phone"
          href={`tel:${internationalPhoneNumber ?? nationalPhoneNumber}`}
          className="hover:underline decoration-2 decoration-fun-blue"
        >
          {nationalPhoneNumber || internationalPhoneNumber}
        </a>
      </div>
    );
  } else {
    return null;
  }
}
