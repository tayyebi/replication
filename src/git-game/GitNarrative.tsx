import { useRef, useEffect } from 'react';
import type { ActionLog } from './GitEngine';

interface Props {
  log: ActionLog[];
  HEAD: string;
  stagedCount: number;
}

const KIND_EMOJI: Record<string, string> = {
  init: '🚀', edit: '✏️', stage: '📦', unstage: '🗑️',
  commit: '✅', branch: '🌿', switch: '🔄', merge_start: '🔀',
  merge_commit: '🔀', merge_conflict: '⚡', resolve: '🛠️',
  merge_abort: '⏹️',
};

export function GitNarrative({ log, HEAD, stagedCount }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log.length]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-700">📋 Activity Log</h3>
        <span className="text-xs text-slate-400">Branch: <strong className="text-slate-600">{HEAD}</strong></span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 max-h-48 md:max-h-none" style={{ minHeight: 80 }}>
        {log.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No activity yet.</p>
        ) : (
          log.map((entry, i) => (
            <div key={i} className="text-xs border-l-2 border-slate-200 pl-2 py-0.5">
              <span className="mr-1">{KIND_EMOJI[entry.kind] || '•'}</span>
              <span className="text-slate-700 font-medium">{entry.message}</span>
              {entry.detail && (
                <p className="text-slate-400 mt-0.5 text-[10px]">{entry.detail}</p>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {stagedCount > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-emerald-600 font-semibold">
          📦 {stagedCount} file(s) staged — ready to commit
        </div>
      )}
    </div>
  );
}
