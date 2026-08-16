import { lazy, Suspense } from "react";
import { cn } from "@/lib/utils";
import sparkle from "@/assets/lottie/sparkle.json";
import dots from "@/assets/lottie/dots.json";
import ring from "@/assets/lottie/ring.json";
import pulse from "@/assets/lottie/pulse.json";

const Lottie = lazy(async () => {
  const mod: any = await import("lottie-react");
  const Comp = mod.default?.default ?? mod.default ?? mod;
  return { default: Comp };
});

export const lottieAnimations = { sparkle, dots, ring, pulse } as const;
export type LottieName = keyof typeof lottieAnimations;

type Props = {
  name: LottieName;
  className?: string;
  loop?: boolean;
  /** px size, applied when no className sizing is provided */
  size?: number;
};

/**
 * Themed Lottie icon. Animations are authored in the app's coral/ink palette.
 */
export function LottieIcon({ name, className, loop = true, size = 24 }: Props) {
  return (
    <span
      className={cn("inline-block shrink-0 align-middle", className)}
      style={className?.includes("h-") ? undefined : { width: size, height: size }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Lottie animationData={lottieAnimations[name]} loop={loop} autoplay style={{ width: "100%", height: "100%" }} />
      </Suspense>
    </span>
  );
}
