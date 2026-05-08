import { compareHlc } from '../../engine/hlc';
import { NODE_LABELS } from '../../engine/cluster';

interface Props {
  nodeAId: string; nodeBId: string;
  versionA: string; versionB: string;
  dataA: Record<string, unknown>; dataB: Record<string, unknown>;
  originA: string; originB: string;
}

export function LwwComparison({ nodeAId, nodeBId, versionA, versionB, dataA, dataB, originA, originB }: Props) {
  const cmp = compareHlc(versionA, versionB);
  const winnerNode = cmp > 0 ? nodeAId : cmp < 0 ? nodeBId : (originA > originB ? nodeAId : nodeBId);
  const isTiebreak = cmp === 0;

  const msA = parseInt(versionA.split('-')[0]);
  const msB = parseInt(versionB.split('-')[0]);

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-4">
      <div className="text-sm font-bold text-slate-700 mb-3">⚔️ Two conflicting versions</div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {[
          { nodeId: nodeAId, data: dataA, ms: msA },
          { nodeId: nodeBId, data: dataB, ms: msB },
        ].map(({ nodeId, data, ms }) => {
          const isWinner = nodeId === winnerNode;
          return (
            <div key={nodeId} className={`rounded-xl p-3 border-2 ${isWinner ? 'bg-green-50 border-green-400' : 'bg-white border-slate-200 opacity-60'}`}>
              <div className={`text-sm font-bold mb-1 ${
                nodeId === 'replica-a' ? 'text-blue-700' :
                nodeId === 'replica-b' ? 'text-emerald-700' : 'text-violet-700'
              }`}>
                {NODE_LABELS[nodeId] ?? nodeId} {isWinner ? '🏆' : ''}
              </div>
              <div className="text-sm text-slate-600 mb-1">
                Saved at <span className="font-semibold text-slate-800">{new Date(ms).toLocaleTimeString()}</span>
              </div>
              <div className="text-xs text-slate-400 truncate font-mono">
                {JSON.stringify(data).slice(0, 50)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg p-3 text-sm text-slate-600 border border-slate-200">
        {isTiebreak ? (
          <>
            <span className="text-amber-600 font-semibold">Tie!</span> Both were saved at the same instant.
            The system picks the winner by server name alphabetically.{' '}
            <span className="text-green-700 font-semibold">{NODE_LABELS[winnerNode] ?? winnerNode}</span> wins.
          </>
        ) : cmp > 0 ? (
          <>
            <span className="text-green-700 font-semibold">{NODE_LABELS[nodeAId] ?? nodeAId}</span> saved <strong>later</strong> — its version wins and the older one is discarded.
          </>
        ) : (
          <>
            <span className="text-green-700 font-semibold">{NODE_LABELS[nodeBId] ?? nodeBId}</span> saved <strong>later</strong> — its version wins and the older one is discarded.
          </>
        )}
        <div className="mt-1 text-slate-400 text-xs">Rule: the most recently saved version always wins.</div>
      </div>
    </div>
  );
}
