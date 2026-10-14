export const HEART_TURN_DURATION_MS = 3600;

export type HeartTurnSample = { angle: number; busy: boolean };

export function createHeartTurnController(durationMs = HEART_TURN_DURATION_MS) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new Error("Heart turn duration must be positive.");
  }
  let angle = 0;
  let target = 0;
  let from = 0;
  let startedAt = 0;
  let busy = false;

  function sample(timeMs: number): HeartTurnSample {
    if (busy) {
      const progress = Math.max(0, Math.min(1, (timeMs - startedAt) / durationMs));
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      angle = from + (target - from) * eased;
      if (progress === 1) {
        angle = target;
        busy = false;
      }
    }
    return { angle, busy };
  }

  function finish(): HeartTurnSample & { busy: false } {
    angle = target;
    busy = false;
    return { angle, busy: false };
  }

  return {
    get angle() { return angle; },
    get target() { return target; },
    get busy() { return busy; },
    request(timeMs: number, reducedMotion = false): boolean {
      sample(timeMs);
      if (busy) return false;
      from = angle;
      target = from + Math.PI;
      startedAt = timeMs;
      busy = true;
      if (reducedMotion) finish();
      return true;
    },
    sample,
    finish,
  };
}
