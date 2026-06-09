import { useRef, useEffect, useState } from 'react';
import type { LogEntry } from '../../engine/types';
import { NODE_LABELS } from '../../engine/cluster';

interface Props {
  entries: LogEntry[];
}

export function LogTable({ entries }: Props) {
  const prevCount = useRef(entries.length);
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (entries.length > prevCount.current) {
      const added = entries.slice(prevCount.current);
      const ids = new Set(added.map(e => e.hlc));
      setNewEntryIds(ids);
      prevCount.current = entries.length;
      const t = setTimeout(() => setNewEntryIds(new Set()), 1500);
      return () => clearTimeout(t);
    }
    prevCount.current = entries.length;
  }, [entries.length]);

  const reversed = [...entries].reverse().slice(0, 100);

  if (entries.length === 0) {
    return <div className="text-sm text-slate-400 p-3">No changes yet. Save something first!</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Time</th>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Saved by</th>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Type</th>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">ID</th>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Action</th>
            <th className="text-left py-2 px-2 text-slate-500 font-medium">Data</th>
          </tr>
        </thead>
        <tbody>
          {reversed.map(entry => {
            const ms = parseInt(entry.hlc.split('-')[0]);
            return (
              <tr
                key={entry.hlc}
                className={`border-b border-slate-100 ${newEntryIds.has(entry.hlc) ? 'entry-flash' : ''}`}
              >
                <td className="py-1.5 px-2 text-slate-700 whitespace-nowrap">
                  {new Date(ms).toLocaleTimeString()}
                </td>
                <td className="py-1.5 px-2 text-slate-600">
                  {NODE_LABELS[entry.originReplica] ?? entry.originReplica}
                </td>
                <td className="py-1.5 px-2 text-slate-700">{entry.entityType}</td>
                <td className="py-1.5 px-2 text-slate-700 font-mono text-xs">{entry.entityId}</td>
                <td className="py-1.5 px-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    entry.op === 'upsert'    ? 'bg-blue-100 text-blue-700' :
                    entry.op === 'tombstone' ? 'bg-red-100 text-red-600' :
                                              'bg-green-100 text-green-700'
                  }`}>{entry.op === 'tombstone' ? '🗑' : '💾'}</span>
                </td>
                <td className="py-1.5 px-2 text-slate-400 font-mono text-xs max-w-xs truncate">
                  {(entry.payload as Record<string, unknown>).icon as string || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
