import { useEffect, useRef } from 'react';
import { useSimulationStore } from '../store/simulationStore';
import type { EventKind, SimEvent } from '../engine/types';

const KIND_CONFIG: Record<EventKind, { icon: string; color: string }> = {
  write:                  { icon: '✏️',  color: 'text-blue-500' },
  gossip_pull_start:      { icon: '→',   color: 'text-slate-400' },
  gossip_pull_complete:   { icon: '✓',   color: 'text-green-500' },
  gossip_blocked:         { icon: '✗',   color: 'text-red-400' },
  lww_apply:              { icon: '✓',   color: 'text-green-500' },
  lww_skip:               { icon: '↷',   color: 'text-slate-400' },
  lww_tiebreak:           { icon: '⚖',   color: 'text-amber-500' },
  anti_entropy_start:     { icon: '🔍',  color: 'text-amber-500' },
  anti_entropy_mismatch:  { icon: '≠',   color: 'text-orange-500' },
  anti_entropy_reconcile: { icon: '✓',   color: 'text-green-500' },
  anti_entropy_ok:        { icon: '=',   color: 'text-green-600' },
  partition_set:          { icon: '⚡',   color: 'text-red-500' },
  partition_heal:         { icon: '💚',  color: 'text-green-500' },
  suspicion_increment:    { icon: '⚠',   color: 'text-amber-500' },
  quorum_ack:             { icon: '✅',   color: 'text-green-500' },
  quorum_fail:            { icon: '🚫',  color: 'text-red-500' },
};

function EventRow({ event }: { event: SimEvent }) {
  const cfg = KIND_CONFIG[event.kind] ?? { icon: '·', color: 'text-slate-400' };
  return (
    <li className="flex gap-2 py-2 border-b border-slate-100 text-sm leading-snug">
      <span className={`flex-shrink-0 w-5 text-center ${cfg.color}`}>{cfg.icon}</span>
      <span className="text-slate-600">{event.message}</span>
    </li>
  );
}

export function EventNarrative() {
  const { snapshot } = useSimulationStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (snapshot.events.length > prevLen.current) {
      prevLen.current = snapshot.events.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [snapshot.events.length]);

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 py-3 border-b border-slate-200 flex-shrink-0">
        <h2 className="text-base font-bold text-slate-800">What just happened</h2>
        <p className="text-sm text-slate-400 mt-0.5">Live log of all server activity</p>
      </div>
      <ul className="flex-1 overflow-y-auto px-4 py-1">
        {snapshot.events.length === 0 && (
          <li className="text-sm text-slate-400 py-6 text-center">
            Nothing yet — try saving something or running a scenario!
          </li>
        )}
        {snapshot.events.map(e => (
          <EventRow key={e.id} event={e} />
        ))}
        <div ref={bottomRef} />
      </ul>
    </div>
  );
}
