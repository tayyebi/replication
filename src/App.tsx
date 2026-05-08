import { useState } from 'react';
import { ClusterView } from './components/ClusterView/ClusterView';
import { EventNarrative } from './components/EventNarrative';
import { WritePanel } from './components/WritePanel/WritePanel';
import { ConflictDemo } from './components/ConflictDemo/ConflictDemo';
import { AntiEntropyDemo } from './components/AntiEntropyDemo/AntiEntropyDemo';
import { UnderTheHood } from './components/UnderTheHood/UnderTheHood';
import { TimeControls } from './components/TimeControls';
import { ScenarioPanel } from './components/ScenarioPanel';

export default function App() {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <div className="flex gap-1">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"/>
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"/>
          <span className="w-3 h-3 rounded-full bg-violet-500 inline-block"/>
        </div>
        <h1 className="text-base font-bold text-slate-800 tracking-tight leading-tight">How do databases stay in sync?</h1>
      </header>

      {/* Intro */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex-shrink-0">
        <p className="text-sm font-semibold text-blue-900">🌍 One database, 3 servers, different cities.</p>
        <p className="text-xs text-blue-700 mt-0.5">
          Save on any server — it copies to the others automatically. Explore what happens when things go wrong.
        </p>
      </div>

      <TimeControls />

      {/* Main scroll */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="p-3 space-y-3 pb-4">
            <ClusterView />
            <WritePanel />
            <ScenarioPanel />
            <ConflictDemo />
            <AntiEntropyDemo />
            <UnderTheHood />

            {/* Event log — collapsible on mobile, always visible on desktop */}
            <div className="md:hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setLogOpen(p => !p)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div>
                  <span className="text-base font-bold text-slate-800">📋 What just happened</span>
                  <span className="text-xs text-slate-400 ml-2">Live activity log</span>
                </div>
                <span className="text-slate-400">{logOpen ? '▲' : '▼'}</span>
              </button>
              {logOpen && (
                <div className="border-t border-slate-100 h-64">
                  <EventNarrative />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:flex w-80 flex-shrink-0 border-l border-slate-200 flex-col">
          <EventNarrative />
        </div>
      </div>
    </div>
  );
}
