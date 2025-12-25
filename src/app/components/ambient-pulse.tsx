export function AmbientPulse() {
  return (
    <div className={`
        absolute w-56 h-56 rounded-full pointer-events-none z-0
        animate-pulse-mega transition-colors duration-500
        bg-fun-cream/30
      `}
      aria-hidden="true"
    />
  );
}
