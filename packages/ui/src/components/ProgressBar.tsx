import { colors } from "../tokens/colors";

export interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      style={{
        width: "100%",
        height: 8,
        borderRadius: 6,
        overflow: "hidden",
        background: colors.bg2
      }}
    >
      <div
        style={{
          width: `${safeValue}%`,
          height: "100%",
          borderRadius: 6,
          transition: "width 1.2s ease",
          background: `linear-gradient(90deg, ${colors.blue}, ${colors.blueLight})`
        }}
      />
    </div>
  );
}
