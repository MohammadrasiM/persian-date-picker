"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useDOMEffect, useReducedMotion, watchCssMotion } from "./animation.js";

type Snapshot = {
  key: string;
  render: (active: boolean) => ReactNode;
  view?: string;
};

type Props = {
  transitionKey: string;
  animation: "view" | "month";
  direction?: number;
  view?: string;
  className: string;
  children: Snapshot["render"];
};

export default function AnimatedSwap({
  transitionKey,
  animation,
  direction = 0,
  view,
  className,
  children,
}: Props) {
  const reducedMotion = useReducedMotion();
  const committed = useRef<Snapshot>({ key: transitionKey, render: children, view });
  const [swap, setSwap] = useState<{
    key: string;
    sequence: number;
    previous: Snapshot | null;
  }>({ key: transitionKey, sequence: 0, previous: null });

  if (swap.key !== transitionKey) {
    setSwap({
      key: transitionKey,
      sequence: swap.sequence + 1,
      previous: reducedMotion ? null : committed.current,
    });
  }
  useDOMEffect(() => {
    committed.current = { key: transitionKey, render: children, view };
  });

  return (
    <>
      {swap.previous && (
        <SwapLayer
          key={swap.previous.key}
          animation={animation}
          direction={direction}
          view={swap.previous.view}
          className={className}
          phase="exit"
          sequence={swap.sequence}
          onComplete={() => setSwap((current) =>
            current.sequence === swap.sequence ? { ...current, previous: null } : current,
          )}
        >
          {swap.previous.render(false)}
        </SwapLayer>
      )}
      <SwapLayer
        key={transitionKey}
        animation={animation}
        direction={direction}
        view={view}
        className={className}
        phase={swap.sequence > 0 && !reducedMotion ? "enter" : "idle"}
        sequence={swap.sequence}
      >
        {children(true)}
      </SwapLayer>
    </>
  );
}

function SwapLayer({
  animation,
  direction,
  view,
  className,
  phase,
  sequence,
  onComplete,
  children,
}: {
  animation: Props["animation"];
  direction: number;
  view?: string;
  className: string;
  phase: "idle" | "enter" | "exit";
  sequence: number;
  onComplete?: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const completion = useRef(onComplete);
  const reducedMotion = useReducedMotion();
  useDOMEffect(() => {
    completion.current = onComplete;
  });
  useDOMEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (phase !== "exit") {
      element.removeAttribute("inert");
      return;
    }
    element.setAttribute("inert", "");
    return watchCssMotion(
      element,
      "animationend",
      `mpd-${animation}-exit`,
      reducedMotion ? 0 : 220,
      () => completion.current?.(),
    );
  }, [phase, sequence, reducedMotion, animation]);

  return (
    <div
      ref={ref}
      className={`mpd-swap ${className}`}
      data-animation={animation}
      data-phase={phase}
      data-view={view}
      aria-hidden={phase === "exit" ? true : undefined}
      style={{ "--mpd-slide": `${direction * 60}px` } as CSSProperties}
      onClickCapture={(event) => {
        if (phase === "exit") {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {children}
    </div>
  );
}
