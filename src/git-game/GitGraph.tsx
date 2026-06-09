import { useMemo } from 'react';
import type { Commit } from './GitEngine';

const BRANCH_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#0891b2', '#ca8a04'];

interface Props {
  commits: Commit[];
  branches: { name: string; commitHash: string }[];
  HEAD: string;
}

interface LayoutCommit extends Commit {
  x: number;
  y: number;
  lane: number;
  color: string;
  isHEAD: boolean;
}

interface BranchLabel {
  name: string;
  x: number;
  y: number;
  color: string;
  isHEAD: boolean;
}

export function GitGraph({ commits, branches, HEAD }: Props) {
  const { layout, edges, branchLabels, svgW, svgH } = useMemo(() => {
    if (commits.length === 0) return { layout: [] as LayoutCommit[], edges: [], branchLabels: [] as BranchLabel[], svgW: 300, svgH: 100 };

    const sorted = [...commits].sort((a, b) => a.timestamp - b.timestamp);

    const branchToLane: Record<string, number> = {};
    const branchColors: Record<string, string> = {};
    let nextLane = 0;

    for (const c of sorted) {
      if (!(c.branch in branchToLane)) {
        branchToLane[c.branch] = nextLane;
        branchColors[c.branch] = BRANCH_COLORS[nextLane % BRANCH_COLORS.length];
        nextLane++;
      }
    }

    const laneCount = Object.keys(branchToLane).length;
    const laneHeight = 60;
    const nodeSpacing = 90;
    const nodeRadius = 14;

    const branchHead: Record<string, string> = {};
    for (const b of branches) {
      branchHead[b.name] = b.commitHash;
    }

    const graphLayout: LayoutCommit[] = sorted.map((c, i) => ({
      ...c,
      x: 60 + i * nodeSpacing,
      y: 30 + branchToLane[c.branch] * laneHeight,
      lane: branchToLane[c.branch],
      color: branchColors[c.branch],
      isHEAD: HEAD === c.branch && branchHead[c.branch] === c.hash,
    }));

    const graphEdges: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

    for (const c of sorted) {
      const node = graphLayout.find(n => n.hash === c.hash)!;

      for (let pi = 0; pi < c.parentHashes.length; pi++) {
        const parentHash = c.parentHashes[pi];
        const parent = graphLayout.find(n => n.hash === parentHash);
        if (!parent) continue;

        const midY = (node.y + parent.y) / 2;

        if (parent.lane !== node.lane && pi > 0) {
          graphEdges.push({ x1: parent.x, y1: parent.y, x2: parent.x, y2: midY, color: parent.color });
          graphEdges.push({ x1: parent.x, y1: midY, x2: node.x, y2: midY, color: '#94a3b8' });
          graphEdges.push({ x1: node.x, y1: midY, x2: node.x, y2: node.y, color: node.color });
        } else {
          graphEdges.push({
            x1: parent.x, y1: parent.y,
            x2: node.x, y2: node.y,
            color: parent.lane === node.lane ? parent.color : '#94a3b8',
          });
        }
      }
    }

    const labels: BranchLabel[] = branches.map(b => {
      const commit = graphLayout.find(c => c.hash === b.commitHash);
      if (!commit) return null;
      return {
        name: b.name,
        x: commit.x,
        y: commit.y - nodeRadius - 10,
        color: branchColors[b.name] || '#64748b',
        isHEAD: HEAD === b.name,
      };
    }).filter((b): b is BranchLabel => b !== null);

    const maxY = 30 + (laneCount - 1) * laneHeight + 10;
    const maxX = 60 + (sorted.length - 1) * nodeSpacing + nodeRadius + 10;

    return {
      layout: graphLayout,
      edges: graphEdges,
      branchLabels: labels,
      svgW: Math.max(300, maxX),
      svgH: Math.max(100, maxY + 40),
    };
  }, [commits, branches, HEAD]);

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
      <svg width={svgW} height={svgH + 20} className="min-w-full" style={{ minHeight: 120 }}>
        {edges.map((e, i) => (
          <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke={e.color} strokeWidth={2.5} strokeLinecap="round" opacity={0.6}
          />
        ))}

        {layout.filter(l => l.isHEAD).map(l => (
          <text key={`head-${l.hash}`} x={l.x} y={l.y - 28}
            textAnchor="middle" fill={l.color} fontSize={11} fontWeight="bold"
          >
            HEAD → {l.branch}
          </text>
        ))}

        {layout.map(l => {
          const isMerge = l.parentHashes.length > 1;
          return (
            <g key={l.hash}>
              <circle cx={l.x} cy={l.y} r={14}
                fill={l.isHEAD ? '#1e293b' : '#fff'}
                stroke={l.color}
                strokeWidth={l.isHEAD ? 3 : 2.5}
              />
              {!l.isHEAD && <circle cx={l.x} cy={l.y} r={6} fill={l.color} opacity={0.7} />}
              {l.isHEAD && <circle cx={l.x} cy={l.y} r={8} fill={l.color} />}
              {isMerge && (
                <line x1={l.x - 6} y1={l.y - 6} x2={l.x + 6} y2={l.y + 6}
                  stroke={l.color} strokeWidth={2} opacity={0.5}
                />
              )}
              <title>{`${l.hash} - ${l.message} (${l.branch})`}</title>
            </g>
          );
        })}

        {branchLabels.map((bl, i) => (
          <text key={`branch-${i}`} x={bl.x} y={bl.y - 2}
            textAnchor="middle" fill={bl.color} fontSize={12} fontWeight="bold" className="select-none"
          >
            {bl.name}{bl.isHEAD ? ' ⬅' : ''}
          </text>
        ))}

        {layout.map(l => (
          <text key={`hash-${l.hash}`} x={l.x} y={l.y + 28}
            textAnchor="middle" fill="#94a3b8" fontSize={9} fontFamily="monospace"
          >
            {l.hash}
          </text>
        ))}
      </svg>
    </div>
  );
}
