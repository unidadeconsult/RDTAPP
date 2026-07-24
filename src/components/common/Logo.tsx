export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  }[size];

  return (
    <span className={`font-heading font-bold tracking-tight ${sizeClass}`}>
      <span className="text-blue">Kylian</span>
      <span className="text-green">+</span>
      <span className="text-blue-dark dark:text-white">Movic</span>
    </span>
  );
}
