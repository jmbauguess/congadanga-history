import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Point = {
  year: number;
  finish: number | null;
};

function formatFinishLabel(v: number | null) {
  if (v == null) return "—";
  const suffix =
    v % 10 === 1 && v % 100 !== 11
      ? "st"
      : v % 10 === 2 && v % 100 !== 12
      ? "nd"
      : v % 10 === 3 && v % 100 !== 13
      ? "rd"
      : "th";
  return `${v}${suffix}`;
}

export default function FinishByYearChart({
  data,
  maxTeamsGuess = 12,
}: {
  data: Point[];
  maxTeamsGuess?: number;
}) {
  const cleaned = data
    .filter((d) => Number.isFinite(d.year))
    .sort((a, b) => a.year - b.year);

  const finishes = cleaned.map((d) => d.finish ?? NaN).filter(Number.isFinite) as number[];
  const maxFinish = finishes.length ? Math.max(...finishes) : maxTeamsGuess;

  return (
    <div className="card" style={{ padding: 14, marginTop: 16 }}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>Finish by Year</div>

      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cleaned} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(230,237,247,0.10)" strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tick={{ fill: "rgba(230,237,247,0.75)" }}
              axisLine={{ stroke: "rgba(230,237,247,0.18)" }}
              tickLine={{ stroke: "rgba(230,237,247,0.18)" }}
            />
            <YAxis
              dataKey="finish"
              domain={[1, Math.max(maxFinish, 10)]}
              reversed
              allowDecimals={false}
              tick={{ fill: "rgba(230,237,247,0.75)" }}
              axisLine={{ stroke: "rgba(230,237,247,0.18)" }}
              tickLine={{ stroke: "rgba(230,237,247,0.18)" }}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(16,24,38,0.95)",
                border: "1px solid rgba(230,237,247,0.15)",
                borderRadius: 12,
                color: "rgba(230,237,247,0.9)",
              }}
              labelStyle={{ color: "rgba(230,237,247,0.85)" }}
              formatter={(value: any) => [formatFinishLabel(value), "Finish"]}
              labelFormatter={(label: any) => `Year: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="finish"
              stroke="rgba(125,211,252,0.95)"
              strokeWidth={3}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="subtle" style={{ marginTop: 8 }}>
        Lower is better (1 = champion).
      </div>
    </div>
  );
}
