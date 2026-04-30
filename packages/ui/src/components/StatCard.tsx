import type { ReactNode } from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";

export interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  tone?: "blue" | "green" | "gold" | "red";
  icon?: ReactNode;
}

export function StatCard({ label, value, trend, tone = "blue", icon }: StatCardProps) {
  const toneBg =
    tone === "green"
      ? "rgba(27,122,69,0.1)"
      : tone === "gold"
        ? "rgba(200,146,42,0.1)"
        : tone === "red"
          ? "rgba(206,17,38,0.08)"
          : "#EAF4FF";
  const toneIcon =
    tone === "green" ? "✅" : tone === "gold" ? "⏳" : tone === "red" ? "⚠️" : "📊";
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{label}</strong>
        {icon ? (
          icon
        ) : (
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              background: toneBg,
              fontSize: 14
            }}
          >
            {toneIcon}
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8 }}>{value}</div>
      {trend ? (
        <div style={{ marginTop: 8 }}>
          <Badge tone={tone}>{trend}</Badge>
        </div>
      ) : null}
    </Card>
  );
}
