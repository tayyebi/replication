import { useSimulationStore } from '../../store/simulationStore';
import type { DigestBucket } from '../../engine/types';
import { NODE_LABELS } from '../../engine/cluster';

export function DigestGrid() {
  const { snapshot } = useSimulationStore();

  const keys = new Set<string>();
  for (const node of snapshot.nodes)
    for (const d of node.digests)
      keys.add(`${d.entityType}:${d.hourBucket}`);

  if (keys.size === 0)
    return <div className="text-sm text-slate-400 mb-4">No fingerprints yet.</div>;

  const allKeys = Array.from(keys).sort();

  const getDigest = (nodeId: string, key: string): DigestBucket | undefined => {
    const node = snapshot.nodes.find(n => n.id === nodeId);
    const [entityType, hourStr] = key.split(':');
    return node?.digests.find(d => d.entityType === entityType && d.hourBucket === parseInt(hourStr));
  };

  return (
    <div className="mb-4 overflow-x-auto">
      <div className="text-sm text-slate-500 mb-2">
        📋 Fingerprints — if the numbers don't match, a server is missing data
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left py-1.5 pr-2 text-slate-500 font-medium">Data type</th>
            {snapshot.nodes.map(n => (
              <th key={n.id} className="text-left py-1.5 px-2 text-slate-500 font-medium">
                {NODE_LABELS[n.id] ?? n.id}
              </th>
            ))}
            <th className="text-left py-1.5 px-2 text-slate-500 font-medium">Match?</th>
          </tr>
        </thead>
        <tbody>
          {allKeys.map(key => {
            const digests = snapshot.nodes.map(n => getDigest(n.id, key));
            const values = digests.map(d => d?.xorDigest ?? 0);
            const allMatch = values.every(v => v === values[0]);
            return (
              <tr key={key} className={`border-t border-slate-200 ${!allMatch ? 'bg-red-50' : ''}`}>
                <td className="py-1.5 pr-2 text-slate-700">{key.split(':')[0]}</td>
                {digests.map((d, i) => (
                  <td key={i} className="py-1.5 px-2 font-mono text-sm">
                    {d
                      ? <span className={!allMatch ? 'text-red-600 font-semibold' : 'text-green-600'}>
                          {allMatch ? '✅' : '❌'}
                        </span>
                      : <span className="text-slate-300">——</span>
                    }
                  </td>
                ))}
                <td className="py-1.5 px-2">
                  {allMatch
                    ? <span className="text-green-600 font-semibold">✅ Match</span>
                    : <span className="text-red-600 font-semibold">❌ Mismatch!</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
