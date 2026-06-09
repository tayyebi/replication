import { create } from 'zustand';
import { GitEngine, type Commit, type Branch, type MergeConflict, type ActionLog } from './GitEngine';

interface GitStore {
  engine: GitEngine;
  commits: Commit[];
  branches: Branch[];
  HEAD: string;
  workingFiles: Record<string, string>;
  staged: Record<string, string>;
  inProgressMerge: { sourceBranch: string; conflicts: MergeConflict[] } | null;
  log: ActionLog[];

  editFile: (path: string, content: string) => void;
  stageFile: (path: string) => void;
  unstageFile: (path: string) => void;
  stageAll: () => void;
  commit: (message: string) => void;
  createBranch: (name: string) => void;
  switchBranch: (name: string) => void;
  merge: (source: string) => { ok: boolean; conflicts: MergeConflict[] };
  resolveConflict: (filePath: string, content: string) => void;
  completeMerge: () => void;
  abortMerge: () => void;
  reset: () => void;
  setupScenario: (scenario: string) => void;
}

function snapshot(engine: GitEngine) {
  return {
    commits: [...engine.commits],
    branches: Object.values(engine.branches),
    HEAD: engine.HEAD,
    workingFiles: { ...engine.workingFiles },
    staged: { ...engine.staged },
    inProgressMerge: engine.inProgressMerge
      ? { sourceBranch: engine.inProgressMerge.sourceBranch, conflicts: engine.inProgressMerge.conflicts.map(c => ({ ...c })) }
      : null,
    log: [...engine.log],
  };
}

export const useGitStore = create<GitStore>((set, get) => {
  const engine = new GitEngine();

  return {
    engine,
    ...snapshot(engine),

    editFile: (path, content) => {
      const { engine } = get();
      engine.editFile(path, content);
      set(snapshot(engine));
    },

    stageFile: (path) => {
      const { engine } = get();
      engine.stageFile(path);
      set(snapshot(engine));
    },

    unstageFile: (path) => {
      const { engine } = get();
      engine.unstageFile(path);
      set(snapshot(engine));
    },

    stageAll: () => {
      const { engine } = get();
      engine.stageAll();
      set(snapshot(engine));
    },

    commit: (message) => {
      const { engine } = get();
      engine.commit(message);
      set(snapshot(engine));
    },

    createBranch: (name) => {
      const { engine } = get();
      engine.createBranch(name);
      set(snapshot(engine));
    },

    switchBranch: (name) => {
      const { engine } = get();
      engine.switchBranch(name);
      set(snapshot(engine));
    },

    merge: (source) => {
      const { engine } = get();
      const result = engine.merge(source);
      set(snapshot(engine));
      return result;
    },

    resolveConflict: (filePath, content) => {
      const { engine } = get();
      engine.resolveConflict(filePath, content);
      set(snapshot(engine));
    },

    completeMerge: () => {
      const { engine } = get();
      engine.completeMerge();
      set(snapshot(engine));
    },

    abortMerge: () => {
      const { engine } = get();
      engine.abortMerge();
      set(snapshot(engine));
    },

    reset: () => {
      const { engine } = get();
      engine.reset();
      set(snapshot(engine));
    },

    setupScenario: (scenario) => {
      const { engine } = get();
      switch (scenario) {
        case 'first-commit': engine.setupScenarioFirstCommit(); break;
        case 'branching': engine.setupScenarioBranching(); break;
        case 'merge': engine.setupScenarioMerge(); break;
        case 'conflict': engine.setupScenarioConflict(); break;
        default: engine.reset();
      }
      set(snapshot(engine));
    },
  };
});
