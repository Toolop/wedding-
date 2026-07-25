export default function CornerFrame({ tight = false }: { tight?: boolean }) {
  if (tight) {
    return (
      <>
        <div className="pointer-events-none absolute top-0 left-0 h-3.5 w-3.5 border-t border-l border-accent/40" />
        <div className="pointer-events-none absolute top-0 right-0 h-3.5 w-3.5 border-t border-r border-accent/40" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-3.5 w-3.5 border-b border-l border-accent/40" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-3.5 w-3.5 border-b border-r border-accent/40" />
      </>
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t border-l border-accent/40" />
      <div className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t border-r border-accent/40" />
      <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-accent/40" />
      <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-accent/40" />
    </>
  );
}
