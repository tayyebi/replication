import { useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { LogTable } from './LogTable';
import { CursorTable } from './CursorTable';
import { DigestTable } from './DigestTable';
import { NODE_LABELS } from '../../engine/cluster';

type Tab = 'log' | 'cursors' | 'digests' | 'entities';

const TABS: { id: Tab; label: string; emoji: string; description: string }[] = [
  { id: 'log',      emoji: '📜', label: 'Change History',   description: 'Every save ever made on this server, newest first. The server never deletes these — it keeps a permanent record.' },
  { id: 'cursors',  emoji: '📍', label: 'Sync Progress',    description: 'Tracks how much each server has copied from every other server. Think of it as a bookmark showing "I\'ve read this far."' },
  { id: 'digests',  emoji: '🔑', label: 'Fingerprints',     description: 'A short number that summarises all data for each type. If two servers have different fingerprints, one is missing something.' },
  { id: 'entities', emoji: '📦', label: 'Stored Items',     description: 'The actual items stored right now — after all conflicts have been resolved.' },
];

export function UnderTheHood() {
  const { snapshot, selectedNodeId, selectNode } = useSimulationStore();
  const [tab, setTab] = useState<Tab>('log');
  const [open, setOpen] = useState(false);

  const selectedNode = snapshot.nodes.find(n => n.id === selectedNodeId) ?? snapshot.nodes[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div>
          <h2 className="text-base font-bold text-slate-800 text-left">🔬 Under the Hood</h2>
          <p className="text-sm text-slate-400 mt-0.5 text-left">See the raw data each server is actually storing</p>
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {/* Node selector */}
          <div className="flex items-center gap-2 mt-4 mb-4">
            <span className="text-sm text-slate-500">Viewing:</span>
            <div className="flex gap-1.5">
              {snapshot.nodes.map(n => (
                <button
                  key={n.id}
                  onClick={() => selectNode(n.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors font-medium ${
                    selectedNode?.id === n.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {NODE_LABELS[n.id] ?? n.id}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3 flex-wrap border-b border-slate-200 pb-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  tab === t.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-500 mb-3">{TABS.find(t => t.id === tab)?.description}</p>

          {tab === 'log' && selectedNode && <LogTable entries={selectedNode.log} />}
          {tab === 'cursors' && <CursorTable />}
          {tab === 'digests' && selectedNode && <DigestTable nodeId={selectedNode.id} />}
          {tab === 'entities' && selectedNode && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Item</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Last saved by</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(selectedNode.entityState.entries()).map(([key, entity]) => (
                    <tr key={key} className={`border-b border-slate-100 ${entity.tombstoned ? 'opacity-50' : ''}`}>
                      <td className="py-2 px-2 font-mono text-slate-700">{key}</td>
                      <td className="py-2 px-2 text-slate-600">
                        {NODE_LABELS[entity.originReplica] ?? entity.originReplica}
                      </td>
                      <td className="py-2 px-2">
                        {entity.tombstoned
                          ? <span className="text-red-500 font-medium">deleted</span>
                          : <span className="text-green-600 font-medium">active</span>}
                      </td>
                      <td className="py-2 px-2 font-mono text-slate-400 text-xs">
                        {(entity.data.icon as string) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
