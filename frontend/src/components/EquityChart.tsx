import React from "react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Props = { data: number[] };

type Point = { i: number; v: number };
function toSeries(arr: number[]): Point[] {
  return arr.map((v, i) => ({ i, v }));
}

const formatY = (v: number) => Math.round(v).toString();

const tooltipStyle: React.CSSProperties = {
  background: "rgba(15,23,42,.9)",
  border: "1px solid #1f2a44",
  color: "#cbd5e1",
  fontSize: 12,
  padding: "6px 8px",
};

export default function EquityChart({ data }: Props) {
  const series = toSeries(data);

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#24324d" strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="i"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickMargin={6}
            axisLine={{ stroke: "#24324d" }}
            tickLine={{ stroke: "#24324d" }}
          />
          <YAxis
            dataKey="v"
            tickFormatter={formatY}
            tick={{ fill: "#64748b", fontSize: 11 }}
            width={56}
            axisLine={{ stroke: "#24324d" }}
            tickLine={{ stroke: "#24324d" }}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={() => ""}
            formatter={(value: number) => [`${value.toFixed(2)} $`, "Equity"]}
          />

          <Area
            type="monotone"
            dataKey="v"
            stroke="#93c5fd" 
            strokeWidth={2.2}
            fill="url(#eqFill)"
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
