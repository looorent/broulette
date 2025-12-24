import { findTagIcon } from "@features/tag";
import { createElement } from "react";

export function RestaurantTag({ id, label }: { id: string, label: string }) {
  const icon = findTagIcon(id);
  return (
    <span className="
      inline-flex items-center
      px-2 py-1
      bg-fun-cream
      border-2 border-fun-dark rounded-lg
      text-xs font-bold
    ">
      {icon && (createElement(icon, { className: "w-3 h-3 mr-1.5" }))}
      {label}
    </span>
  );
}
