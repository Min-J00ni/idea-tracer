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
      className={`
        bg-gray-100 rounded-xl border-2 px-5 py-3 min-w-[180px]
        transition-all duration-200
        ${isHighlighted ? "ring-2 ring-blue-400 border-blue-300" : "border-gray-300"}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-400 !w-2 !h-2" />

      <p className="text-sm font-bold text-gray-800">{topic.title}</p>
      <span className="text-[10px] text-gray-500">
        발언 {topic.utteranceIndices.length}개
      </span>

      <Handle type="source" position={Position.Right} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}
