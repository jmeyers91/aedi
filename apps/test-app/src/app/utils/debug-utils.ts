const THROTTLE_MIN = +(import.meta.env.VITE_APP_THROTTLE_MIN ?? 0);
const THROTTLE_MAX = +(import.meta.env.VITE_APP_THROTTLE_MAX ?? 0);

function getThrottleAmount() {
  return Math.max(
    0,
    THROTTLE_MIN + Math.floor(Math.random() * (THROTTLE_MAX - THROTTLE_MIN)),
  );
}
export function debugThrottle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, getThrottleAmount()));
}
