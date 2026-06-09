import { useSimulationStore } from '../../store/simulationStore';

interface Props {
  nodeId: string;
}

export function DigestTable({ nodeId }: Props) {
  const { snapshot } = useSimulationStore();
  const node = snapshot.nodes.find(n => n.id === nodeId);
  if (!node) return null;

  if (node.digests.length === 0) {
    return <div className="text-sm text-slate-400 p-3">No fingerprints yet. Save something first.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="text-sm text-slate-500 mb-3">
        Each row is a "fingerprint" of all changes for one data type in a one-hour window.
        Servers compare these to detect missing data — a mismatch means something needs to be copied over.
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Data type</th>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Time window</th>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Items</th>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Fingerprint</th>
          </tr>
        </thead>
        <tbody>
          {node.digests.map(d => (
            <tr key={`${d.entityType}:${d.hourBucket}`} className="border-t border-slate-200">
              <td className="py-2 px-2 text-slate-700">{d.entityType}</td>
              <td className="py-2 px-2 text-slate-600">Hour {d.hourBucket}</td>
              <td className="py-2 px-2 text-slate-700">{d.count}</td>
              <td className="py-2 px-2 font-mono text-amber-600">🔑</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
