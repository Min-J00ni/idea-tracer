"use client";

import { Handle, Position } from "reactflow";
import type { Topic } from "@/lib/types";

interface Props {
  data: {
    topic: Topic;
    isHighlighted: boolean;
  };
}

export default function TopicNode({ data }: Props) {
  const { topic, isHighlighted } = data;

  return (
    <div
      style={{
        background: isHighlighted ? "rgba(94,106,210,0.15)" : "#191a1b",
        border: `2px solid ${isHighlighted ? "rgba(113,112,255,0.5)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "10px",
        padding: "10px 16px",
        minWidth: "180px",
        transition: "all 0.2s",
        boxShadow: isHighlighted
          ? "0 0 0 1px rgba(113,112,255,0.2)"
          : "rgba(0,0,0,0.2) 0px 0px 0px 1px",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "rgba(255,255,255,0.2)", width: 6, height: 6 }}
      />

      <p
        style={{
          fontSize: "13px",
          fontWeight: 590,
          color: "#f7f8f8",
          letterSpacing: "-0.13px",
          margin: 0,
        }}
      >
        {topic.title}
      </p>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 510,
          color: "#62666d",
        }}
      >
        발언 {topic.utteranceIndices.length}개
      </span>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "rgba(255,255,255,0.2)", width: 6, height: 6 }}
      />
    </div>
  );
}
