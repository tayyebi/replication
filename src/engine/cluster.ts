import type { ClusterSnapshot, NodeSnapshot, SimEvent, PartitionMatrix, ActiveGossipPull, EventKind } from './types';
import { ReplicaNode } from './replicaNode';
import { compareHlc } from './hlc';

const GOSSIP_INTERVAL_MS  = 7  * 60 * 1000;
const ANTI_ENTROPY_MS     = 11 * 60 * 1000;

export const NODE_IDS = ['replica-a', 'replica-b', 'replica-c'];
export const NODE_LABELS: Record<string, string> = {
  'replica-a': 'Server A',
  'replica-b': 'Server B',
  'replica-c': 'Server C',
};
function label(id: string) { return NODE_LABELS[id] ?? id; }

let eventCounter = 0;
function mkEvent(kind: EventKind, nodeId: string, message: string, detail: Record<string, unknown>, simMs: number): SimEvent {
  return { id: `e${++eventCounter}`, simulatedMs: simMs, kind, nodeId, message, detail };
}

export class Cluster {
  private nodes: Map<string, ReplicaNode>;
  private partitionMatrix: PartitionMatrix;
  private events: SimEvent[];
  simulatedMs: number;
  private gossipAccum: number;
  private antiEntropyAccum: number;
  activeGossipPulls: ActiveGossipPull[];
  private gossipPullTTL = 2000; // real ms to show arrow
  private gossipPullTimestamps: Map<string, number>; // key → real Date.now()

  constructor(initialMs: number) {
    this.simulatedMs = initialMs;
    this.gossipAccum = 0;
    this.antiEntropyAccum = 0;
    this.events = [];
    this.activeGossipPulls = [];
    this.gossipPullTimestamps = new Map();
    this.partitionMatrix = {};

    this.nodes = new Map();
    for (const id of NODE_IDS) {
      this.nodes.set(id, new ReplicaNode(id, initialMs));
      this.partitionMatrix[id] = new Set();
    }
    // Initialize peer health
    for (const id of NODE_IDS) {
      const node = this.nodes.get(id)!;
      for (const peerId of NODE_IDS) {
        if (peerId !== id) node.updateSuspicion(peerId, false, initialMs);
      }
    }
  }

  canReach(from: string, to: string): boolean {
    return !this.partitionMatrix[from]?.has(to) && !this.partitionMatrix[to]?.has(from);
  }

  private getLivePeers(nodeId: string): string[] {
    return NODE_IDS.filter(id => id !== nodeId && this.canReach(nodeId, id));
  }

  private addEvent(e: SimEvent): void {
    this.events.push(e);
    if (this.events.length > 200) this.events.shift();
  }

  tick(deltaMs: number, realMs: number): void {
    this.simulatedMs += deltaMs;
    this.gossipAccum += deltaMs;
    this.antiEntropyAccum += deltaMs;

    // Clean up expired gossip pull animations (based on real time)
    const now = realMs;
    const expiredKeys: string[] = [];
    for (const [key, startedAt] of this.gossipPullTimestamps) {
      if (now - startedAt > this.gossipPullTTL) expiredKeys.push(key);
    }
    for (const k of expiredKeys) this.gossipPullTimestamps.delete(k);
    this.activeGossipPulls = this.activeGossipPulls.filter(
      p => this.gossipPullTimestamps.has(`${p.from}->${p.to}`),
    );

    if (this.gossipAccum >= GOSSIP_INTERVAL_MS) {
      this.gossipAccum = 0;
      this.runGossipRound(realMs);
    }
    if (this.antiEntropyAccum >= ANTI_ENTROPY_MS) {
      this.antiEntropyAccum = 0;
      this.runAntiEntropyRound(realMs);
    }

    // Update suspicion for unreachable peers
    for (const id of NODE_IDS) {
      const node = this.nodes.get(id)!;
      for (const peerId of NODE_IDS) {
        if (peerId === id) continue;
        node.updateSuspicion(peerId, !this.canReach(id, peerId), this.simulatedMs);
      }
    }
  }

