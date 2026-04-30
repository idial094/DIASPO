import type { CSSProperties, ReactNode } from "react";
import { colors } from "../tokens/colors";

type ButtonVariant = "primary" | "outline" | "ghost";

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}

const baseStyle: CSSProperties = {
  borderRadius: 12,
  border: "none",
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer"
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    color: colors.white,
    background: `linear-gradient(135deg, ${colors.blue}, ${colors.blueMid})`
  },
  outline: {
    color: colors.text,
    background: colors.white,
    border: `1px solid ${colors.border}`
  },
  ghost: {
    color: colors.textMid,
    background: "transparent"
  }
};

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false
}: ButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        opacity: disabled ? 0.6 : 1
      }}
    >
      {children}
    </button>
  );
}
