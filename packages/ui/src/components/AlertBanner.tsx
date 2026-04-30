import { Button } from "./Button";
import { colors } from "../tokens/colors";

export interface AlertBannerProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AlertBanner({
  title,
  description,
  actionLabel,
  onAction
}: AlertBannerProps) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(200,146,42,0.3)",
        background: `linear-gradient(135deg, ${colors.goldPale}, #FFF3D0)`,
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        animation: "pulseAlert 2s ease-in-out infinite"
      }}
    >
      <div>
        <strong>{title}</strong>
        <div>{description}</div>
      </div>
      {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
