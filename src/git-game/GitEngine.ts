export interface FileEntry {
  path: string;
  content: string;
}

export interface Commit {
  hash: string;
  message: string;
  timestamp: number;
  parentHashes: string[];
  branch: string;
  snapshot: Record<string, string>;
}

export interface Branch {
  name: string;
  commitHash: string;
}

export interface MergeConflict {
  filePath: string;
  ourContent: string;
  theirContent: string;
  baseContent: string;
  resolved: boolean;
  resolvedContent?: string;
}

export type ActionKind =
  | 'init'
  | 'edit'
  | 'stage'
  | 'unstage'
  | 'commit'
  | 'branch'
  | 'switch'
  | 'merge_start'
  | 'merge_commit'
  | 'merge_conflict'
  | 'resolve'
  | 'merge_abort';

export interface ActionLog {
  kind: ActionKind;
  message: string;
  detail?: string;
}

const DEFAULT_FILES: Record<string, string> = {
  'README.md': '# My Project\n\nWelcome to the git tutorial!',
  'index.html': '<!DOCTYPE html>\n<html>\n<body>\n<h1>Hello World</h1>\n</body>\n</html>',
  'style.css': 'body { font-family: sans-serif; }',
};

let hashCounter = 0;
function shortHash(): string {
  hashCounter++;
  return hashCounter.toString(16).padStart(7, '0').slice(0, 7);
}

export class GitEngine {
  commits: Commit[] = [];
  branches: Record<string, Branch> = {};
  HEAD: string = 'main';
  staged: Record<string, string> = {};
  workingFiles: Record<string, string> = {};
  inProgressMerge: { sourceBranch: string; conflicts: MergeConflict[] } | null = null;
  log: ActionLog[] = [];

  constructor() {
    this.reset();
  }

  reset(): void {
    this.commits = [];
    this.branches = {};
    this.HEAD = 'main';
    this.staged = {};
    this.workingFiles = {};
    this.inProgressMerge = null;
    this.log = [];

    this.workingFiles = { ...DEFAULT_FILES };

    const firstCommit: Commit = {
      hash: shortHash(),
      message: 'Initial commit',
      timestamp: Date.now(),
      parentHashes: [],
      branch: 'main',
      snapshot: { ...DEFAULT_FILES },
    };
    this.commits.push(firstCommit);
    this.branches['main'] = { name: 'main', commitHash: firstCommit.hash };
    this.addLog('init', 'Repository initialized', 'Default files created: README.md, index.html, style.css');
  }

  private addLog(kind: ActionKind, message: string, detail?: string): void {
    this.log.push({ kind, message, detail });
  }

  getCurrentCommit(): Commit | undefined {
    const branch = this.branches[this.HEAD];
    if (!branch) return undefined;
    return this.commits.find(c => c.hash === branch.commitHash);
  }

  editFile(path: string, content: string): void {
    this.workingFiles[path] = content;
    this.addLog('edit', `Edited ${path}`);
  }

  stageFile(path: string): boolean {
    if (!(path in this.workingFiles)) return false;
    this.staged[path] = this.workingFiles[path];
    this.addLog('stage', `Staged ${path}`);
    return true;
  }

  unstageFile(path: string): void {
    delete this.staged[path];
    this.addLog('unstage', `Unstaged ${path}`);
  }

  stageAll(): void {
    for (const path of Object.keys(this.workingFiles)) {
      const currentCommit = this.getCurrentCommit();
      if (currentCommit && this.workingFiles[path] === (currentCommit.snapshot[path] ?? '')) {
        continue;
      }
      this.staged[path] = this.workingFiles[path];
    }
    this.addLog('stage', 'Staged all changed files');
  }

  commit(message: string): Commit | null {
    if (Object.keys(this.staged).length === 0) return null;

    const parent = this.getCurrentCommit();
    const snapshot = { ...(parent?.snapshot || {}), ...this.staged };

    const commit: Commit = {
      hash: shortHash(),
      message,
      timestamp: Date.now(),
      parentHashes: parent ? [parent.hash] : [],
      branch: this.HEAD,
      snapshot,
    };

    this.commits.push(commit);
    this.branches[this.HEAD].commitHash = commit.hash;
    this.staged = {};
    this.workingFiles = { ...snapshot };
    this.addLog('commit', `Committed as ${commit.hash}`, message);
    return commit;
  }

  createBranch(name: string): boolean {
    if (this.branches[name]) return false;
    const current = this.getCurrentCommit();
    if (!current) return false;
    this.branches[name] = { name, commitHash: current.hash };
    this.addLog('branch', `Created branch ${name}`);
    return true;
  }

  switchBranch(name: string): boolean {
    if (!this.branches[name]) return false;
    if (this.inProgressMerge) return false;
    if (Object.keys(this.staged).length > 0) return false;

    this.HEAD = name;
    const branchCommit = this.branches[name];
    const commit = this.commits.find(c => c.hash === branchCommit.commitHash);
    if (commit) {
      this.workingFiles = { ...commit.snapshot };
    }
    this.addLog('switch', `Switched to branch ${name}`);
    return true;
  }

