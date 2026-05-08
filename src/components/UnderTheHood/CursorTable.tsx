import { useSimulationStore } from '../../store/simulationStore';
import { NODE_LABELS } from '../../engine/cluster';

export function CursorTable() {
  const { snapshot } = useSimulationStore();

  const nodeIds = snapshot.nodes.map(n => n.id);

  return (
    <div className="overflow-x-auto">
      <div className="text-sm text-slate-500 mb-3">
        Each cell shows the last time a server (row) received updates from another server (column).
        "Never synced" means they haven't talked yet.
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Server</th>
            {nodeIds.map(col => (
              <th key={col} className="text-left py-2 px-2 text-slate-500 font-medium">
                ← from {NODE_LABELS[col] ?? col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {snapshot.nodes.map(rowNode => (
            <tr key={rowNode.id} className="border-t border-slate-200">
              <td className="py-2 px-2 text-slate-700 font-medium">{NODE_LABELS[rowNode.id] ?? rowNode.id}</td>
              {nodeIds.map(colId => {
                if (colId === rowNode.id) {
                  return <td key={colId} className="py-2 px-2 text-slate-300 text-center">—</td>;
                }
                const cursor = rowNode.cursors[colId];
                const ms = cursor ? parseInt(cursor.split('-')[0]) : null;
                return (
                  <td key={colId} className="py-2 px-2">
                    {ms
                      ? <span className="text-blue-600">{new Date(ms).toLocaleTimeString()}</span>
                      : <span className="text-slate-400">Never synced</span>
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
