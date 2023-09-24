const debugControls: {
  throttleMin: number;
  throttleMax: number;
  errorRatio: number;
} = {
  errorRatio: 0,
  throttleMax: 0,
  throttleMin: 0,
};

/**
 * Add debug controls to the window so they can be changed in the dev console.
 */
(window as any).__debugControls = debugControls;

function getThrottleAmount() {
  return Math.max(
    0,
    debugControls.throttleMin +
      Math.floor(
        Math.random() * (debugControls.throttleMax - debugControls.throttleMin),
      ),
  );
}

export function debugThrottle(): Promise<void> {
  if (Math.random() > 1 - debugControls.errorRatio) {
    throw new Error('Random noise debug error.');
  }

  return new Promise((resolve) => setTimeout(resolve, getThrottleAmount()));
}
