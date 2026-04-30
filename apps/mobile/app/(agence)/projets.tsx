import { StyleSheet, Text, View } from "react-native";
import { useAgenceProjects } from "@diaspo/api";
import { mobileTheme } from "../../theme/tokens";

export default function AgenceProjetsScreen() {
  const { data, isLoading, error } = useAgenceProjects();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Projets Agence</Text>
      {isLoading ? <Text style={styles.info}>Chargement...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!isLoading && !error && data.length === 0 ? <Text style={styles.info}>Aucun projet disponible.</Text> : null}
      {data.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.project}>{item.clientName} - {item.title}</Text>
          <Text style={styles.meta}>Etape: {item.stage} ({item.progress}%)</Text>
          <Text style={item.status === "retard" ? styles.badgeRed : styles.badgeBlue}>
            {item.status}
          </Text>
        </View>
      ))}
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
  card: {
    backgroundColor: mobileTheme.colors.white,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.card,
    padding: 14,
    gap: 6
  },
  project: {
    fontWeight: "700",
    color: mobileTheme.colors.text
  },
  meta: {
    color: mobileTheme.colors.textMid
  },
  info: {
    color: mobileTheme.colors.textMid
  },
  error: {
    color: "#CE1126"
  },
  badgeBlue: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF4FF",
    color: mobileTheme.colors.blue,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontWeight: "700",
    overflow: "hidden"
  },
  badgeRed: {
    alignSelf: "flex-start",
    backgroundColor: "#FEECEF",
    color: "#CE1126",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontWeight: "700",
    overflow: "hidden"
  }
});
