import Image from "next/image";

const LOGO_WIDTH = 322;
const LOGO_HEIGHT = 490;

const HEIGHTS = {
  sm: 40,
  lg: 100,
  xl: 140,
} as const;

type Wc26LogoProps = {
  size?: keyof typeof HEIGHTS;
  priority?: boolean;
};

export function Wc26Logo({ size = "sm", priority }: Wc26LogoProps) {
  const height = HEIGHTS[size];
  const width = Math.round((LOGO_WIDTH / LOGO_HEIGHT) * height);

  return (
    <Image
      src="/wc26-logo.png"
      alt="FIFA World Cup 2026"
      width={width}
      height={height}
      className="shrink-0 object-contain"
      priority={priority ?? size !== "sm"}
    />
  );
}
