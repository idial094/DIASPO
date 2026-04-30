import type { CSSProperties } from "react";
import { colors } from "../tokens/colors";

type PaymentStatus = "paid" | "pending" | "failed";

export interface PaymentRowProps {
  label: string;
  amountGnf: number;
  amountEur?: number;
  date?: string;
  status: PaymentStatus;
}

const statusConfig: Record<PaymentStatus, { label: string; bg: string; color: string; icon: string }> = {
  paid: { label: "Payé", bg: "#E9F8EF", color: colors.green, icon: "✓" },
  pending: { label: "En attente", bg: colors.goldPale, color: colors.gold, icon: "⏳" },
  failed: { label: "Échoué", bg: "#FEECEF", color: colors.red, icon: "✕" },
};

export function PaymentRow({ label, amountGnf, amountEur, date, status }: PaymentRowProps) {
  const cfg = statusConfig[status];

  const rowStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "36px 1fr auto",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
    borderBottom: `1px solid ${colors.border}`,
  };

  const iconStyle: CSSProperties = {
    display: "grid",
    placeItems: "center",
    width: 36,
    height: 36,
    borderRadius: 10,
    background: cfg.bg,
    color: cfg.color,
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  };

  const badgeStyle: CSSProperties = {
    display: "inline-block",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    fontWeight: 700,
    background: cfg.bg,
    color: cfg.color,
    whiteSpace: "nowrap",
  };

  return (
    <div style={rowStyle}>
      <span style={iconStyle}>{cfg.icon}</span>
      <div>
        <strong style={{ color: colors.text, fontSize: 14 }}>{label}</strong>
        <div style={{ marginTop: 2, fontSize: 13, color: colors.textMid }}>
          {amountGnf.toLocaleString("fr-FR")} GNF
          {amountEur ? ` · ≈${amountEur.toLocaleString("fr-FR")} €` : null}
          {date ? ` · ${date}` : null}
        </div>
      </div>
      <span style={badgeStyle}>{cfg.label}</span>
    </div>
  );
}
