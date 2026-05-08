export interface HlcTimestamp {
  ms: number;
  logical: number;
  instanceId: string;
}

export type Operation = 'upsert' | 'tombstone' | 'insert';

export interface LogEntry {
  hlc: string;
  hlcParsed: HlcTimestamp;
  originReplica: string;
  entityType: string;
  entityId: string;
  op: Operation;
  payload: Record<string, unknown>;
}

export interface EntityState {
  entityType: string;
  entityId: string;
  versionHlc: string;
  originReplica: string;
  data: Record<string, unknown>;
  tombstoned: boolean;
}

export type CursorMap = Record<string, string>;

export interface DigestBucket {
  entityType: string;
  hourBucket: number;
  xorDigest: number;
  count: number;
}

export type SuspicionLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface PeerHealth {
  peerName: string;
  suspicion: SuspicionLevel;
  lastSeen: number;
  alive: boolean;
}

export type PartitionMatrix = Record<string, Set<string>>;

export type EventKind =
  | 'write'
  | 'gossip_pull_start'
  | 'gossip_pull_complete'
  | 'gossip_blocked'
  | 'lww_apply'
  | 'lww_skip'
  | 'lww_tiebreak'
  | 'anti_entropy_start'
  | 'anti_entropy_mismatch'
  | 'anti_entropy_reconcile'
  | 'anti_entropy_ok'
  | 'partition_set'
  | 'partition_heal'
  | 'suspicion_increment'
  | 'quorum_ack'
  | 'quorum_fail';

export interface SimEvent {
  id: string;
  simulatedMs: number;
  kind: EventKind;
  nodeId: string;
  message: string;
  detail: Record<string, unknown>;
}

export interface ActiveGossipPull {
  from: string;
  to: string;
  entriesCount: number;
  startedAt: number;
}

export interface NodeSnapshot {
  id: string;
  hlc: string;
  logSize: number;
  log: LogEntry[];
  entityState: Map<string, EntityState>;
  cursors: CursorMap;
  digests: DigestBucket[];
  peerHealth: Record<string, PeerHealth>;
  partitioned: boolean;
  partitionedFrom: string[];
}

export interface ClusterSnapshot {
  nodes: NodeSnapshot[];
  partitionMatrix: PartitionMatrix;
  events: SimEvent[];
  simulatedMs: number;
  speedMultiplier: number;
  activeGossipPulls: ActiveGossipPull[];
}

export interface ApplyResult {
  applied: number;
  skipped: number;
  tiebreaks: number;
  maxHlc: string;
}
