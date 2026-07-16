import { Wc26Logo } from "@/components/icons/Wc26Logo";

type Wc26MarkProps = {
  size?: "sm" | "lg";
};

export function Wc26Mark({ size = "sm" }: Wc26MarkProps) {
  return <Wc26Logo size={size === "lg" ? "lg" : "sm"} priority={size === "lg"} />;
}
