import type { CSSProperties, ReactNode } from "react";
import { colors } from "../tokens/colors";

export interface ModalProps {
  children: ReactNode;
  onClose?: () => void;
  maxWidth?: number;
}

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 40,
  display: "grid",
  placeItems: "center",
  padding: 16,
  background: "rgba(14,27,46,0.48)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
};

export function Modal({ children, onClose, maxWidth = 480 }: ModalProps) {
  const panelStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth,
    background: colors.white,
    border: `1px solid ${colors.border}`,
    borderRadius: 20,
    padding: 22,
    boxShadow: "0 16px 48px rgba(26,111,196,0.14)",
    animation: "slideInCard 0.25s ease both",
  };

  const closeBtnStyle: CSSProperties = {
    position: "absolute",
    top: 14,
    right: 14,
    display: "grid",
    placeItems: "center",
    width: 28,
    height: 28,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: colors.white,
    cursor: "pointer",
    fontSize: 14,
    color: colors.textMid,
  };

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {onClose ? (
          <button type="button" style={closeBtnStyle} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}
