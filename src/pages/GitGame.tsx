import { useGitStore } from '../git-game/GitStore';
import { GitGraph } from '../git-game/GitGraph';
import { GitWorkspace } from '../git-game/GitWorkspace';
import { GitControls } from '../git-game/GitControls';
import { GitNarrative } from '../git-game/GitNarrative';
import { GitScenarios } from '../git-game/GitScenarios';
import { GitConflictResolver } from '../git-game/GitConflictResolver';
import { useNavigate } from 'react-router-dom';

export default function GitGame() {
  const navigate = useNavigate();
  const {
    commits, branches, HEAD, workingFiles, staged,
    inProgressMerge, log,
    editFile, stageFile, unstageFile, stageAll,
    commit, createBranch, switchBranch, merge,
    resolveConflict, completeMerge, abortMerge,
    reset, setupScenario,
  } = useGitStore();

  const conflicts = inProgressMerge?.conflicts ?? [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <button onClick={() => navigate('/')}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
        >← Back to Menu</button>
        <div className="flex gap-1">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
          <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
        </div>
        <h1 className="text-base font-bold text-slate-800 tracking-tight">🌿 Git Visualizer</h1>
      </header>

      {/* Intro */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex-shrink-0">
        <p className="text-xs md:text-sm font-semibold text-emerald-900">📚 Learn git concepts by doing.</p>
        <p className="text-[11px] text-emerald-700 mt-0.5">
          Edit files, stage changes, commit, branch, and merge — see every command reflected in the graph.
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="p-3 space-y-3 pb-4">

            {/* Scenarios */}
            <GitScenarios
              activeScenario={null}
              onSelect={setupScenario}
              onReset={reset}
            />

            {/* Commit Graph */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-5 shadow-sm">
              <h2 className="text-base md:text-lg font-bold text-slate-800 mb-1">Commit Graph</h2>
              <p className="text-xs md:text-sm text-slate-500 mb-3">
                Each dot is a commit. Colors show different branches. HEAD marks your current position.
              </p>
              <GitGraph commits={commits} branches={branches} HEAD={HEAD} />
            </div>

            {/* Workspace + Staging */}
            <GitWorkspace
              workingFiles={workingFiles}
              staged={staged}
              onEdit={editFile}
              onStage={stageFile}
              onUnstage={unstageFile}
            />

            {/* Conflict Resolver */}
            {inProgressMerge && conflicts.map(c => (
              !c.resolved && (
                <GitConflictResolver
                  key={c.filePath}
                  conflict={c}
                  onResolve={resolveConflict}
                />
              )
            ))}

            {/* Controls */}
            <GitControls
              branches={branches}
              HEAD={HEAD}
              stagedCount={Object.keys(staged).length}
              inProgressMerge={inProgressMerge !== null}
              conflicts={conflicts}
              onStageAll={stageAll}
              onCommit={commit}
              onCreateBranch={createBranch}
              onSwitchBranch={switchBranch}
              onMerge={merge}
              onCompleteMerge={completeMerge}
              onAbortMerge={abortMerge}
            />
          </div>
        </div>

        {/* Narrative sidebar */}
        <div className="hidden md:flex w-80 flex-shrink-0 border-l border-slate-200 flex-col">
          <GitNarrative log={log} HEAD={HEAD} stagedCount={Object.keys(staged).length} />
        </div>
      </div>

      {/* Mobile narrative */}
      <div className="md:hidden border-t border-slate-200 bg-white">
        <GitNarrative log={log} HEAD={HEAD} stagedCount={Object.keys(staged).length} />
      </div>
    </div>
  );
}
