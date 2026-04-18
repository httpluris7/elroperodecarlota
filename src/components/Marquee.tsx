export default function Marquee({ text, repeat = 6 }: { text: string; repeat?: number }) {
  const content = Array(repeat)
    .fill(null)
    .map((_, i) => (
      <span key={i} className="flex items-center gap-6 px-6">
        <span>{text}</span>
        <span className="text-gold text-lg">&#10022;</span>
      </span>
    ));

  return (
    <div className="overflow-hidden bg-foreground text-background py-3 select-none">
      <div className="flex whitespace-nowrap animate-marquee">
        {content}
        {content}
      </div>
    </div>
  );
}
