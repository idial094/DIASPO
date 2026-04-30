import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAgenceColis, useUpdateAgenceColisStatus } from "@diaspo/api";
import { mobileTheme } from "../../theme/tokens";

export default function AgenceColisScreen() {
  const { data, isLoading, error } = useAgenceColis();
  const { updateStatus, isPending } = useUpdateAgenceColisStatus();

  const stats = useMemo(() => {
    const enTransit = data.filter((item) => item.status === "en_transit").length;
    const douane = data.filter((item) => item.status === "douane").length;
    const livre = data.filter((item) => item.status === "livre").length;
    return { enTransit, douane, livre };
  }, [data]);

  const actionFor = (status: string) => {
    if (status === "en_transit") return "a_recuperer";
    if (status === "a_recuperer") return "en_livraison";
    if (status === "en_livraison") return "livre";
    return "livre";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Colis agence</Text>

      <View style={styles.statsRow}>
        <Text style={styles.stat}>Transit: {stats.enTransit}</Text>
        <Text style={styles.stat}>Douane: {stats.douane}</Text>
        <Text style={styles.stat}>Livres: {stats.livre}</Text>
      </View>
      {isLoading ? <Text style={styles.info}>Chargement...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && data.length === 0 ? <Text style={styles.info}>Aucun colis trouve.</Text> : null}

      <ScrollView style={styles.card}>
        {data.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.id.toUpperCase()} - {item.clientName}</Text>
              <Text style={styles.meta}>{item.label} - {item.weightKg} kg</Text>
              {item.issue ? <Text style={styles.issue}>⚠ {item.issue}</Text> : null}
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <Text style={item.status === "douane" ? styles.pillRed : item.status === "livre" ? styles.pillGreen : styles.pillGold}>
                {item.status}
              </Text>
              {item.status !== "livre" ? (
                <Pressable
                  accessibilityLabel={`Avancer statut colis ${item.id}`}
                  onPress={() => void updateStatus({ id: item.id, status: actionFor(item.status) })}
                  disabled={isPending}
                  style={[styles.btn, isPending ? styles.btnDisabled : null]}
                >
                  <Text style={styles.btnText}>Avancer</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.bg,
    padding: 16,
    gap: 12
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: mobileTheme.colors.text
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  stat: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#EAF4FF",
    color: mobileTheme.colors.blue,
    fontWeight: "700",
    overflow: "hidden"
  },
  card: {
    borderRadius: mobileTheme.radius.card,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    padding: 12
  },
  info: {
    color: mobileTheme.colors.textMid
  },
  error: {
    color: "#CE1126"
  },
  row: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EBF1F9"
  },
  name: { color: mobileTheme.colors.text, fontWeight: "700" },
  meta: { color: mobileTheme.colors.textMid, marginTop: 2 },
  issue: { color: "#CE1126", marginTop: 2 },
  btn: {
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.blue,
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnText: { color: "#FFFFFF", fontWeight: "700" },
  pillGold: {
    backgroundColor: "#FEF8EC",
    color: mobileTheme.colors.gold,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
    fontWeight: "700"
  },
  pillGreen: {
    backgroundColor: "#E9F8EF",
    color: "#1B7A45",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
    fontWeight: "700"
  },
  pillRed: {
    backgroundColor: "#FEECEF",
    color: "#CE1126",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
    fontWeight: "700"
  }
});
