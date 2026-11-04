let lastTimestamp = 0;

/**
 * ISO timestamps that never repeat or go backwards within a process, so
 * "newest first" listings keep a deterministic order even for leagues
 * created within the same millisecond.
 */
export function monotonicNowIso(): string {
  const now = Date.now();
  lastTimestamp = now > lastTimestamp ? now : lastTimestamp + 1;
  return new Date(lastTimestamp).toISOString();
}
