"use client";

import { useEffect, useState } from "react";

/**
 * The clock a queue view measures against.
 *
 * `Date.now()` during render is impure — two renders of the same state would be
 * allowed to disagree, and React's compiler refuses it. A "queued for 1m 05s"
 * line has to move, though, so the clock is *state*: it starts at 0, meaning
 * "not measurable yet", and ticks write the real time into it, which re-renders.
 * `scanQueueState` reads 0 as pending, so a scan is never called abandoned just
 * because this component has only just mounted.
 *
 * The first tick is a zero-delay timeout rather than a direct call in the effect
 * body: a synchronous `setState` there cascades renders, and this is the same
 * clock starting as the interval that follows it. Waiting for the first interval
 * instead would leave a scan that is already past the notice window looking
 * active for a second after the page loads.
 */
export function useQueueClock(tickMs = 1_000): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const every = window.setInterval(tick, tickMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [tickMs]);

  return now;
}
