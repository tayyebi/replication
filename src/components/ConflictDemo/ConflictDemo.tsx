import { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { LwwComparison } from './LwwComparison';

const STEPS = [
  { id: 1, label: 'Cut Server A off from the network', description: 'Server A can no longer talk to the others — like going offline.' },
  { id: 2, label: 'Save a note on Server A',           description: 'While offline, Server A saves its own version.' },
  { id: 3, label: 'Save the same note on Server B',    description: 'Server B saves a different version of the same note. Conflict!' },
  { id: 4, label: 'Reconnect the servers',             description: 'They\'re back online. Both have different versions of the same note.' },
  { id: 5, label: 'Latest timestamp wins',             description: 'The newer version automatically wins — no human needed.' },
];

export function ConflictDemo() {
  const { snapshot, partitionNode, healPartition, writeToNode, triggerGossipNow } = useSimulationStore();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const nodeA = snapshot.nodes.find(n => n.id === 'replica-a');
  const nodeB = snapshot.nodes.find(n => n.id === 'replica-b');
  const aliceA = nodeA?.entityState.get('note:alice');
  const aliceB = nodeB?.entityState.get('note:alice');

  const advance = () => {
    const next = step + 1;
    switch (next) {
      case 1: partitionNode('replica-a'); break;
      case 2: writeToNode('replica-a', 'note', 'alice', 'upsert', { text: 'Written on Server A', version: 'A' }); break;
      case 3: writeToNode('replica-b', 'note', 'alice', 'upsert', { text: 'Written on Server B', version: 'B' }); break;
      case 4: healPartition('replica-a'); break;
      case 5: triggerGossipNow('replica-a', 'replica-b'); triggerGossipNow('replica-b', 'replica-a'); setDone(true); break;
    }
    setStep(next);
  };

  const reset = () => {
    setStep(0); setDone(false);
    if (snapshot.nodes.find(n => n.id === 'replica-a')?.partitioned) healPartition('replica-a');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-5 shadow-sm">
      <h2 className="text-base md:text-lg font-bold text-slate-800 mb-1">⚔️ What if two servers disagree?</h2>
      <p className="text-xs md:text-sm text-slate-500 mb-3">
        Two servers edit the same note while offline. The newer timestamp wins automatically.
      </p>

      <div className="flex gap-1 mb-3">
        {STEPS.map((s, i) => (
          <div key={s.id} className={`flex-1 h-1.5 rounded-full transition-colors ${
            i < step ? 'bg-green-400' : i === step && step > 0 ? 'bg-amber-400' : 'bg-slate-200'
          }`}/>
        ))}
      </div>

      {!done && STEPS[step] && (
        <div className="bg-slate-50 rounded-xl p-3 mb-3 border border-slate-200">
          <div className="text-xs text-slate-400 mb-0.5 uppercase tracking-wide">Step {STEPS[step]!.id} of {STEPS.length}</div>
          <div className="text-sm font-semibold text-slate-800">{STEPS[step]!.label}</div>
          <div className="text-xs text-slate-500 mt-1">{STEPS[step]!.description}</div>
        </div>
      )}

      {step >= 3 && aliceA && aliceB && (
        <LwwComparison
          nodeAId="replica-a" nodeBId="replica-b"
          versionA={aliceA.versionHlc} versionB={aliceB.versionHlc}
          dataA={aliceA.data} dataB={aliceB.data}
          originA={aliceA.originReplica} originB={aliceB.originReplica}
        />
      )}

      {done && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-sm text-green-800">
          ✅ Both servers agree now. The newer version won — this is <strong>"Last-Write-Wins"</strong>.
        </div>
      )}

      <div className="flex gap-2">
        {step < STEPS.length && (
          <button onClick={advance} className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-bold transition-colors">
            {step === 0 ? '▶ Start' : 'Next →'}
          </button>
        )}
        {step > 0 && (
          <button onClick={reset} className="h-11 px-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 text-sm font-medium transition-colors">
            ↺ Reset
          </button>
        )}
      </div>
    </div>
  );
}
