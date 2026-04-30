"use client";

import { Card } from "./Card";
import { Badge } from "./Badge";

export interface TrackingCardProps {
  trackingNumber: string;
  currentStep: string;
}

export function TrackingCard({ trackingNumber, currentStep }: TrackingCardProps) {
  const steps = ["Paris", "CDG", "Vol", "Conakry", "Chantier"];

  return (
    <Card>
      <div
        style={{
          margin: -22,
          marginBottom: 12,
          borderRadius: 20,
          padding: 18,
          background: "linear-gradient(135deg,#0E1B2E,#1C3A6E)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ color: "#FFFFFF" }}>{trackingNumber}</strong>
          <Badge tone="gold">{currentStep}</Badge>
        </div>
        <div style={{ marginTop: 8, color: "#D6E4F2", fontSize: 13 }}>
          Suivi en temps reel : Paris → CDG → Vol → Conakry → Chantier
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>Etapes logistiques</strong>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        {steps.map((step) => (
          <span
            key={step}
            style={{
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 700,
              color: step === currentStep ? "#0E1B2E" : "#4A6080",
              background: step === currentStep ? "#E8B84B" : "#EBF1F9",
              animation: step === currentStep ? "pulseDot 1.2s ease-in-out infinite" : undefined,
              display: "inline-block"
            }}
          >
            {step}
          </span>
        ))}
      </div>
    </Card>
  );
}
