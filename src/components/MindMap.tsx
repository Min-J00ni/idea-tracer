"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import MindMapNode from "./MindMapNode";
import EmotionFilter from "./EmotionFilter";
import { getLayoutedElements } from "@/lib/layout";
import type { AnalyzedUtterance, Emotion } from "@/lib/types";

const nodeTypes = { mindmap: MindMapNode };

const edgeColors: Record<string, string> = {
  positive: "#10B981",
  negative: "#EF4444",
  neutral: "#D1D5DB",
  conflict: "#F59E0B",
};

interface Props {
  utterances: AnalyzedUtterance[];
  selectedUtterance: AnalyzedUtterance | null;
  currentTimeMs: number;
  onSelectUtterance: (u: AnalyzedUtterance) => void;
}

export default function MindMap({
  utterances,
  selectedUtterance,
  currentTimeMs,
  onSelectUtterance,
}: Props) {
  const [activeFilters, setActiveFilters] = useState<Set<Emotion>>(
    new Set(["positive", "negative", "neutral", "conflict"])
  );

  const handleToggle = useCallback((emotion: Emotion) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(emotion)) {
        next.delete(emotion);
      } else {
        next.add(emotion);
      }
      return next;
    });
  }, []);

  // 현재 재생 시간에 해당하는 노드 찾기
  const activeNodeIndex = useMemo(() => {
    if (currentTimeMs <= 0) return -1;
    return utterances.findIndex(
      (u) => currentTimeMs >= u.startMs && currentTimeMs <= u.endMs
    );
  }, [utterances, currentTimeMs]);

  const filteredUtterances = useMemo(
    () => utterances.filter((u) => activeFilters.has(u.emotion)),
    [utterances, activeFilters]
  );

  const { initialNodes, initialEdges } = useMemo(() => {
    const filteredSet = new Set(filteredUtterances.map((u) => u.index));

    const rawNodes: Node[] = filteredUtterances.map((u) => ({
      id: `node-${u.index}`,
      type: "mindmap",
      position: { x: 0, y: 0 },
      data: {
        utterance: u,
        isHighlighted:
          u.index === selectedUtterance?.index || u.index === activeNodeIndex,
        onClick: onSelectUtterance,
      },
    }));

    const rawEdges: Edge[] = [];
    filteredUtterances.forEach((u) => {
      u.relatedTo.forEach((targetIdx) => {
        if (filteredSet.has(targetIdx)) {
          rawEdges.push({
            id: `e${u.index}-${targetIdx}`,
            source: `node-${u.index}`,
            target: `node-${targetIdx}`,
            type: "smoothstep",
            style: {
              stroke: edgeColors[u.emotion] || "#D1D5DB",
              strokeWidth: 2,
            },
            animated: u.index === activeNodeIndex,
          });
        }
      });
    });

    return getLayoutedElements(rawNodes, rawEdges) as {
      nodes: Node[];
      edges: Edge[];
    } & { initialNodes: Node[]; initialEdges: Edge[] };
  }, [filteredUtterances, selectedUtterance, activeNodeIndex, onSelectUtterance]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const filteredSet = new Set(filteredUtterances.map((u) => u.index));

    const rawNodes: Node[] = filteredUtterances.map((u) => ({
      id: `node-${u.index}`,
      type: "mindmap",
      position: { x: 0, y: 0 },
      data: {
        utterance: u,
        isHighlighted:
          u.index === selectedUtterance?.index || u.index === activeNodeIndex,
        onClick: onSelectUtterance,
      },
    }));

    const rawEdges: Edge[] = [];
    filteredUtterances.forEach((u) => {
      u.relatedTo.forEach((targetIdx) => {
        if (filteredSet.has(targetIdx)) {
          rawEdges.push({
            id: `e${u.index}-${targetIdx}`,
            source: `node-${u.index}`,
            target: `node-${targetIdx}`,
            type: "smoothstep",
            style: {
              stroke: edgeColors[u.emotion] || "#D1D5DB",
              strokeWidth: 2,
            },
            animated: u.index === activeNodeIndex,
          });
        }
      });
    });

    return getLayoutedElements(rawNodes, rawEdges);
  }, [filteredUtterances, selectedUtterance, activeNodeIndex, onSelectUtterance]);

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  return (
    <div className="relative flex-1" style={{ backgroundColor: "#F9FAFB" }}>
      <EmotionFilter activeFilters={activeFilters} onToggle={handleToggle} />
      <ReactFlow
        nodes={layoutedNodes}
        edges={layoutedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
      >
        <Background color="#E5E7EB" gap={20} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
