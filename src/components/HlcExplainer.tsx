import { useState } from 'react';
import { HybridLogicalClock, serializeHlc } from '../engine/hlc';

interface Props {
  onClose: () => void;
}

export function HlcExplainer({ onClose }: Props) {
  const [simMs, setSimMs] = useState(Date.now());
  const [clock] = useState(() => new HybridLogicalClock('replica-demo', Date.now()));
  const [history, setHistory] = useState<string[]>([clock.current()]);

  const tick = () => {
    setSimMs(p => p + 1000);
    const ts = clock.tick(simMs + 1000);
    setHistory(prev => [...prev.slice(-6), serializeHlc(ts)]);
  };

  const tickSameMs = () => {
    const ts = clock.tick(simMs);
    setHistory(prev => [...prev.slice(-6), serializeHlc(ts)]);
  };

  const exampleHlc = '1746700800000-000003-replica-a';
  const parts = exampleHlc.split('-');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-800">⏱ How do servers know what's newest?</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        <div className="mb-5 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-base text-slate-700 mb-2">
            When Server A and Server B both save a file at "the same time", which version wins?
          </p>
          <p className="text-sm text-slate-600">
            We can't just use the clock on each machine — they might be slightly out of sync.
            Instead, each server keeps a <strong>smart timestamp</strong> that combines the real clock with a counter.
            This guarantees every save can be sorted in exact order, across any number of servers.
          </p>
        </div>

        <div className="mb-5">
          <h3 className="text-base font-bold text-slate-700 mb-3">What the timestamp looks like</h3>
          <div className="font-mono bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex flex-wrap gap-0 text-lg">
              <span className="text-blue-600">{parts[0]}</span>
              <span className="text-slate-400">-</span>
              <span className="text-purple-600">{parts[1]}</span>
              <span className="text-slate-400">-</span>
              <span className="text-slate-500">{parts.slice(2).join('-')}</span>
            </div>
            <div className="flex flex-wrap gap-0 text-sm mt-2 text-slate-400">
              <span className="text-blue-500 w-[12ch]">wall clock</span>
              <span className="w-1"/>
              <span className="text-purple-500 w-[7ch]">counter</span>
              <span className="w-1"/>
              <span>server name</span>
            </div>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><span className="text-blue-600 font-semibold">Wall clock</span> — the real time in milliseconds.</li>
            <li><span className="text-purple-600 font-semibold">Counter</span> — bumps up by 1 if two saves happen in the same millisecond, so there's never a tie.</li>
            <li><span className="text-slate-700 font-semibold">Server name</span> — a last-resort tiebreaker if everything else is identical.</li>
          </ul>
        </div>

        <div className="mb-5">
          <h3 className="text-base font-bold text-slate-700 mb-3">Try it — watch the timestamp change</h3>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex gap-2 mb-3 flex-wrap">
              <button onClick={tick}
                className="px-4 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors">
                Save (clock advances)
              </button>
              <button onClick={tickSameMs}
                className="px-4 py-2 text-sm rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors">
                Save again instantly (counter bumps)
              </button>
            </div>
            <div className="space-y-1.5">
              {history.map((h, i) => {
                const d = h.split('-');
                const ms = parseInt(d[0]);
                const isLatest = i === history.length - 1;
                return (
                  <div key={i} className={`text-sm flex gap-3 items-center ${isLatest ? '' : 'opacity-40'}`}>
                    <span className="text-slate-400 w-4">{isLatest ? '→' : ' '}</span>
                    <span className={`font-medium ${isLatest ? 'text-blue-600' : 'text-slate-400'}`}>
                      {new Date(ms).toLocaleTimeString()}
                    </span>
                    <span className="text-slate-400">counter:</span>
                    <span className={`font-mono font-semibold ${isLatest ? 'text-purple-600' : 'text-slate-400'}`}>
                      {parseInt(d[1])}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h3 className="text-base font-bold text-slate-700 mb-3">How conflicts are resolved</h3>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex gap-2 items-start">
              <span className="text-green-600 font-bold text-base">✓</span>
              <span><strong>Newer timestamp wins</strong> — the most recently saved version replaces older ones.</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-amber-500 font-bold text-base">~</span>
              <span><strong>Exact same time?</strong> The counter breaks the tie. Still the same? Server name (A vs B) decides.</span>
            </div>
            <div className="flex gap-2 items-start">
              <span className="text-slate-400 font-bold text-base">✗</span>
              <span><strong>Already have newer?</strong> The older incoming change is quietly ignored.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
