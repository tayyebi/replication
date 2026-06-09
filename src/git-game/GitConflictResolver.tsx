import { useState } from 'react';
import type { MergeConflict } from './GitEngine';

interface Props {
  conflict: MergeConflict;
  onResolve: (filePath: string, content: string) => void;
}

export function GitConflictResolver({ conflict, onResolve }: Props) {
  const [mode, setMode] = useState<'ours' | 'theirs' | 'manual'>('manual');
  const [manualContent, setManualContent] = useState('');

  const resolvedContent = mode === 'ours'
    ? conflict.ourContent
    : mode === 'theirs'
    ? conflict.theirContent
    : manualContent;

  return (
    <div className="border border-red-200 bg-red-50 rounded-xl p-3 space-y-2">
      <h4 className="text-sm font-bold text-red-800">⚡ Conflict: {conflict.filePath}</h4>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="border border-slate-300 bg-white rounded-lg p-2">
          <div className="font-semibold text-slate-600 mb-1">Ours ({conflict.ourContent.split('\n')[0].slice(0, 30)})</div>
          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">{conflict.ourContent}</pre>
          <button onClick={() => { setMode('ours'); onResolve(conflict.filePath, conflict.ourContent); }}
            className="mt-1 text-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-semibold"
          >Use ours</button>
        </div>
        <div className="border border-slate-300 bg-white rounded-lg p-2">
          <div className="font-semibold text-slate-600 mb-1">Theirs ({conflict.theirContent.split('\n')[0].slice(0, 30)})</div>
          <pre className="text-[10px] font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">{conflict.theirContent}</pre>
          <button onClick={() => { setMode('theirs'); onResolve(conflict.filePath, conflict.theirContent); }}
            className="mt-1 text-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded font-semibold"
          >Use theirs</button>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600">Or write a custom resolution:</label>
        <textarea
          value={mode === 'manual' ? manualContent : resolvedContent}
          onChange={e => { setMode('manual'); setManualContent(e.target.value); onResolve(conflict.filePath, e.target.value); }}
          className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg bg-white resize-y mt-1 focus:outline-none focus:ring-2 focus:ring-red-300"
          rows={4}
        />
      </div>
    </div>
  );
}
