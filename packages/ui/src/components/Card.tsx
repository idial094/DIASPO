import type { CSSProperties, ReactNode } from "react";
import { colors } from "../tokens/colors";

export interface CardProps {
  children: ReactNode;
}

const cardStyle: CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: 20,
  padding: 22,
  boxShadow: "0 2px 16px rgba(26,111,196,0.09)"
};

export function Card({ children }: CardProps) {
  return <div style={cardStyle}>{children}</div>;
}
