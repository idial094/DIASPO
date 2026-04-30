import { StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { useColis, useProjectPayments, useProjectSummary } from "@diaspo/api";
import { mobileTheme } from "../../theme/tokens";

export default function DiasporaDashboardScreen() {
  const { data: summary, isLoading, error } = useProjectSummary("p-001");
  const { data: payments } = useProjectPayments("p-001");
  const { data: colis } = useColis();
  const pendingAmount = useMemo(
    () => payments.filter((item) => item.status === "pending").reduce((sum, item) => sum + item.amountGnf, 0),
    [payments]
  );
  const activeColis = useMemo(() => colis.find((item) => item.status === "en_vol") ?? colis[0], [colis]);

  return (
    <View style={styles.container}>
      <View style={styles.alert}>
        <Text style={styles.alertTitle}>Paiement en attente</Text>
        <Text style={styles.alertBody}>
          {pendingAmount > 0
            ? `${pendingAmount.toLocaleString("fr-FR")} GNF en attente de validation.`
            : "Aucun paiement en attente pour le moment."}
        </Text>
      </View>
      {isLoading ? <Text style={styles.info}>Chargement...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Avancement global</Text>
        <Text style={styles.progressValue}>{summary ? `${summary.progress}%` : "--"}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${summary?.progress ?? 0}%` }]} />
        </View>
        {summary ? <Text style={styles.track}>{summary.title}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tracking colis</Text>
        <Text style={styles.track}>
          Paris → CDG → {activeColis?.currentStep ?? "Vol"} → Conakry → Chantier
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 16,
    backgroundColor: mobileTheme.colors.bg
  },
  alert: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FEF8EC",
    borderWidth: 1,
    borderColor: "rgba(200,146,42,0.3)"
  },
  alertTitle: {
    color: mobileTheme.colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  alertBody: {
    color: mobileTheme.colors.textMid,
    fontSize: 13,
    marginTop: 4
  },
  info: {
    color: mobileTheme.colors.textMid
  },
  error: {
    color: "#CE1126"
  },
  card: {
    borderRadius: mobileTheme.radius.card,
    padding: 16,
    backgroundColor: mobileTheme.colors.white,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8
  },
  progressValue: {
    fontSize: 22,
    fontWeight: "700",
    color: mobileTheme.colors.blue,
    marginBottom: 8
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 10,
    backgroundColor: "#EBF1F9",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    backgroundColor: mobileTheme.colors.blue
  },
  track: {
    color: mobileTheme.colors.textMid,
    marginTop: 8
  }
});
