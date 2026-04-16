"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeRemoveChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { toPng } from "html-to-image";
import MindMapNode from "./MindMapNode";
import TopicNode from "./TopicNode";
import ActionNode from "./ActionNode";
import EmotionFilter from "./EmotionFilter";
import { getLayoutedElements } from "@/lib/layout";
import { EDGE_COLORS } from "@/lib/constants";
import type { AnalysisResult, AnalyzedUtterance, Emotion } from "@/lib/types";

const nodeTypes = {
  utterance: MindMapNode,
  topic: TopicNode,
  action: ActionNode,
};

const RELATION_EDGE_STYLE: Record<string, { stroke: string; strokeDasharray?: string }> = {
  supports: { stroke: "#10B981" },
  opposes: { stroke: "#EF4444", strokeDasharray: "5,5" },
  extends: { stroke: "#D1D5DB" },
  resolves: { stroke: "#10B981" },
};

interface Props {
  result: AnalysisResult;
  selectedUtterance: AnalyzedUtterance | null;
  currentTimeMs: number;
  onSelectUtterance: (u: AnalyzedUtterance) => void;
  onUpdateUtterance: (index: number, text: string) => void;
}

export default function MindMap({
  result,
  selectedUtterance,
  currentTimeMs,
  onSelectUtterance,
  onUpdateUtterance,
}: Props) {
  const [activeFilters, setActiveFilters] = useState<Set<Emotion>>(
    new Set(["positive", "negative", "neutral", "conflict"])
  );
  const [deletedIndices, setDeletedIndices] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback((emotion: Emotion) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(emotion)) next.delete(emotion);
      else next.add(emotion);
      return next;
    });
  }, []);

  const activeNodeIndex = useMemo(() => {
    if (currentTimeMs <= 0) return -1;
    return result.utterances.findIndex(
      (u) => currentTimeMs >= u.startMs && currentTimeMs <= u.endMs
    );
  }, [result.utterances, currentTimeMs]);

  // 단일 useMemo로 노드+엣지 계산
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const filteredUtterances = result.utterances.filter(
      (u) => activeFilters.has(u.emotion) && !deletedIndices.has(u.index)
    );
    const filteredSet = new Set(filteredUtterances.map((u) => u.index));

    const activeTopicIds = new Set(filteredUtterances.map((u) => u.topicId));

    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];

    // Topic 노드
    for (const topic of result.topics) {
      if (!activeTopicIds.has(topic.id)) continue;
      rawNodes.push({
        id: topic.id,
        type: "topic",
        position: { x: 0, y: 0 },
        data: {
          topic,
          isHighlighted: selectedUtterance?.topicId === topic.id,
        },
      });
    }

    // Utterance 노드
    for (const u of filteredUtterances) {
      rawNodes.push({
        id: `node-${u.index}`,
        type: "utterance",
        position: { x: 0, y: 0 },
        data: {
          utterance: u,
          isHighlighted:
            u.index === selectedUtterance?.index || u.index === activeNodeIndex,
          onClick: onSelectUtterance,
          onUpdateText: onUpdateUtterance,
        },
      });

      // Topic → Utterance 엣지
      if (activeTopicIds.has(u.topicId)) {
        rawEdges.push({
          id: `te-${u.topicId}-${u.index}`,
          source: u.topicId,
          target: `node-${u.index}`,
          type: "smoothstep",
          style: { stroke: "#D1D5DB", strokeWidth: 1.5 },
        });
      }

      // Utterance → Utterance 관계 엣지
      for (const rel of u.relatedTo) {
        if (!filteredSet.has(rel.targetIndex)) continue;
        const edgeStyle = RELATION_EDGE_STYLE[rel.type] || RELATION_EDGE_STYLE.extends;
        rawEdges.push({
          id: `re-${u.index}-${rel.targetIndex}`,
          source: `node-${u.index}`,
          target: `node-${rel.targetIndex}`,
          type: "smoothstep",
          style: { ...edgeStyle, strokeWidth: 1.5 },
          animated: u.index === activeNodeIndex,
        });
      }
    }

    // Action 노드
    for (const action of result.actionItems) {
      if (!filteredSet.has(action.sourceIndex)) continue;
      const actionId = `action-${action.sourceIndex}`;
      rawNodes.push({
        id: actionId,
        type: "action",
        position: { x: 0, y: 0 },
        data: { action },
      });
      rawEdges.push({
        id: `ae-${action.sourceIndex}`,
        source: `node-${action.sourceIndex}`,
        target: actionId,
        type: "smoothstep",
        style: { stroke: "#3B82F6", strokeWidth: 1.5 },
      });
    }

    return getLayoutedElements(rawNodes, rawEdges);
  }, [result, activeFilters, deletedIndices, selectedUtterance, activeNodeIndex, onSelectUtterance, onUpdateUtterance]);

  const [, , onNodesChange] = useNodesState(layoutedNodes);
  const [, , onEdgesChange] = useEdgesState(layoutedEdges);

  const handleNodesDelete = useCallback((deleted: Node[]) => {
    setDeletedIndices((prev) => {
      const next = new Set(prev);
      for (const node of deleted) {
        if (node.id.startsWith("node-")) {
          next.add(parseInt(node.id.slice(5)));
        }
      }
      return next;
    });
  }, []);

  const handleExportPNG = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      const dataUrl = await toPng(containerRef.current, {
        backgroundColor: "#F9FAFB",
        pixelRatio: 2,
      });
      const a = document.createElement("a");
      a.download = "mindmap.png";
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error("PNG 내보내기 실패:", e);
    }
  }, []);

  // EDGE_COLORS는 향후 엣지 테마 확장 시 사용
  void EDGE_COLORS;

  return (
    <div className="relative flex-1 flex flex-col" style={{ backgroundColor: "#0f1011" }}>
      {/* 툴바 */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <button
          onClick={handleExportPNG}
          style={{
            fontSize: "12px",
            fontWeight: 510,
            padding: "5px 10px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#8a8f98",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          PNG 저장
        </button>
      </div>

      <EmotionFilter activeFilters={activeFilters} onToggle={handleToggle} />

      <div ref={containerRef} className="flex-1">
        <ReactFlow
          nodes={layoutedNodes}
          edges={layoutedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodesDelete={handleNodesDelete}
          nodeTypes={nodeTypes}
          deleteKeyCode="Delete"
          fitView
          fitViewOptions={{ padding: 0.3 }}
        >
          <Background color="rgba(255,255,255,0.04)" gap={24} size={1} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
