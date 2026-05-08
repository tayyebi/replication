import { useSimulationStore } from '../store/simulationStore';

const SPEEDS = [
  { label: '1×',  value: 1  },
  { label: '5×',  value: 5  },
  { label: '60×', value: 60 },
];

function fmtSimTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600) % 24;
  const m = Math.floor(totalSec / 60) % 60;
  const s = totalSec % 60;
  const day = Math.floor(totalSec / 86400) + 1;
  return `Day ${day} ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

export function TimeControls() {
  const { speedMultiplier, paused, snapshot, setSpeed, setPaused } = useSimulationStore();

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2 text-sm flex-shrink-0 flex-wrap shadow-sm">
      <button
        onClick={() => setPaused(!paused)}
        className={`h-9 px-4 rounded-full font-semibold text-sm transition-colors flex-shrink-0 ${
          paused
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
        }`}
      >
        {paused ? '▶ Resume' : '⏸ Pause'}
      </button>

      <div className="flex items-center gap-1">
        {SPEEDS.map(s => (
          <button
            key={s.value}
            onClick={() => setSpeed(s.value)}
            className={`h-9 px-3 rounded-full text-sm font-medium transition-colors ${
              speedMultiplier === s.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <span className="text-xs text-slate-400 font-mono ml-auto">
        {fmtSimTime(snapshot.simulatedMs)}
      </span>

      {paused && <span className="text-amber-600 text-xs font-bold">⏸ PAUSED</span>}
    </div>
  );
}
