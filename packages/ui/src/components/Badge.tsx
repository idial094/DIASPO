import type { CSSProperties, ReactNode } from "react";
import { colors } from "../tokens/colors";

type BadgeTone = "blue" | "green" | "gold" | "red";

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, CSSProperties> = {
  blue: { background: colors.bluePale, color: colors.blue },
  green: { background: "#E9F8EF", color: colors.green },
  gold: { background: colors.goldPale, color: colors.gold },
  red: { background: "#FEECEF", color: colors.red }
};

export function Badge({ children, tone = "blue" }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: 999,
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 700,
        ...tones[tone]
      }}
    >
      {children}
    </span>
  );
}
