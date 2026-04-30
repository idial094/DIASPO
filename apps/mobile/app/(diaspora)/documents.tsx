import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useProjectDocuments } from "@diaspo/api";
import { mobileTheme } from "../../theme/tokens";

export default function DiasporaDocumentsScreen() {
  const { data, isLoading, error } = useProjectDocuments("p-001");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documents Diaspora</Text>
      <ScrollView contentContainerStyle={{ gap: 10 }}>
        {isLoading ? <Text style={styles.info}>Chargement...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && data.length === 0 ? <Text style={styles.info}>Aucun document disponible.</Text> : null}
        {data.map((doc) => (
          <View key={doc.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{doc.name}</Text>
              <Text style={styles.meta}>{doc.date} - {doc.size}</Text>
            </View>
            <Pressable accessibilityLabel={`Telecharger ${doc.name}`} style={styles.btn}>
              <Text style={styles.btnText}>Telecharger</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mobileTheme.colors.bg, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: mobileTheme.colors.text },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderRadius: mobileTheme.radius.card,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    padding: 12
  },
  name: { color: mobileTheme.colors.text, fontWeight: "700" },
  meta: { color: mobileTheme.colors.textMid, marginTop: 2 },
  info: { color: mobileTheme.colors.textMid },
  error: { color: "#CE1126" },
  btn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10
  },
  btnText: { color: mobileTheme.colors.textMid, fontWeight: "700" }
});
