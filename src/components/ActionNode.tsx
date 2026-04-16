"use client";

import { Handle, Position } from "reactflow";
import type { ActionItem } from "@/lib/types";

interface Props {
  data: {
    action: ActionItem;
  };
}

export default function ActionNode({ data }: Props) {
  const { action } = data;

  return (
    <div className="bg-blue-50 rounded-xl border-2 border-blue-400 px-4 py-2.5 min-w-[200px] max-w-[260px]">
      <Handle type="target" position={Position.Left} className="!bg-blue-400 !w-2 !h-2" />

      <p className="text-sm text-gray-800 font-medium leading-snug">
        ☐ {action.text}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {action.assignee && (
          <span className="text-[10px] text-blue-600">👤 {action.assignee}</span>
        )}
        {action.deadline && (
          <span className="text-[10px] text-blue-600">📅 {action.deadline}</span>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
}
