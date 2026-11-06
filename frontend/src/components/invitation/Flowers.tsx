/** baby's-breath and greenery cut-outs (transparent SVGs in /public/images/flowers) */
const SRC = {
  spray: "/images/flowers/gypsophila-spray.svg",
  sprig: "/images/flowers/gypsophila-sprig.svg",
  leaves: "/images/flowers/leaf-spray.svg",
} as const;

export type FlowerKind = keyof typeof SRC;

export function Flower({ kind, className = "" }: { kind: FlowerKind; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={SRC[kind]} alt="" aria-hidden draggable={false} className={`pointer-events-none select-none ${className}`} />
  );
}

/**
 * Corner bouquets framing a full-screen stage, like flowers laid around a card.
 * `front` adds two small sprigs that tuck over the window's corners on wide screens.
 */
export function FlowerFrame({ front = false }: { front?: boolean }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* top-left: leaves and a spray hanging down from the corner */}
        <Flower kind="leaves" className="absolute -left-6 -top-8 w-40 rotate-[150deg] opacity-90 sm:w-60 lg:w-72" />
        <Flower kind="spray" className="absolute -left-10 -top-10 w-48 rotate-[165deg] sm:w-80 lg:w-[26rem]" />
        {/* bottom-right */}
        <Flower kind="leaves" className="absolute -bottom-6 -right-4 w-40 -scale-x-100 opacity-90 sm:w-60 lg:w-72" />
        <Flower kind="spray" className="absolute -bottom-8 -right-10 w-52 -scale-x-100 sm:w-80 lg:w-[26rem]" />
        {/* small sprigs on the other two corners */}
        <Flower kind="sprig" className="absolute -right-6 -top-10 w-24 rotate-[200deg] opacity-80 sm:w-32" />
        <Flower kind="sprig" className="absolute -bottom-10 -left-6 w-24 rotate-[10deg] opacity-80 sm:w-32" />
      </div>
      {front && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 hidden overflow-hidden lg:block">
          <Flower kind="sprig" className="absolute -top-4 left-[calc(50%-39rem)] w-32 -rotate-[50deg]" />
          <Flower kind="sprig" className="absolute -bottom-4 right-[calc(50%-39rem)] w-32 rotate-[130deg]" />
        </div>
      )}
    </>
  );
}
