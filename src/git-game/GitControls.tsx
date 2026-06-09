import { useState } from 'react';

interface Props {
  branches: { name: string; commitHash: string }[];
  HEAD: string;
  stagedCount: number;
  inProgressMerge: boolean;
  conflicts: { filePath: string; resolved: boolean }[];
  onStageAll: () => void;
  onCommit: (message: string) => void;
  onCreateBranch: (name: string) => void;
  onSwitchBranch: (name: string) => void;
  onMerge: (source: string) => void;
  onCompleteMerge: () => void;
  onAbortMerge: () => void;
}

export function GitControls({
  branches, HEAD, stagedCount, inProgressMerge, conflicts,
  onStageAll, onCommit, onCreateBranch, onSwitchBranch, onMerge,
  onCompleteMerge, onAbortMerge,
}: Props) {
  const [commitMsg, setCommitMsg] = useState('');
  const [branchName, setBranchName] = useState('');
  const [mergeSource, setMergeSource] = useState('');

  const canCommit = stagedCount > 0 && commitMsg.trim().length > 0;
  const allConflictsResolved = conflicts.length > 0 && conflicts.every(c => c.resolved);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
      {/* Commit */}
      <div className="flex items-center gap-2">
        <input
          value={commitMsg}
          onChange={e => setCommitMsg(e.target.value)}
          placeholder="Commit message…"
          className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          disabled={inProgressMerge}
        />
        <button
          onClick={() => { if (canCommit) { onCommit(commitMsg.trim()); setCommitMsg(''); } }}
          disabled={!canCommit || inProgressMerge}
          className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors active:scale-95 ${
            canCommit && !inProgressMerge
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Commit
        </button>
      </div>

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2">
        <button onClick={onStageAll} disabled={inProgressMerge}
          className="px-3 py-1.5 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >Stage All</button>

        {/* Create branch */}
        <div className="flex items-center gap-1">
          <input
            value={branchName}
            onChange={e => setBranchName(e.target.value)}
            placeholder="branch name"
            className="w-28 text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            disabled={inProgressMerge}
          />
          <button
            onClick={() => { if (branchName.trim()) { onCreateBranch(branchName.trim()); setBranchName(''); } }}
            disabled={!branchName.trim() || inProgressMerge}
            className="px-3 py-1.5 text-xs font-semibold bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >+ Branch</button>
        </div>

        {/* Switch branch */}
        <select
          value=""
          onChange={e => { if (e.target.value) { onSwitchBranch(e.target.value); } }}
          disabled={inProgressMerge}
          className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none disabled:opacity-40"
        >
          <option value="">Switch to…</option>
          {branches.filter(b => b.name !== HEAD).map(b => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>

        {/* Merge */}
        <select
          value={mergeSource}
          onChange={e => setMergeSource(e.target.value)}
          disabled={inProgressMerge}
          className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none disabled:opacity-40"
        >
          <option value="">Merge branch…</option>
          {branches.filter(b => b.name !== HEAD).map(b => (
            <option key={b.name} value={b.name}>{b.name} → {HEAD}</option>
          ))}
        </select>
        <button
          onClick={() => { if (mergeSource) { onMerge(mergeSource); setMergeSource(''); } }}
          disabled={!mergeSource || inProgressMerge}
          className="px-3 py-1.5 text-xs font-semibold bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        >Merge</button>
      </div>

      {/* Merge conflict resolution */}
      {inProgressMerge && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 space-y-2">
          <p className="text-sm font-bold text-amber-800">⚡ Merge in Progress</p>
          {conflicts.map(c => (
            <div key={c.filePath} className="text-xs text-amber-700">
              • {c.filePath}: {c.resolved ? '✅ Resolved' : '❌ Not resolved'}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={onCompleteMerge}
              disabled={!allConflictsResolved}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold active:scale-95 ${
                allConflictsResolved
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >Complete Merge</button>
            <button onClick={onAbortMerge}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 active:scale-95"
            >Abort Merge</button>
          </div>
        </div>
      )}
    </div>
  );
}
