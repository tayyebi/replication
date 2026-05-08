import { Cluster } from './cluster';

export interface ScenarioStep {
  delayMs: number;
  label: string;
  action: (cluster: Cluster, realMs: number) => void;
}

export interface Scenario {
  id: string;
  name: string;
  emoji: string;
  description: string;
  steps: ScenarioStep[];
}

export function buildScenarios(_cluster?: Cluster): Scenario[] {
  return [
    {
      id: 'lww_conflict',
      name: 'Two friends edit the same note offline',
      emoji: '⚔️',
      description: 'Cut Server A off from the network. Both Server A and Server B save different versions of the same note. Then reconnect and watch the system automatically pick the newer version.',
      steps: [
        { delayMs: 500,  label: 'Disconnect Server A',                        action: (c) => c.partitionNode('replica-a') },
        { delayMs: 800,  label: 'Server A saves note:alice → "Alice (v1)"',   action: (c) => c.writeToNode('replica-a', 'note', 'alice', 'upsert', { text: 'Alice wrote this on Server A', author: 'Alice', version: 1 }) },
        { delayMs: 800,  label: 'Server B saves note:alice → "Alice (v2)"',   action: (c) => c.writeToNode('replica-b', 'note', 'alice', 'upsert', { text: 'Alice wrote this on Server B', author: 'Alice', version: 2 }) },
        { delayMs: 1200, label: 'Reconnect Server A',                          action: (c, r) => c.healPartition('replica-a', r) },
        { delayMs: 1500, label: 'Sync — latest timestamp wins',                action: (c, r) => { c.triggerAntiEntropyNow('replica-a', 'replica-b', r); c.triggerAntiEntropyNow('replica-b', 'replica-a', r); } },
      ],
    },
    {
      id: 'anti_entropy',
      name: 'A server misses an update',
      emoji: '🔍',
      description: 'Add a new item to Server A only (simulating a missed sync). Watch the system detect the gap using checksums and automatically recover the missing data.',
      steps: [
        { delayMs: 500,  label: 'Add photo:sunset to Server A secretly',      action: (c) => c.forceInsertOnNode('replica-a', 'photo', 'sunset', { title: 'Sunset at the beach', size: '4MB', likes: 42 }) },
        { delayMs: 1000, label: 'Server B checks for missing data',            action: (c, r) => c.triggerAntiEntropyNow('replica-b', 'replica-a', r) },
        { delayMs: 800,  label: 'Server C checks for missing data',            action: (c, r) => c.triggerAntiEntropyNow('replica-c', 'replica-a', r) },
      ],
    },
    {
      id: 'partition_heal',
      name: 'All servers lose connection, then reconnect',
      emoji: '🌐',
      description: 'Simulate a full network outage — all 3 servers are cut off from each other. Each saves different data. Then restore the network and watch everything merge.',
      steps: [
        { delayMs: 400,  label: 'Cut all network connections',  action: (c) => { c.partitionNode('replica-a'); c.partitionNode('replica-b'); c.partitionNode('replica-c'); } },
        { delayMs: 600,  label: 'Server A saves order:101',     action: (c) => c.writeToNode('replica-a', 'order', '101', 'upsert', { item: 'Pizza', total: 25, status: 'pending' }) },
        { delayMs: 600,  label: 'Server B saves order:102',     action: (c) => c.writeToNode('replica-b', 'order', '102', 'upsert', { item: 'Burger', total: 18, status: 'paid' }) },
        { delayMs: 600,  label: 'Server C saves order:103',     action: (c) => c.writeToNode('replica-c', 'order', '103', 'upsert', { item: 'Sushi', total: 35, status: 'shipped' }) },
        { delayMs: 1200, label: 'Restore all connections',      action: (c, r) => { c.healPartition('replica-a', r); c.healPartition('replica-b', r); c.healPartition('replica-c', r); } },
        { delayMs: 1000, label: 'All servers sync with each other', action: (c, r) => { for (const a of ['replica-a','replica-b','replica-c']) for (const b of ['replica-a','replica-b','replica-c']) if (a!==b) c.triggerGossipNow(a, b, r); } },
      ],
    },
    {
      id: 'quorum_fail',
      name: 'Save fails when too many servers are offline',
      emoji: '🚫',
      description: 'Disconnect Server A so it can\'t reach any other servers. Try to save with "majority approval required" — it will fail. Reconnect and try again.',
      steps: [
        { delayMs: 500,  label: 'Disconnect Server A',                         action: (c) => c.partitionNode('replica-a') },
        { delayMs: 800,  label: 'Try to save (needs majority — will fail)',    action: (c) => c.quorumWrite('replica-a', 'setting', 'maintenance-mode', 'upsert', { enabled: true }) },
        { delayMs: 1200, label: 'Reconnect Server A',                          action: (c, r) => c.healPartition('replica-a', r) },
        { delayMs: 800,  label: 'Try again (now succeeds)',                    action: (c) => c.quorumWrite('replica-a', 'setting', 'maintenance-mode', 'upsert', { enabled: true }) },
      ],
    },
  ];
}
