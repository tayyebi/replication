interface Props {
  activeScenario: string | null;
  onSelect: (scenario: string) => void;
  onReset: () => void;
}

const SCENARIOS = [
  {
    id: 'first-commit',
    emoji: '🌱',
    name: 'Your First Commit',
    description: 'Learn the basic git workflow: edit, stage, commit.',
  },
  {
    id: 'branching',
    emoji: '🌿',
    name: 'Branching Out',
    description: 'Create a branch and make commits on it independently.',
  },
  {
    id: 'merge',
    emoji: '🔀',
    name: 'Fast-Forward Merge',
    description: 'Merge a feature branch with no conflicts.',
  },
  {
    id: 'conflict',
    emoji: '⚡',
    name: 'Resolve a Conflict',
    description: 'Two branches modified the same file — resolve it.',
  },
];

export function GitScenarios({ activeScenario, onSelect, onReset }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <h2 className="text-sm font-bold text-slate-700 mb-2">🎯 Scenarios</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {SCENARIOS.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`text-left rounded-xl border-2 p-2.5 transition-colors active:scale-95 ${
              activeScenario === s.id
                ? 'border-amber-300 bg-amber-50'
                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="text-sm font-bold text-slate-800">{s.emoji} {s.name}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{s.description}</div>
          </button>
        ))}
      </div>
      <button onClick={onReset}
        className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline"
      >Reset to default state</button>
    </div>
  );
}