  merge(source: string): { ok: boolean; conflicts: MergeConflict[] } {
    const sourceBranch = this.branches[source];
    const targetBranch = this.branches[this.HEAD];
    if (!sourceBranch || !targetBranch || source === this.HEAD) {
      return { ok: false, conflicts: [] };
    }

    const sourceCommit = this.commits.find(c => c.hash === sourceBranch.commitHash);
    const targetCommit = this.commits.find(c => c.hash === targetBranch.commitHash);
    if (!sourceCommit || !targetCommit) return { ok: false, conflicts: [] };

    const baseCommit = this.findMergeBase(sourceCommit, targetCommit);
    if (!baseCommit) return { ok: false, conflicts: [] };

    const conflicts: MergeConflict[] = [];
    const allFiles = new Set([
      ...Object.keys(sourceCommit.snapshot),
      ...Object.keys(targetCommit.snapshot),
    ]);

    for (const file of allFiles) {
      const baseContent = baseCommit.snapshot[file] ?? '';
      const ourContent = targetCommit.snapshot[file] ?? '';
      const theirContent = sourceCommit.snapshot[file] ?? '';

      if (ourContent !== baseContent && theirContent !== baseContent && ourContent !== theirContent) {
        conflicts.push({ filePath: file, ourContent, theirContent, baseContent, resolved: false });
      }
    }

    if (conflicts.length > 0) {
      this.inProgressMerge = { sourceBranch: source, conflicts };
      this.addLog('merge_conflict', `Merge conflict in ${conflicts.length} file(s)`, `Resolve conflicts in: ${conflicts.map(c => c.filePath).join(', ')}`);
      return { ok: false, conflicts };
    }

    this.createMergeCommit(source, sourceCommit);
    this.addLog('merge_commit', `Merged ${source} into ${this.HEAD}`, 'Fast-forward or no-conflict merge');
    return { ok: true, conflicts: [] };
  }

  private findMergeBase(a: Commit, b: Commit): Commit | null {
    const aAncestors = new Set<string>();
    let current: Commit | undefined = a;
    while (current) {
      aAncestors.add(current.hash);
      current = current.parentHashes.length > 0
        ? this.commits.find(c => c.hash === current.parentHashes[0])
        : undefined;
    }

    current = b;
    while (current) {
      if (aAncestors.has(current.hash)) return current;
      current = current.parentHashes.length > 0
        ? this.commits.find(c => c.hash === current.parentHashes[0])
        : undefined;
    }
    return null;
  }

  private createMergeCommit(sourceBranch: string, sourceCommit: Commit): void {
    const targetCommit = this.getCurrentCommit()!;

    if (sourceCommit.parentHashes.includes(targetCommit.hash)) {
      this.branches[this.HEAD].commitHash = sourceCommit.hash;
      this.workingFiles = { ...sourceCommit.snapshot };
      return;
    }

    const mergedSnapshot = { ...targetCommit.snapshot, ...sourceCommit.snapshot };

    const commit: Commit = {
      hash: shortHash(),
      message: `Merge branch '${sourceBranch}' into ${this.HEAD}`,
      timestamp: Date.now(),
      parentHashes: [targetCommit.hash, sourceCommit.hash],
      branch: this.HEAD,
      snapshot: mergedSnapshot,
    };

    this.commits.push(commit);
    this.branches[this.HEAD].commitHash = commit.hash;
    this.workingFiles = { ...mergedSnapshot };
  }

  resolveConflict(filePath: string, content: string): void {
    if (!this.inProgressMerge) return;
    const conflict = this.inProgressMerge.conflicts.find(c => c.filePath === filePath);
    if (!conflict) return;
    conflict.resolved = true;
    conflict.resolvedContent = content;
    this.addLog('resolve', `Resolved conflict in ${filePath}`);
  }

  completeMerge(): boolean {
    if (!this.inProgressMerge) return false;
    if (!this.inProgressMerge.conflicts.every(c => c.resolved)) return false;
    if (this.inProgressMerge.conflicts.length === 0) return false;

    const sourceBranch = this.inProgressMerge.sourceBranch;
    const sourceCommit = this.commits.find(c => c.hash === this.branches[sourceBranch].commitHash);
    if (!sourceCommit) return false;

    const targetCommit = this.getCurrentCommit()!;
    const mergedSnapshot: Record<string, string> = { ...targetCommit.snapshot };
    for (const conflict of this.inProgressMerge.conflicts) {
      mergedSnapshot[conflict.filePath] = conflict.resolvedContent!;
    }
    for (const [path, content] of Object.entries(sourceCommit.snapshot)) {
      if (!(path in mergedSnapshot)) {
        mergedSnapshot[path] = content;
      }
    }

    const commit: Commit = {
      hash: shortHash(),
      message: `Merge branch '${sourceBranch}' into ${this.HEAD}`,
      timestamp: Date.now(),
      parentHashes: [targetCommit.hash, sourceCommit.hash],
      branch: this.HEAD,
      snapshot: mergedSnapshot,
    };

    this.commits.push(commit);
    this.branches[this.HEAD].commitHash = commit.hash;
    this.workingFiles = { ...mergedSnapshot };
    this.inProgressMerge = null;
    this.addLog('merge_commit', `Merge completed: ${sourceBranch} → ${this.HEAD}`, 'All conflicts resolved');
    return true;
  }

