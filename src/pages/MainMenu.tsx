import { useNavigate } from 'react-router-dom';

export default function MainMenu() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header dots */}
      <header className="border-b border-slate-200 bg-white px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="flex gap-1">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
          <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* Decorative icon */}
          <div className="text-5xl mb-6">💻</div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Computer Engineering
            <br />
            <span className="text-indigo-600">Interactive Lab</span>
          </h1>

          <p className="text-sm md:text-base text-slate-500 mt-4 max-w-lg mx-auto leading-relaxed">
            Learn core computer engineering concepts by exploring interactive simulations.
            Pick a topic below and start experimenting.
          </p>

          {/* Game cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 max-w-xl mx-auto">
            {/* Replication Explorer */}
            <button
              onClick={() => navigate('/replication')}
              className="group bg-white rounded-2xl border-2 border-slate-200 p-6 text-left shadow-sm hover:shadow-md hover:border-indigo-300 transition-all active:scale-[0.98]"
            >
              <div className="text-3xl mb-3">🌐</div>
              <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                Replication Explorer
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-snug">
                How do distributed databases stay in sync? Simulate 3 servers, gossip protocols, conflict resolution, and more.
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">HLC</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Gossip</span>
                <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold">CRDT</span>
              </div>
            </button>

            {/* Git Visualizer */}
            <button
              onClick={() => navigate('/git-game')}
              className="group bg-white rounded-2xl border-2 border-slate-200 p-6 text-left shadow-sm hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.98]"
            >
              <div className="text-3xl mb-3">🌿</div>
              <h2 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                Git Visualizer
              </h2>
              <p className="text-xs text-slate-500 mt-2 leading-snug">
                See git come alive. Edit files, stage changes, branch, merge, and resolve conflicts — all visualized.
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-semibold">Commit</span>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">Branch</span>
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Merge</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-400">
        Built for first-year computer engineering students
      </footer>
    </div>
  );
}
