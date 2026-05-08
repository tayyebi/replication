import type { HlcTimestamp } from './types';

const MAX_DRIFT_MS = 60_000;

export function serializeHlc(h: HlcTimestamp): string {
  return `${h.ms.toString().padStart(13, '0')}-${h.logical.toString().padStart(6, '0')}-${h.instanceId}`;
}

export function parseHlc(s: string): HlcTimestamp {
  const firstDash = s.indexOf('-');
  const secondDash = s.indexOf('-', firstDash + 1);
  return {
    ms: parseInt(s.slice(0, firstDash), 10),
    logical: parseInt(s.slice(firstDash + 1, secondDash), 10),
    instanceId: s.slice(secondDash + 1),
  };
}

export function compareHlc(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export class HybridLogicalClock {
  private ms: number;
  private logical: number;
  private instanceId: string;

  constructor(instanceId: string, initialMs = 0) {
    this.instanceId = instanceId;
    this.ms = initialMs;
    this.logical = 0;
  }

  tick(simulatedMs: number): HlcTimestamp {
    if (simulatedMs > this.ms) {
      this.ms = simulatedMs;
      this.logical = 0;
    } else {
      this.logical += 1;
    }
    return { ms: this.ms, logical: this.logical, instanceId: this.instanceId };
  }

  update(remote: HlcTimestamp, simulatedMs: number): HlcTimestamp {
    const remoteMs = remote.ms;
    if (Math.abs(remoteMs - simulatedMs) > MAX_DRIFT_MS) {
      // Clock skew too large — just tick locally
      return this.tick(simulatedMs);
    }
    const newMs = Math.max(simulatedMs, remoteMs, this.ms);
    if (newMs === this.ms && newMs === remoteMs) {
      this.logical = Math.max(this.logical, remote.logical) + 1;
    } else if (newMs === this.ms) {
      this.logical += 1;
    } else if (newMs === remoteMs) {
      this.logical = remote.logical + 1;
    } else {
      this.logical = 0;
    }
    this.ms = newMs;
    return { ms: this.ms, logical: this.logical, instanceId: this.instanceId };
  }

  current(): string {
    return serializeHlc({ ms: this.ms, logical: this.logical, instanceId: this.instanceId });
  }

  getMs(): number { return this.ms; }
}
