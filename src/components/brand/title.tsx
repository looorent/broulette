export function BrandTitle() {
  return (
    <header className={`
      relative animate-float text-center
      landscape:hidden
      md:landscape:block
    `}>
      <h1 className={`
        mb-4 flex flex-col items-center font-display text-6xl leading-[0.9]
        tracking-tighter text-white drop-shadow-[5px_5px_0px_rgba(45,52,54,1)]
        md:text-5xl
      `}>
        <span className={`
          -rotate-6 transform transition duration-300
          hover:rotate-0
        `}>TOO</span>
        <span className={`
          rotate-3 transform text-fun-yellow transition duration-300
          hover:rotate-0
        `}>LAZY</span>
        <span className={`
          -rotate-2 transform transition duration-300
          hover:rotate-0
        `}>TO</span>
        <span className={`
          rotate-6 transform transition duration-300
          hover:rotate-0
        `}>PICK?</span>
      </h1>
      <div className={`
        mt-4 inline-block -rotate-2 transform rounded-full bg-fun-dark px-4 py-2
        text-fun-cream shadow-hard-white
      `}>
        <p className={`
          text-sm font-bold tracking-widest uppercase
          md:text-xs
        `}>We choose, you eat.</p>
      </div>
    </header>
  );
}