  private runGossipRound(realMs: number): void {
    for (const fromId of NODE_IDS) {
      const peers = this.getLivePeers(fromId);
      if (peers.length === 0) continue;
      const toId = peers[Math.floor(Math.random() * peers.length)];
      this.gossipPull(fromId, toId, realMs);
    }
  }

  private runAntiEntropyRound(realMs: number): void {
    for (const fromId of NODE_IDS) {
      const peers = this.getLivePeers(fromId);
      for (const toId of peers) {
        this.antiEntropy(fromId, toId, realMs);
      }
    }
  }

  gossipPull(fromId: string, toId: string, realMs: number): SimEvent[] {
    const from = this.nodes.get(fromId)!;
    const to = this.nodes.get(toId)!;
    const events: SimEvent[] = [];

    if (!this.canReach(fromId, toId)) {
      const e = mkEvent('gossip_blocked', fromId,
        `${label(fromId)} tried to sync with ${label(toId)} — blocked (network disconnected)`,
        { from: fromId, to: toId }, this.simulatedMs);
      this.addEvent(e);
      events.push(e);
      return events;
    }

    const cursor = from.getCursor(toId);
    const startE = mkEvent('gossip_pull_start', fromId,
      `${label(fromId)} is asking ${label(toId)} for new changes…`,
      { from: fromId, to: toId, cursor }, this.simulatedMs);
    this.addEvent(startE);
    events.push(startE);

    const batch = to.log.since(cursor, 500);
    const result = from.applyRemoteEntries(batch, toId, this.simulatedMs);

    const pullKey = `${fromId}->${toId}`;
    if (batch.length > 0) {
      this.activeGossipPulls = this.activeGossipPulls.filter(p => `${p.from}->${p.to}` !== pullKey);
      this.activeGossipPulls.push({ from: fromId, to: toId, entriesCount: batch.length, startedAt: realMs });
      this.gossipPullTimestamps.set(pullKey, realMs);
    }

    const doneE = mkEvent('gossip_pull_complete', fromId,
      batch.length === 0
        ? `${label(fromId)} is already up to date with ${label(toId)}`
        : `${label(fromId)} copied ${result.applied} change${result.applied !== 1 ? 's' : ''} from ${label(toId)}${result.skipped ? ` (kept ${result.skipped} already-newer local version${result.skipped !== 1 ? 's' : ''})` : ''}`,
      { from: fromId, to: toId, ...result }, this.simulatedMs);
    this.addEvent(doneE);
    events.push(doneE);

    // Emit per-entry LWW events for the last few entries
    for (const entry of batch.slice(-3)) {
      const existing = from.getEntityState().get(`${entry.entityType}:${entry.entityId}`);
      if (existing && compareHlc(entry.hlc, existing.versionHlc) < 0) {
        const e = mkEvent('lww_skip', fromId,
          `Kept local version of "${entry.entityType}:${entry.entityId}" — it's newer than what ${label(toId)} sent`,
          { entry, localHlc: existing.versionHlc }, this.simulatedMs);
        this.addEvent(e);
        events.push(e);
      }
    }

    return events;
  }

