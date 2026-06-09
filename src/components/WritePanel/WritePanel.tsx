import { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { NODE_LABELS } from '../../engine/cluster';

const PRESETS = [
  { emoji: '📝', label: 'Save a note',    entityType: '📝', entityId: 'note',  op: 'upsert'    as const, payload: { icon: '📝' } },
  { emoji: '📸', label: 'Save a photo',   entityType: '📸', entityId: 'photo', op: 'upsert'    as const, payload: { icon: '📸' } },
  { emoji: '⭐', label: 'Save a star',    entityType: '⭐', entityId: 'star',  op: 'upsert'    as const, payload: { icon: '⭐' } },
  { emoji: '🗑', label: 'Delete',         entityType: '📝', entityId: 'note',  op: 'tombstone' as const, payload: {} },
];

export function WritePanel() {
  const { snapshot, writeToNode, selectNode } = useSimulationStore();
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [selectedNode, setSelectedNode] = useState('replica-a');
  const [lastResult, setLastResult] = useState<string | null>(null);

  const submit = () => {
    const p = PRESETS[selectedPreset];
    writeToNode(selectedNode, p.entityType, p.entityId, p.op, p.payload);
    const nodeName = NODE_LABELS[selectedNode] ?? selectedNode;
    const verb = p.op === 'tombstone' ? 'Deleted from' : 'Saved to';
    setLastResult(`✅ ${verb} ${nodeName} — will copy to others soon.`);
    selectNode(selectedNode);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-5 shadow-sm">
      <h2 className="text-base md:text-lg font-bold text-slate-800 mb-1">Write to a Server</h2>
      <p className="text-xs md:text-sm text-slate-500 mb-3">
        Pick what to save, pick which server, hit Save.
      </p>

      {/* Step 1: What */}
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">1. What to save</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => setSelectedPreset(i)}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left active:scale-95 ${
              selectedPreset === i
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            <span className="text-lg">{p.emoji}</span>
            <span className="text-xs leading-tight">{p.label}</span>
          </button>
        ))}
      </div>

      {/* Step 2: Where */}
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">2. Which server</p>
      <div className="flex gap-2 mb-4">
        {snapshot.nodes.map(n => (
          <button
            key={n.id}
            onClick={() => { setSelectedNode(n.id); selectNode(n.id); }}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all active:scale-95 ${
              n.partitioned
                ? 'border-red-200 bg-red-50 text-red-400'
                : selectedNode === n.id
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <div>{NODE_LABELS[n.id] ?? n.id}</div>
            {n.partitioned && <div className="text-xs font-normal">offline</div>}
          </button>
        ))}
      </div>

      {/* Save */}
      <button
        onClick={submit}
        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-base font-bold transition-colors shadow-sm"
      >
        Save →
      </button>

      {lastResult && (
        <div className="mt-3 text-sm text-slate-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
          {lastResult}
        </div>
      )}
    </div>
  );
}
