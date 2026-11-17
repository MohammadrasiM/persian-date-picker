import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";

export const useDOMEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const query = window.matchMedia(reducedMotionQuery);
  if (query.addEventListener) {
    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
  }
  query.addListener(callback);
  return () => query.removeListener(callback);
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

export function watchCssMotion(
  element: HTMLElement,
  eventType: "animationend" | "transitionend",
  name: string,
  duration: number,
  onComplete: () => void,
) {
  const view = element.ownerDocument.defaultView!;
  let finished = false;
  const dispose = () => {
    view.clearTimeout(timer);
    element.removeEventListener(eventType, onEnd);
  };
  const complete = () => {
    if (finished) return;
    finished = true;
    dispose();
    onComplete();
  };
  const onEnd = (event: Event) => {
    const eventName =
      eventType === "animationend"
        ? (event as AnimationEvent).animationName
        : (event as TransitionEvent).propertyName;
    if (event.target === element && eventName === name) complete();
  };
  // Completion events may be absent if CSS is missing or an animation is interrupted.
  const timer = view.setTimeout(complete, duration ? duration + 50 : 0);
  element.addEventListener(eventType, onEnd);
  return () => {
    finished = true;
    dispose();
  };
}