  antiEntropy(fromId: string, toId: string, _realMs: number): SimEvent[] {
    const from = this.nodes.get(fromId)!;
    const to = this.nodes.get(toId)!;
    const events: SimEvent[] = [];

    if (!this.canReach(fromId, toId)) return events;

    const startE = mkEvent('anti_entropy_start', fromId,
      `${label(fromId)} is doing a deep consistency check with ${label(toId)}…`,
      { from: fromId, to: toId }, this.simulatedMs);
    this.addEvent(startE);
    events.push(startE);

    const fromDigests = from.log.computeDigests();
    const toDigests = to.log.computeDigests();

    const toDigestMap = new Map(toDigests.map(d => [`${d.entityType}:${d.hourBucket}`, d]));
    let mismatches = 0;
    let reconciled = 0;

    for (const fd of fromDigests) {
      const td = toDigestMap.get(`${fd.entityType}:${fd.hourBucket}`);
      const match = td && td.xorDigest === fd.xorDigest && td.count === fd.count;
      if (!match) {
        mismatches++;
        const mismatchE = mkEvent('anti_entropy_mismatch', fromId,
          `Checksum mismatch! "${fd.entityType}" data differs between ${label(fromId)} and ${label(toId)} — fetching missing changes`,
          { entityType: fd.entityType, hourBucket: fd.hourBucket, localDigest: fd.xorDigest, remoteDigest: td?.xorDigest ?? 0 },
          this.simulatedMs);
        this.addEvent(mismatchE);
        events.push(mismatchE);

        const missing = to.log.getForHour(fd.entityType, fd.hourBucket);
        const result = from.applyRemoteEntries(missing, toId, this.simulatedMs);
        reconciled += result.applied;

        if (result.applied > 0) {
          const recE = mkEvent('anti_entropy_reconcile', fromId,
            `Fixed! ${label(fromId)} recovered ${result.applied} missing "${fd.entityType}" change${result.applied !== 1 ? 's' : ''} from ${label(toId)}`,
            { entityType: fd.entityType, hourBucket: fd.hourBucket, applied: result.applied },
            this.simulatedMs);
          this.addEvent(recE);
          events.push(recE);
        }
      }
    }

    // Also check buckets in toDigests that from doesn't have
    const fromDigestMap = new Map(fromDigests.map(d => [`${d.entityType}:${d.hourBucket}`, d]));
    for (const td of toDigests) {
      const key = `${td.entityType}:${td.hourBucket}`;
      if (!fromDigestMap.has(key)) {
        mismatches++;
        const missing = to.log.getForHour(td.entityType, td.hourBucket);
        const result = from.applyRemoteEntries(missing, toId, this.simulatedMs);
        reconciled += result.applied;
        if (result.applied > 0) {
          const recE = mkEvent('anti_entropy_reconcile', fromId,
            `Fixed! ${label(fromId)} recovered ${result.applied} missing "${td.entityType}" change${result.applied !== 1 ? 's' : ''} from ${label(toId)}`,
            { entityType: td.entityType, hourBucket: td.hourBucket, applied: result.applied },
            this.simulatedMs);
          this.addEvent(recE);
          events.push(recE);
        }
      }
    }

    if (mismatches === 0) {
      const okE = mkEvent('anti_entropy_ok', fromId,
        `${label(fromId)} and ${label(toId)} have identical data — fully in sync ✓`,
        { from: fromId, to: toId }, this.simulatedMs);
      this.addEvent(okE);
      events.push(okE);
    }

    return events;
  }

  partitionNode(nodeId: string): void {
    for (const otherId of NODE_IDS) {
      if (otherId === nodeId) continue;
      this.partitionMatrix[nodeId].add(otherId);
      this.partitionMatrix[otherId].add(nodeId);
    }
    const e = mkEvent('partition_set', nodeId,
      `⚡ Network cut: ${label(nodeId)} is now disconnected from all other servers`,
      { nodeId }, this.simulatedMs);
    this.addEvent(e);
  }

  healPartition(nodeId: string, realMs: number): void {
    for (const otherId of NODE_IDS) {
      this.partitionMatrix[nodeId].delete(otherId);
      this.partitionMatrix[otherId].delete(nodeId);
    }
    const e = mkEvent('partition_heal', nodeId,
      `💚 Network restored: ${label(nodeId)} is back online and syncing with all servers`,
      { nodeId }, this.simulatedMs);
    this.addEvent(e);

    // Immediately trigger gossip in both directions
    setTimeout(() => {
      for (const otherId of NODE_IDS) {
        if (otherId !== nodeId) {
          this.gossipPull(nodeId, otherId, realMs);
          this.gossipPull(otherId, nodeId, realMs);
        }
      }
    }, 0);
  }

