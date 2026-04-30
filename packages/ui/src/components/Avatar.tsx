import type { CSSProperties } from "react";
import { colors } from "../tokens/colors";

type AvatarTone = "blue" | "green" | "gold" | "red";

export interface AvatarProps {
  initials: string;
  tone?: AvatarTone;
  size?: number;
}

const toneBg: Record<AvatarTone, string> = {
  blue: colors.bluePale,
  green: "#E9F8EF",
  gold: colors.goldPale,
  red: "#FEECEF",
};

const toneColor: Record<AvatarTone, string> = {
  blue: colors.blue,
  green: colors.green,
  gold: colors.gold,
  red: colors.red,
};

export function Avatar({ initials, tone = "blue", size = 38 }: AvatarProps) {
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
    borderRadius: "50%",
    background: toneBg[tone],
    color: toneColor[tone],
    fontSize: Math.round(size * 0.37),
    fontWeight: 700,
    flexShrink: 0,
    userSelect: "none",
  };

  return <span style={style}>{initials.slice(0, 2).toUpperCase()}</span>;
}
