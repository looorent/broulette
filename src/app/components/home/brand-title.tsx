export default function BrandTitle() {
  return (
    <header className="text-center relative animate-float">
      <h1 className="font-display text-6xl sm:text-7xl leading-[0.9] text-white drop-shadow-[5px_5px_0px_rgba(45,52,54,1)] tracking-tighter mb-4 flex flex-col items-center">
        <span className="transform -rotate-6 transition hover:rotate-0 duration-300">TOO</span>
        <span className="transform rotate-3 transition hover:rotate-0 duration-300 text-fun-yellow">LAZY</span>
        <span className="transform -rotate-2 transition hover:rotate-0 duration-300">TO</span>
        <span className="transform rotate-6 transition hover:rotate-0 duration-300">PICK?</span>
      </h1>
      <div className="inline-block bg-fun-dark text-fun-cream px-4 py-2 rounded-full transform -rotate-2 mt-4 shadow-hard-white">
        <p className="font-bold tracking-widest uppercase text-sm">We choose, you eat.</p>
      </div>
    </header>
  );
}
