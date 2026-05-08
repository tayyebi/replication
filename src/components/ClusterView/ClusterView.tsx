import { useRef, useLayoutEffect, useState } from 'react';
import { useSimulationStore } from '../../store/simulationStore';
import { ReplicaCard } from './ReplicaCard';
import { GossipArrow } from './GossipArrow';

interface NodePos { id: string; cx: number; cy: number; }

export function ClusterView() {
  const { snapshot, selectedNodeId } = useSimulationStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [positions, setPositions] = useState<NodePos[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const cr = container.getBoundingClientRect();
      setPositions(Object.entries(cardRefs.current).flatMap(([id, el]) => {
        if (!el) return [];
        const r = el.getBoundingClientRect();
        return [{ id, cx: r.left - cr.left + r.width / 2, cy: r.top - cr.top + r.height / 2 }];
      }));
      setSvgSize({ w: cr.width, h: cr.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, [snapshot.nodes.length]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-5 shadow-sm">
      <h2 className="text-base md:text-lg font-bold text-slate-800 mb-1">The 3 Servers</h2>
      <p className="text-xs md:text-sm text-slate-500 mb-3">
        Each box is a server. Click one to select it, then save data below. Green arrows appear when servers sync.
      </p>

      {/* Horizontal scroll on mobile, 3-col grid on desktop */}
      <div ref={containerRef} className="relative">
        <div className="flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0 snap-x snap-mandatory md:snap-none">
          {snapshot.nodes.map(node => (
            <div
              key={node.id}
              ref={el => { cardRefs.current[node.id] = el; }}
              className="flex-shrink-0 w-48 md:w-auto snap-start"
            >
              <ReplicaCard node={node} selected={selectedNodeId === node.id} />
            </div>
          ))}
        </div>

        {svgSize.w > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none hidden md:block"
            width={svgSize.w} height={svgSize.h}
            style={{ overflow: 'visible' }}
          >
            {snapshot.activeGossipPulls.map(pull => (
              <GossipArrow key={`${pull.from}->${pull.to}`} pull={pull} positions={positions} />
            ))}
          </svg>
        )}
      </div>

      {snapshot.nodes.some(n => n.partitioned) && (
        <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs md:text-sm text-red-700">
          ⚡ A server is disconnected (shown in red). Hit <strong>💚 Reconnect</strong> on it to bring it back.
        </div>
      )}
    </div>
  );
}
