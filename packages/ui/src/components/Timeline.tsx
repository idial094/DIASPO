import type { CSSProperties } from "react";
import { colors } from "../tokens/colors";

type StepStatus = "done" | "active" | "pending";

export interface TimelineStep {
  label: string;
  description?: string;
  status: StepStatus;
  progress?: number;
}

export interface TimelineProps {
  steps: TimelineStep[];
}

const dotConfig: Record<StepStatus, { bg: string; color: string; symbol: string; animate: boolean }> = {
  done: { bg: "#E9F8EF", color: colors.green, symbol: "✓", animate: false },
  active: { bg: colors.bluePale, color: colors.blue, symbol: "●", animate: true },
  pending: { bg: colors.bg2, color: colors.textMuted, symbol: "⏳", animate: false },
};

export function Timeline({ steps }: TimelineProps) {
  const listStyle: CSSProperties = {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gap: 14,
  };

  return (
    <ul style={listStyle}>
      {steps.map((step, index) => {
        const cfg = dotConfig[step.status];
        const isLast = index === steps.length - 1;

        const itemStyle: CSSProperties = {
          position: "relative",
          display: "grid",
          gridTemplateColumns: "28px 1fr",
          alignItems: "start",
          gap: 10,
        };

        const lineStyle: CSSProperties = {
          display: isLast ? "none" : "block",
          position: "absolute",
          left: 11,
          top: 24,
          width: 2,
          height: "calc(100% + 14px)",
          background: colors.border,
        };

        const dotStyle: CSSProperties = {
          display: "grid",
          placeItems: "center",
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: cfg.bg,
          color: cfg.color,
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          zIndex: 1,
        };

        return (
          <li key={step.label} style={itemStyle}>
            <span
              style={dotStyle}
              className={cfg.animate ? "animate-pulse" : undefined}
            >
              {cfg.symbol}
            </span>
            <span style={lineStyle} />
            <div>
              <strong style={{ color: colors.text, fontSize: 14 }}>{step.label}</strong>
              {step.description ? (
                <p style={{ marginTop: 2, fontSize: 13, color: colors.textMid }}>{step.description}</p>
              ) : null}
              {step.status === "active" && step.progress !== undefined ? (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 999,
                      background: colors.bg2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${colors.blue}, ${colors.blueMid})`,
                        width: `${step.progress}%`,
                        transition: "width 1.2s ease-in-out",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, color: colors.textMid, marginTop: 4, display: "block" }}>
                    {step.progress}%
                  </span>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
