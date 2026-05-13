/**
 * Anti-repetition memory for test data generation.
 *
 * Both static and AI engines use Math.random() — that's truly random
 * but memoryless, so it readily picks the same industry / category /
 * persona / trick twice in a row. This module keeps a small "recently
 * used" buffer per key in localStorage and excludes those items from
 * the next pick. When everything is exhausted the buffer resets.
 *
 * Standard buffer sizes (per user choice):
 *   - industry+category pair: last 8
 *   - persona:                last 3
 *   - trick template:         last 10
 */

const STORAGE_PREFIX = "exos:test-rotation:";

export const ROTATION_BUFFER = {
  pair: 8,
  persona: 3,
  trick: 10,
} as const;

function readBuffer(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeBuffer(key: string, values: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(values));
  } catch {
    /* quota / privacy mode — ignore */
  }
}

/** Get the current exclusion list for a key. */
export function getExclusions(key: string): string[] {
  return readBuffer(key);
}

/** Record a choice; trims to maxBuffer most recent. */
export function recordChoice(key: string, choice: string, maxBuffer: number): void {
  const current = readBuffer(key).filter((v) => v !== choice);
  current.push(choice);
  while (current.length > maxBuffer) current.shift();
  writeBuffer(key, current);
}

/**
 * Pick an item from the pool while excluding recently-used choices.
 * Falls back to the full pool if exclusions would leave nothing.
 * Records the chosen value automatically.
 */
export function pickWithRotation<T extends string>(
  pool: readonly T[],
  key: string,
  maxBuffer: number,
): T {
  if (pool.length === 0) {
    throw new Error(`pickWithRotation: empty pool for key "${key}"`);
  }
  const excluded = new Set(readBuffer(key));
  let candidates = pool.filter((p) => !excluded.has(p));
  if (candidates.length === 0) {
    // Buffer covers the whole pool — reset and use full pool.
    writeBuffer(key, []);
    candidates = [...pool];
  }
  const choice = candidates[Math.floor(secureRandom() * candidates.length)];
  recordChoice(key, choice, maxBuffer);
  return choice;
}

/** Crypto-backed random in [0,1). Falls back to Math.random in non-browser envs. */
function secureRandom(): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
  }
  return Math.random();
}

/** Composite key helper for industry+category pair. */
export function pairKey(industry: string, category: string): string {
  return `${industry}::${category}`;
}