  abortMerge(): void {
    this.inProgressMerge = null;
    this.addLog('merge_abort', 'Merge aborted');
  }

  getCommitsForGraph(): Commit[] {
    return [...this.commits].sort((a, b) => a.timestamp - b.timestamp);
  }

  setupScenarioFirstCommit(): void {
    this.reset();
    this.addLog('init', '📋 Scenario: Your First Commit', 'Edit a file → Stage it → Commit. This is the basic git workflow.');
  }

  setupScenarioBranching(): void {
    this.reset();
    this.commits[0].message = 'Initial commit';
    this.workingFiles['README.md'] = '# My Project\n\nHello!';
    this.staged['README.md'] = this.workingFiles['README.md'];
    this.commit('Add greeting to README');

    this.workingFiles['index.html'] = '<h1>Hello World</h1>';
    this.staged['index.html'] = this.workingFiles['index.html'];
    this.commit('Update index.html');

    this.addLog('init', '📋 Scenario: Branching Out',
      'You have 2 commits on main. Create a branch, switch to it, and make a new commit on it.'
    );
  }

  setupScenarioMerge(): void {
    this.reset();
    this.commits[0].message = 'Initial commit';
    this.workingFiles['README.md'] = '# My Project\n\nHello!';
    this.staged['README.md'] = this.workingFiles['README.md'];
    this.commit('Add greeting');

    this.workingFiles['index.html'] = '<h1>Hello World</h1>';
    this.staged['index.html'] = this.workingFiles['index.html'];
    this.commit('Update homepage');

    const initial = this.getCurrentCommit()!.hash;

    this.createBranch('feature');
    this.switchBranch('feature');

    this.workingFiles['app.js'] = 'console.log("hello");';
    this.staged['app.js'] = this.workingFiles['app.js'];
    this.commit('Add app.js');

    this.workingFiles['README.md'] = '# My Project\n\nHello!\n\nSee app.js for code.';
    this.staged['README.md'] = this.workingFiles['README.md'];
    this.commit('Update README');

    this.switchBranch('main');

    this.addLog('init', '📋 Scenario: Fast-Forward Merge',
      `A branch "feature" with 2 commits is ahead of main. Switch ${this.HEAD === 'main' ? '' : 'to main and '}merge feature into it.`
    );
  }

  setupScenarioConflict(): void {
    this.reset();
    this.branches = {};
    this.commits = [];
    this.HEAD = 'main';
    this.staged = {};
    this.inProgressMerge = null;
    this.log = [];

    const baseFiles: Record<string, string> = {
      'greeting.txt': 'Hello everyone!',
      'README.md': '# Project\n\nShared project.',
    };

    this.workingFiles = { ...baseFiles };

    const initial: Commit = {
      hash: shortHash(),
      message: 'Initial commit',
      timestamp: Date.now() - 10000,
      parentHashes: [],
      branch: 'main',
      snapshot: { ...baseFiles },
    };
    this.commits.push(initial);
    this.branches['main'] = { name: 'main', commitHash: initial.hash };

    this.createBranch('feature');
    this.switchBranch('feature');

    this.workingFiles['greeting.txt'] = 'Hello everyone!\n\nWelcome to the feature branch!';
    this.staged['greeting.txt'] = this.workingFiles['greeting.txt'];
    const featCommit: Commit = {
      hash: shortHash(),
      message: 'Update greeting on feature',
      timestamp: Date.now() - 5000,
      parentHashes: [initial.hash],
      branch: 'feature',
      snapshot: { ...baseFiles, 'greeting.txt': 'Hello everyone!\n\nWelcome to the feature branch!' },
    };
    this.commits.push(featCommit);
    this.branches['feature'].commitHash = featCommit.hash;

    this.switchBranch('main');

    this.workingFiles['greeting.txt'] = 'Hello everyone!\n\nThis is the main branch!';
    this.staged['greeting.txt'] = this.workingFiles['greeting.txt'];
    const mainCommit: Commit = {
      hash: shortHash(),
      message: 'Update greeting on main',
      timestamp: Date.now() - 3000,
      parentHashes: [initial.hash],
      branch: 'main',
      snapshot: { ...baseFiles, 'greeting.txt': 'Hello everyone!\n\nThis is the main branch!' },
    };
    this.commits.push(mainCommit);
    this.branches['main'].commitHash = mainCommit.hash;
    this.workingFiles = { ...mainCommit.snapshot };

    this.staged = {};

    this.addLog('init', '📋 Scenario: Resolve a Conflict',
      'Two branches modified the same file differently. Merge feature into main, then resolve the conflict by choosing or combining the content.'
    );
  }
}
