// TODO use tsparticles?
export default function FoodRain() {
    return (
      <div id="rain-container"
          role="presentation"
          aria-hidden="true">
          <canvas data-generated="true"
                  className="w-full h-full fixed z-0 top-0 left-0 pointer-events-none"
                  aria-hidden="true" 
                  width="750" 
                  height="1334">
          </canvas>
      </div>
    );
}