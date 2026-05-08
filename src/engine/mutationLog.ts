import type { LogEntry, DigestBucket } from './types';
import { compareHlc } from './hlc';
import { entryHash } from './digestUtils';

export class MutationLog {
  private entries: LogEntry[] = [];
  private seen = new Set<string>();

  private dedupeKey(e: LogEntry): string {
    return `${e.entityType}:${e.entityId}:${e.hlc}`;
  }

  append(entry: LogEntry): boolean {
    const key = this.dedupeKey(entry);
    if (this.seen.has(key)) return false;
    this.seen.add(key);

    // Insert in sorted position by HLC
    let lo = 0, hi = this.entries.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (compareHlc(this.entries[mid].hlc, entry.hlc) <= 0) lo = mid + 1;
      else hi = mid;
    }
    this.entries.splice(lo, 0, entry);
    return true;
  }

  since(cursor: string, limit = 500): LogEntry[] {
    const result: LogEntry[] = [];
    for (const e of this.entries) {
      if (compareHlc(e.hlc, cursor) > 0) {
        result.push(e);
        if (result.length >= limit) break;
      }
    }
    return result;
  }

  getForHour(entityType: string, hourBucket: number): LogEntry[] {
    return this.entries.filter(
      e => e.entityType === entityType && Math.floor(e.hlcParsed.ms / 3_600_000) === hourBucket,
    );
  }

  computeDigests(): DigestBucket[] {
    const buckets = new Map<string, DigestBucket>();
    for (const e of this.entries) {
      const hourBucket = Math.floor(e.hlcParsed.ms / 3_600_000);
      const key = `${e.entityType}:${hourBucket}`;
      if (!buckets.has(key)) {
        buckets.set(key, { entityType: e.entityType, hourBucket, xorDigest: 0, count: 0 });
      }
      const b = buckets.get(key)!;
      b.xorDigest = (b.xorDigest ^ entryHash(e.hlc, e.entityId)) >>> 0;
      b.count += 1;
    }
    return Array.from(buckets.values());
  }

  getAll(): LogEntry[] {
    return this.entries;
  }

  size(): number {
    return this.entries.length;
  }

  last(n: number): LogEntry[] {
    return this.entries.slice(-n);
  }
}
