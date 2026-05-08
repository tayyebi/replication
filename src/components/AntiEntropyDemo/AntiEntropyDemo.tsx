import { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { DigestGrid } from './DigestGrid';
import { NODE_LABELS } from '../../engine/cluster';

const STEPS = [
  { id: 1, label: 'Add a photo to Server A only',      description: 'Server A gets data that never synced to the others — like a network hiccup.' },
  { id: 2, label: 'Server B compares fingerprints',    description: 'Server B computes a checksum and compares it with Server A. Mismatch = missing data!' },
  { id: 3, label: 'Server C checks and recovers too',  description: 'Same process. After this all three servers have the photo.' },
];

export function AntiEntropyDemo() {
  const { snapshot, forceInsertOnNode, triggerAntiEntropyNow } = useSimulationStore();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const nodeA = snapshot.nodes.find(n => n.id === 'replica-a');
  const nodeB = snapshot.nodes.find(n => n.id === 'replica-b');
  const nodeC = snapshot.nodes.find(n => n.id === 'replica-c');
  const hasOnA = !!nodeA?.entityState.get('photo:ae-demo');
  const hasOnB = !!nodeB?.entityState.get('photo:ae-demo');
  const hasOnC = !!nodeC?.entityState.get('photo:ae-demo');

  const advance = () => {
    const next = step + 1;
    switch (next) {
      case 1: forceInsertOnNode('replica-a', 'photo', 'ae-demo', { title: 'Mountain at dusk', size: '8MB' }); break;
      case 2: triggerAntiEntropyNow('replica-b', 'replica-a'); break;
      case 3: triggerAntiEntropyNow('replica-c', 'replica-a'); setDone(true); break;
    }
    setStep(next);
  };

  const reset = () => { setStep(0); setDone(false); };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-5 shadow-sm">
      <h2 className="text-base md:text-lg font-bold text-slate-800 mb-1">🔍 What if a server misses an update?</h2>
      <p className="text-xs md:text-sm text-slate-500 mb-3">
        Servers compare "fingerprints" of their data to spot and fix gaps automatically.
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

      {step >= 1 && (
        <div className="flex gap-2 mb-3">
          {[{ id: 'replica-a', has: hasOnA }, { id: 'replica-b', has: hasOnB }, { id: 'replica-c', has: hasOnC }].map(n => (
            <div key={n.id} className={`flex-1 text-center rounded-xl border-2 p-2 ${n.has ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-200'}`}>
              <div className={`text-xs font-bold ${n.id === 'replica-a' ? 'text-blue-700' : n.id === 'replica-b' ? 'text-emerald-700' : 'text-violet-700'}`}>
                {NODE_LABELS[n.id]}
              </div>
              <div className={`text-xs font-semibold mt-0.5 ${n.has ? 'text-green-600' : 'text-red-500'}`}>
                {n.has ? '✓' : '✗'}
              </div>
            </div>
          ))}
        </div>
      )}

      {step >= 1 && <DigestGrid />}

      {done && hasOnA && hasOnB && hasOnC && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 text-sm text-green-800">
          ✅ All servers have the photo now! Fingerprint mismatch triggered automatic recovery.
        </div>
      )}

      <div className="flex gap-2">
        {step < STEPS.length && (
          <button onClick={advance} className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white text-sm font-bold transition-colors">
            {step === 0 ? '▶ Start' : 'Next →'}
          </button>
        )}
        {step > 0 && (
          <button onClick={reset} className="h-11 px-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-600 text-sm font-medium">
            ↺ Reset
          </button>
        )}
      </div>
    </div>
  );
}
