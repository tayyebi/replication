import type { LogEntry, EntityState, CursorMap, PeerHealth, SuspicionLevel, ApplyResult, Operation } from './types';
import { HybridLogicalClock, serializeHlc, compareHlc } from './hlc';
import { MutationLog } from './mutationLog';

export class ReplicaNode {
  readonly id: string;
  private clock: HybridLogicalClock;
  readonly log: MutationLog;
  private entityState: Map<string, EntityState>;
  private cursors: CursorMap;
  private peerHealth: Record<string, PeerHealth>;

  constructor(id: string, initialMs: number) {
    this.id = id;
    this.clock = new HybridLogicalClock(id, initialMs);
    this.log = new MutationLog();
    this.entityState = new Map();
    this.cursors = {};
    this.peerHealth = {};
  }

  private entityKey(entityType: string, entityId: string): string {
    return `${entityType}:${entityId}`;
  }

  write(entityType: string, entityId: string, op: Operation, payload: Record<string, unknown>, simMs: number): LogEntry {
    const hlcTs = this.clock.tick(simMs);
    const hlc = serializeHlc(hlcTs);
    const entry: LogEntry = {
      hlc,
      hlcParsed: hlcTs,
      originReplica: this.id,
      entityType,
      entityId,
      op,
      payload,
    };
    this.log.append(entry);
    this.applyToState(entry);
    return entry;
  }

  private applyToState(entry: LogEntry): void {
    const key = this.entityKey(entry.entityType, entry.entityId);
    const existing = this.entityState.get(key);
    if (entry.op === 'tombstone') {
      if (existing) {
        existing.tombstoned = true;
        existing.versionHlc = entry.hlc;
        existing.originReplica = entry.originReplica;
      } else {
        this.entityState.set(key, {
          entityType: entry.entityType,
          entityId: entry.entityId,
          versionHlc: entry.hlc,
          originReplica: entry.originReplica,
          data: entry.payload,
          tombstoned: true,
        });
      }
    } else {
      this.entityState.set(key, {
        entityType: entry.entityType,
        entityId: entry.entityId,
        versionHlc: entry.hlc,
        originReplica: entry.originReplica,
        data: entry.payload,
        tombstoned: false,
      });
    }
  }

  applyLww(incoming: LogEntry, simMs: number): 'applied' | 'skipped' | 'tiebreak' {
    const key = this.entityKey(incoming.entityType, incoming.entityId);
    const existing = this.entityState.get(key);

    let result: 'applied' | 'skipped' | 'tiebreak' = 'applied';

    if (!existing) {
      // No existing state — always apply
    } else {
      const cmp = compareHlc(incoming.hlc, existing.versionHlc);
      if (cmp > 0) {
        result = 'applied';
      } else if (cmp === 0) {
        // Tie-break by originReplica lexicographically
        if (incoming.originReplica > existing.originReplica) {
          result = 'tiebreak';
        } else {
          return 'skipped';
        }
      } else {
        return 'skipped';
      }
    }

    const added = this.log.append(incoming);
    if (added) {
      this.clock.update(incoming.hlcParsed, simMs);
    }
    this.applyToState(incoming);
    return result;
  }

  applyRemoteEntries(entries: LogEntry[], fromPeer: string, simMs: number): ApplyResult {
    const sorted = [...entries].sort((a, b) => compareHlc(a.hlc, b.hlc));
    let applied = 0, skipped = 0, tiebreaks = 0;
    let maxHlc = this.cursors[fromPeer] ?? '';

    for (const entry of sorted) {
      const r = this.applyLww(entry, simMs);
      if (r === 'applied') applied++;
      else if (r === 'tiebreak') { applied++; tiebreaks++; }
      else skipped++;
      if (compareHlc(entry.hlc, maxHlc) > 0) maxHlc = entry.hlc;
    }

    if (maxHlc) this.cursors[fromPeer] = maxHlc;
    return { applied, skipped, tiebreaks, maxHlc };
  }

  getCursor(peerId: string): string {
    return this.cursors[peerId] ?? '';
  }

  updateSuspicion(peerId: string, missed: boolean, simMs: number): void {
    if (!this.peerHealth[peerId]) {
      this.peerHealth[peerId] = { peerName: peerId, suspicion: 0, lastSeen: simMs, alive: true };
    }
    const h = this.peerHealth[peerId];
    if (!missed) {
      h.suspicion = 0 as SuspicionLevel;
      h.lastSeen = simMs;
      h.alive = true;
    } else {
      h.suspicion = Math.min(5, h.suspicion + 1) as SuspicionLevel;
      h.alive = h.suspicion < 5;
    }
  }

  getPeerHealth(): Record<string, PeerHealth> {
    return { ...this.peerHealth };
  }

  getEntityState(): Map<string, EntityState> {
    return new Map(this.entityState);
  }

  getCursors(): CursorMap {
    return { ...this.cursors };
  }

  currentHlc(): string {
    return this.clock.current();
  }

  // Force-insert an entry bypassing gossip (for anti-entropy demo)
  forceInsert(entry: LogEntry): void {
    this.log.append(entry);
    this.applyToState(entry);
  }
}
