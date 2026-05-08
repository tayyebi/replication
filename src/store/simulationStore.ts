import { create } from 'zustand';
import { Cluster } from '../engine/cluster';
import type { ClusterSnapshot } from '../engine/types';
import { buildScenarios, type Scenario } from '../engine/scenarios';

const INITIAL_SIM_MS = Date.now();

interface SimulationStore {
  cluster: Cluster;
  snapshot: ClusterSnapshot;
  speedMultiplier: number;
  paused: boolean;
  selectedNodeId: string | null;
  scenarios: Scenario[];
  activeScenario: string | null;

  tick: (realMs: number) => void;
  writeToNode: (nodeId: string, entityType: string, entityId: string, op: 'upsert' | 'tombstone' | 'insert', payload: Record<string, unknown>) => void;
  quorumWrite: (nodeId: string, entityType: string, entityId: string, op: 'upsert' | 'tombstone' | 'insert', payload: Record<string, unknown>) => boolean;
  partitionNode: (nodeId: string) => void;
  healPartition: (nodeId: string) => void;
  triggerGossipNow: (fromId: string, toId: string) => void;
  triggerAntiEntropyNow: (fromId: string, toId: string) => void;
  forceInsertOnNode: (nodeId: string, entityType: string, entityId: string, payload: Record<string, unknown>) => void;
  runScenario: (scenarioId: string) => void;
  selectNode: (nodeId: string | null) => void;
  setSpeed: (multiplier: number) => void;
  setPaused: (paused: boolean) => void;
}

function makeInitialSnapshot(cluster: Cluster): ClusterSnapshot {
  const snap = cluster.getSnapshot();
  return { ...snap, speedMultiplier: 1 };
}

export const useSimulationStore = create<SimulationStore>((set, get) => {
  const cluster = new Cluster(INITIAL_SIM_MS);
  const scenarios = buildScenarios(cluster);

  // Seed each node with a few initial writes so there's data to explore
  cluster.writeToNode('replica-a', 'service', 'api-gateway', 'upsert', { name: 'API Gateway', status: 'online', region: 'us-east' });
  cluster.writeToNode('replica-b', 'service', 'auth-service', 'upsert', { name: 'Auth Service', status: 'online', region: 'eu-west' });
  cluster.writeToNode('replica-c', 'service', 'billing',      'upsert', { name: 'Billing',      status: 'online', region: 'ap-south' });
  cluster.writeToNode('replica-a', 'user',    'admin',        'upsert', { name: 'Admin User',   role: 'admin' });

  return {
    cluster,
    snapshot: makeInitialSnapshot(cluster),
    speedMultiplier: 1,
    paused: false,
    selectedNodeId: 'replica-a',
    scenarios,
    activeScenario: null,

    tick: (realMs: number) => {
      const { cluster, speedMultiplier, paused } = get();
      if (paused) return;
      cluster.tick(100 * speedMultiplier, realMs);
      const snap = cluster.getSnapshot();
      set({ snapshot: { ...snap, speedMultiplier } });
    },

    writeToNode: (nodeId, entityType, entityId, op, payload) => {
      const { cluster } = get();
      cluster.writeToNode(nodeId, entityType, entityId, op, payload);
      set({ snapshot: { ...cluster.getSnapshot(), speedMultiplier: get().speedMultiplier } });
    },

    quorumWrite: (nodeId, entityType, entityId, op, payload) => {
      const { cluster } = get();
      const ok = cluster.quorumWrite(nodeId, entityType, entityId, op, payload);
      set({ snapshot: { ...cluster.getSnapshot(), speedMultiplier: get().speedMultiplier } });
      return ok;
    },

    partitionNode: (nodeId) => {
      const { cluster } = get();
      cluster.partitionNode(nodeId);
      set({ snapshot: { ...cluster.getSnapshot(), speedMultiplier: get().speedMultiplier } });
    },

    healPartition: (nodeId) => {
      const { cluster } = get();
      cluster.healPartition(nodeId, Date.now());
      set({ snapshot: { ...cluster.getSnapshot(), speedMultiplier: get().speedMultiplier } });
    },

    triggerGossipNow: (fromId, toId) => {
      const { cluster } = get();
      cluster.triggerGossipNow(fromId, toId, Date.now());
      set({ snapshot: { ...cluster.getSnapshot(), speedMultiplier: get().speedMultiplier } });
    },

    triggerAntiEntropyNow: (fromId, toId) => {
      const { cluster } = get();
      cluster.triggerAntiEntropyNow(fromId, toId, Date.now());
      set({ snapshot: { ...cluster.getSnapshot(), speedMultiplier: get().speedMultiplier } });
    },

    forceInsertOnNode: (nodeId, entityType, entityId, payload) => {
      const { cluster } = get();
      cluster.forceInsertOnNode(nodeId, entityType, entityId, payload);
      set({ snapshot: { ...cluster.getSnapshot(), speedMultiplier: get().speedMultiplier } });
    },

    runScenario: (scenarioId: string) => {
      const { scenarios, cluster } = get();
      const scenario = scenarios.find(s => s.id === scenarioId);
      if (!scenario) return;
      set({ activeScenario: scenarioId });
      let totalDelay = 0;
      for (const step of scenario.steps) {
        totalDelay += step.delayMs;
        const delay = totalDelay;
        setTimeout(() => {
          step.action(cluster, Date.now());
          set({ snapshot: { ...cluster.getSnapshot(), speedMultiplier: get().speedMultiplier } });
        }, delay);
      }
      setTimeout(() => set({ activeScenario: null }), totalDelay + 500);
    },

    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    setSpeed: (multiplier) => set({ speedMultiplier: multiplier }),
    setPaused: (paused) => set({ paused }),
  };
});

// Start the simulation tick loop
let intervalId: ReturnType<typeof setInterval> | null = null;

export function startSimulation() {
  if (intervalId) return;
  intervalId = setInterval(() => {
    useSimulationStore.getState().tick(Date.now());
  }, 100);
}

export function stopSimulation() {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
}
