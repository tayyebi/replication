import type { ActiveGossipPull } from '../../engine/types';

interface NodePos {
  id: string;
  cx: number;
  cy: number;
}

interface Props {
  pull: ActiveGossipPull;
  positions: NodePos[];
}

export function GossipArrow({ pull, positions }: Props) {
  const from = positions.find(p => p.id === pull.from);
  const to = positions.find(p => p.id === pull.to);
  if (!from || !to) return null;

  const dx = from.cx - to.cx;
  const dy = from.cy - to.cy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / len;
  const ny = dy / len;

  const offset = 60;
  const x1 = to.cx + nx * offset;
  const y1 = to.cy + ny * offset;
  const x2 = from.cx - nx * offset;
  const y2 = from.cy - ny * offset;

  const pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
  const markerId = `arrow-${pull.from}-${pull.to}`;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#16a34a" />
        </marker>
      </defs>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#16a34a"
        strokeWidth="2"
        strokeDasharray="5 3"
        markerEnd={`url(#${markerId})`}
        opacity="0.7"
      />
      <circle r="6" fill="#16a34a" opacity="0.85">
        <animateMotion dur="1.2s" repeatCount="indefinite" path={pathD} />
      </circle>
      <text x={midX} y={midY - 12} textAnchor="middle" fontSize="12" fill="#15803d" className="select-none font-medium">
        {pull.entriesCount} change{pull.entriesCount !== 1 ? 's' : ''}
      </text>
    </g>
  );
}
