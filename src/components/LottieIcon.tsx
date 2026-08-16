import type React from "react";
import { Component, lazy, Suspense, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import sparkle from "@/assets/lottie/sparkle.json";
import dots from "@/assets/lottie/dots.json";
import ring from "@/assets/lottie/ring.json";
import pulse from "@/assets/lottie/pulse.json";

const Lottie = lazy(async (): Promise<{ default: React.ComponentType<any> }> => {
  try {
    const mod: any = await import("lottie-react");
    const Comp = mod.default?.default ?? mod.default ?? mod;
    return { default: Comp };
  } catch {
    return { default: LottieErrorShim };
  }
});

function LottieErrorShim() {
  return null;
}

export const lottieAnimations = { sparkle, dots, ring, pulse } as const;
export type LottieName = keyof typeof lottieAnimations;

type Props = {
  name: LottieName;
  className?: string;
  loop?: boolean;
  /** px size, applied when no className sizing is provided */
  size?: number;
  /** Custom fallback shown if Lottie fails to load or crashes. */
  fallback?: ReactNode;
};

type ErrorBoundaryState = { hasError: boolean };

class LottieErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.warn("Lottie failed to render; using fallback UI.", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function DefaultFallback({ className, size }: { className?: string; size: number }) {
  return (
    <span
      className={cn("inline-block shrink-0 rounded-full bg-primary/80 align-middle", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

/**
 * Themed Lottie icon. Animations are authored in the app's coral/ink palette.
 * If the Lottie library fails to load or crashes, a themed fallback dot is shown
 * so the surrounding UI never crashes.
 */
export function LottieIcon({ name, className, loop = true, size = 24, fallback }: Props) {
  const fallbackNode = fallback ?? <DefaultFallback className={className} size={size} />;

  return (
    <span
      className={cn("inline-block shrink-0 align-middle", className)}
      style={className?.includes("h-") ? undefined : { width: size, height: size }}
      aria-hidden="true"
    >
      <Suspense fallback={fallbackNode}>
        <LottieErrorBoundary fallback={fallbackNode}>
          <Lottie animationData={lottieAnimations[name]} loop={loop} autoplay style={{ width: "100%", height: "100%" }} />
        </LottieErrorBoundary>
      </Suspense>
    </span>
  );
}
