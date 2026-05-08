import { useSimulationStore } from '../store/simulationStore';

export function ScenarioPanel() {
  const { scenarios, activeScenario, runScenario } = useSimulationStore();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-5 shadow-sm">
      <h2 className="text-base md:text-lg font-bold text-slate-800 mb-1">Watch a Story Play Out</h2>
      <p className="text-xs md:text-sm text-slate-500 mb-3">
        Hit <strong className="text-slate-700">▶ Run</strong> to watch a scenario happen step by step.
      </p>

      <div className="space-y-2">
        {scenarios.map(s => (
          <div key={s.id} className={`rounded-xl border-2 p-3 transition-colors ${
            activeScenario === s.id ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800 leading-snug">{s.emoji} {s.name}</div>
                <div className="text-xs text-slate-500 mt-0.5 leading-snug">{s.description}</div>
              </div>
              <button
                onClick={() => runScenario(s.id)}
                disabled={activeScenario !== null}
                className={`flex-shrink-0 h-10 px-4 rounded-xl text-sm font-bold transition-colors active:scale-95 ${
                  activeScenario === s.id
                    ? 'bg-amber-500 text-white'
                    : activeScenario !== null
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white'
                }`}
              >
                {activeScenario === s.id ? '⏳' : '▶ Run'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
