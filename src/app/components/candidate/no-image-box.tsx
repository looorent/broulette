export function NoImageBox() {
  return (
    <div className={`
      group relative flex h-full w-full items-center justify-center
      overflow-hidden bg-gray-200
    `}>
      <div className={`
        pointer-events-none absolute inset-0
        bg-[radial-gradient(#2d3436_2px,transparent_2px)] bg-size-[24px_24px]
        opacity-10
      `}>
      </div>

      <h2 className={`
        flex flex-col items-center font-display text-5xl leading-[0.9]
        tracking-tighter
        [-webkit-text-stroke:2px_#2d3436]
        [text-shadow:4px_4px_0px_#2d3436]
      `}>
        <span className={`
          -rotate-6 transform text-fun-cream transition duration-300
          hover:rotate-0
        `}>
          no
        </span>

        <span className={`
          rotate-6 transform text-fun-yellow transition duration-300
          hover:rotate-0
        `}>
          image
        </span>
      </h2>
    </div>
  );
};
