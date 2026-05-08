import { useRef, useEffect, useState } from 'react';
import type { NodeSnapshot } from '../../engine/types';
import { NODE_LABELS } from '../../engine/cluster';
import { useSimulationStore } from '../../store/simulationStore';

const NODE_COLORS: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  'replica-a': { bg: 'bg-blue-50',    border: 'border-blue-300',   dot: 'bg-blue-500',    text: 'text-blue-700' },
  'replica-b': { bg: 'bg-emerald-50', border: 'border-emerald-300',dot: 'bg-emerald-500', text: 'text-emerald-700' },
  'replica-c': { bg: 'bg-violet-50',  border: 'border-violet-300', dot: 'bg-violet-500',  text: 'text-violet-700' },
};

interface Props {
  node: NodeSnapshot;
  selected: boolean;
}

export function ReplicaCard({ node, selected }: Props) {
  const { selectNode, partitionNode, healPartition } = useSimulationStore();
  const colors = NODE_COLORS[node.id] ?? NODE_COLORS['replica-a'];
  const prevHlcRef = useRef(node.hlc);
  const [bumped, setBumped] = useState(false);

  const displayName = NODE_LABELS[node.id] ?? node.id;

  useEffect(() => {
    if (node.hlc !== prevHlcRef.current) {
      prevHlcRef.current = node.hlc;
      setBumped(true);
      const t = setTimeout(() => setBumped(false), 500);
      return () => clearTimeout(t);
    }
  }, [node.hlc]);

  const suspicionValues = Object.values(node.peerHealth);
  const anyDown = suspicionValues.some(h => !h.alive);

  return (
    <div
      onClick={() => selectNode(node.id)}
      className={`h-full rounded-xl border-2 p-3 cursor-pointer transition-all ${
        node.partitioned ? 'bg-red-50 border-red-300' : `${colors.bg} ${colors.border}`
      } ${selected ? 'ring-2 ring-offset-1 ring-blue-400 shadow-md' : 'active:brightness-95'}`}
    >
      {/* Name + status */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${node.partitioned ? 'bg-red-400' : colors.dot}`}/>
        <span className={`font-bold text-sm leading-tight ${node.partitioned ? 'text-red-600' : colors.text}`}>
          {displayName}
        </span>
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium ${
          node.partitioned ? 'bg-red-100 text-red-600' :
          anyDown ? 'bg-amber-100 text-amber-700' :
          'bg-green-100 text-green-700'
        }`}>
          {node.partitioned ? '⚡' : anyDown ? '⚠' : '✓'}
        </span>
      </div>

      {/* Last save time */}
      <div className={`text-xs font-mono text-slate-600 mb-2 ${bumped ? 'hlc-bump' : ''}`}>
        {new Date(parseInt(node.hlc.split('-')[0])).toLocaleTimeString()}
      </div>

      {/* Stats */}
      <div className="text-xs text-slate-500 mb-3">
        <span className="font-semibold text-slate-700">{node.entityState.size}</span> items ·{' '}
        <span className="font-semibold text-slate-700">{node.logSize}</span> changes
      </div>

      {/* Action button */}
      {node.partitioned ? (
        <button
          onClick={e => { e.stopPropagation(); healPartition(node.id); }}
          className="w-full text-xs py-2 rounded-lg bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-semibold transition-colors"
        >
          💚 Reconnect
        </button>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); partitionNode(node.id); }}
          className="w-full text-xs py-2 rounded-lg bg-white hover:bg-red-50 active:bg-red-100 border border-slate-300 hover:border-red-300 text-slate-600 hover:text-red-600 font-medium transition-colors"
        >
          ⚡ Disconnect
        </button>
      )}
    </div>
  );
}
