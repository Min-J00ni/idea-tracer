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
    <div
      style={{
        background: "rgba(94,106,210,0.12)",
        border: "1px solid rgba(113,112,255,0.3)",
        borderRadius: "10px",
        padding: "10px 14px",
        minWidth: "200px",
        maxWidth: "260px",
        boxShadow: "rgba(0,0,0,0.2) 0px 0px 0px 1px",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#7170ff", width: 6, height: 6 }}
      />

      <p
        style={{
          fontSize: "13px",
          fontWeight: 510,
          color: "#d0d6e0",
          lineHeight: 1.5,
          margin: "0 0 4px",
        }}
      >
        ☐ {action.text}
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        {action.assignee && (
          <span style={{ fontSize: "11px", color: "#7170ff" }}>
            👤 {action.assignee}
          </span>
        )}
        {action.deadline && (
          <span style={{ fontSize: "11px", color: "#7170ff" }}>
            📅 {action.deadline}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#7170ff", width: 6, height: 6 }}
      />
    </div>
  );
}
