import React from "react";

export default function StatCard({
  label,
  value,
  sub,
  right,
}: {
  label: string;
  value: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg,#0b1220,#0a1020)",
        border: "1px solid #1f2a44",
        borderRadius: 14,
        padding: 14,
        color: "#e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </div>
        {sub && (
          <div style={{ color: "#7aa2ff", fontSize: 12, marginTop: 6 }}>
            {sub}
          </div>
        )}
      </div>

      {right && <div>{right}</div>}
    </div>
  );
}
