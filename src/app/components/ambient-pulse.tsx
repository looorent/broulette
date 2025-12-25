export function AmbientPulse() {
  return (
    <div className={`
      pointer-events-none absolute z-0 h-56 w-56 animate-pulse-mega rounded-full
      bg-fun-cream/30 transition-colors duration-500
    `}
      aria-hidden="true"
    />
  );
}