  writeToNode(nodeId: string, entityType: string, entityId: string, op: 'upsert' | 'tombstone' | 'insert', payload: Record<string, unknown>): void {
    const node = this.nodes.get(nodeId)!;
    const entry = node.write(entityType, entityId, op, payload, this.simulatedMs);
    const opLabel = op === 'tombstone' ? 'deleted' : op === 'insert' ? 'created' : 'saved';
    const e = mkEvent('write', nodeId,
      `✏️  ${label(nodeId)} ${opLabel} "${entityType}:${entityId}"`,
      { nodeId, entityType, entityId, op, hlc: entry.hlc, payload }, this.simulatedMs);
    this.addEvent(e);
  }

  quorumWrite(nodeId: string, entityType: string, entityId: string, op: 'upsert' | 'tombstone' | 'insert', payload: Record<string, unknown>): boolean {
    const reachable = this.getLivePeers(nodeId);
    const majority = Math.floor(NODE_IDS.length / 2) + 1;
    const total = 1 + reachable.length;

    if (total < majority) {
      const e = mkEvent('quorum_fail', nodeId,
        `🚫 Save rejected on ${label(nodeId)}: only ${total} of ${NODE_IDS.length} servers reachable — need at least ${majority} to agree`,
        { nodeId, reachable: total, required: majority }, this.simulatedMs);
      this.addEvent(e);
      return false;
    }

    this.writeToNode(nodeId, entityType, entityId, op, payload);
    const e = mkEvent('quorum_ack', nodeId,
      `✅ Save confirmed on ${label(nodeId)}: ${total} of ${NODE_IDS.length} servers agreed`,
      { nodeId, reachable: total, required: majority }, this.simulatedMs);
    this.addEvent(e);
    return true;
  }

  triggerGossipNow(fromId: string, toId: string, realMs: number): void {
    this.gossipPull(fromId, toId, realMs);
  }

  triggerAntiEntropyNow(fromId: string, toId: string, realMs: number): void {
    this.antiEntropy(fromId, toId, realMs);
  }

  // For anti-entropy demo: directly insert an entry into one node without gossiping
  forceInsertOnNode(nodeId: string, entityType: string, entityId: string, payload: Record<string, unknown>): void {
    const node = this.nodes.get(nodeId)!;
    const entry = node.write(entityType, entityId, 'upsert', payload, this.simulatedMs);
    // Then undo from other nodes' awareness by resetting their cursor state —
    // actually simpler: just don't gossip. The entry is only on nodeId's log.
    const e = mkEvent('write', nodeId,
      `🔬 Secretly added "${entityType}:${entityId}" to ${label(nodeId)} only — other servers don't know yet`,
      { nodeId, entityType, entityId, hlc: entry.hlc }, this.simulatedMs);
    this.addEvent(e);
  }

  getNode(id: string): ReplicaNode {
    return this.nodes.get(id)!;
  }

  getSnapshot(): ClusterSnapshot {
    const nodes: NodeSnapshot[] = NODE_IDS.map(id => {
      const node = this.nodes.get(id)!;
      const partitionedFrom = NODE_IDS.filter(
        other => other !== id && this.partitionMatrix[id]?.has(other),
      );
      return {
        id,
        hlc: node.currentHlc(),
        logSize: node.log.size(),
        log: node.log.last(200),
        entityState: node.getEntityState(),
        cursors: node.getCursors(),
        digests: node.log.computeDigests(),
        peerHealth: node.getPeerHealth(),
        partitioned: partitionedFrom.length >= NODE_IDS.length - 1,
        partitionedFrom,
      };
    });

    return {
      nodes,
      partitionMatrix: this.partitionMatrix,
      events: [...this.events],
      simulatedMs: this.simulatedMs,
      speedMultiplier: 1,
      activeGossipPulls: [...this.activeGossipPulls],
    };
  }
}
