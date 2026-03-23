import React from "react";
import type { Trade, Playbook } from "@/types";

function fmtNum(n: number | null | undefined, digits = 5) {
  if (n === null || n === undefined) return "";
  return n.toFixed(digits);
}
function pnl(tr: Trade) {
  if (tr.entryPrice == null || tr.exitPrice == null || tr.positionSize == null)
    return null;
  if (tr.direction === "LONG") {
    return +((tr.exitPrice - tr.entryPrice) * tr.positionSize).toFixed(2);
  }
  return +((tr.entryPrice - tr.exitPrice) * tr.positionSize).toFixed(2);
}

export default function TradesTable({
  rows,
  playbooks,
  onSelect,
}: {
  rows: Trade[];
  playbooks: Playbook[];
  onSelect?: (t: Trade) => void;
}) {
  return (
    <div
      style={{
        overflow: "hidden",
        border: "1px solid #1f2a44",
        borderRadius: 14,
        background: "linear-gradient(180deg,#0b1220,#0a1020)",
      }}
    >
      <table
        style={{ width: "100%", borderCollapse: "collapse", color: "#cbd5e1" }}
      >
        <thead>
          <tr style={{ color: "#94a3b8" }}>
            <th style={th}>Date</th>
            <th style={th}>Instrument</th>
            <th style={th}>Strategy</th>
            <th style={th}>Entry</th>
            <th style={th}>Exit</th>
            <th style={th}>Volume</th>
            <th style={th}>PnL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const p = pnl(r);
            const playbook = playbooks.find((p) => p.id === r.playbookId);
            return (
              <tr
                key={r.id}
                onClick={() => onSelect?.(r)}
                style={{
                  cursor: "pointer",
                  background:
                    "linear-gradient(180deg,rgba(9,14,26,.3),rgba(8,14,24,.2))",
                }}
              >
                <td style={td}>
                  {new Date(r.openedAt).toLocaleString()}
                </td>
                <td style={{ ...td, color: "#9fb3ff" }}>
                  <span
                    style={{
                      padding: "2px 10px",
                      border: "1px solid #25355b",
                      borderRadius: 999,
                    }}
                  >
                    {r.ticker}
                  </span>
                </td>
                <td style={{ ...td, color: "#a78bfa", fontSize: 13 }}>
                  {playbook ? (
                    <span
                      style={{
                        padding: "2px 8px",
                        background: "rgba(167, 139, 250, 0.1)",
                        border: "1px solid rgba(167, 139, 250, 0.3)",
                        borderRadius: 6,
                      }}
                    >
                      📋 {playbook.title}
                    </span>
                  ) : (
                    <span style={{ color: "#64748b" }}>—</span>
                  )}
                </td>
                <td style={td}>{fmtNum(r.entryPrice)}</td>
                <td style={td}>{fmtNum(r.exitPrice)}</td>
                <td style={td}>{fmtNum(r.positionSize, 2)}</td>
                <td style={{ ...td, color: p != null && p >= 0 ? "#22c55e" : "#ef4444" }}>
                  {p != null ? (p >= 0 ? `+${p.toFixed(2)}` : p.toFixed(2)) : "—"}
                </td>
              </tr>
            );
          })}
          {!rows.length && (
            <tr>
              <td style={{ ...td, padding: 24, color: "#64748b" }} colSpan={7}>
                No trades yet — add your first one!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
const th: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  borderBottom: "1px solid #1f2a44",
  fontWeight: 600,
  fontSize: 13,
};
const td: React.CSSProperties = {
  padding: "12px 14px",
  borderTop: "1px solid #0c1428",
  fontSize: 13,
};
