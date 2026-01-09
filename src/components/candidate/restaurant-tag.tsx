import { createElement } from "react";

import { findTagIcon } from "@features/tag";

export function RestaurantTag({ id, label }: { id: string, label: string }) {
  const icon = findTagIcon(id);
  return (
    <span className={`
      inline-flex items-center rounded-lg border-2 border-fun-dark bg-fun-cream
      px-2 py-1 text-xs font-bold
    `}>
      {icon && (createElement(icon, { className: "w-3 h-3 mr-1.5" }))}
      {label}
    </span>
  );
}
