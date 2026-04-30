import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useColis, useCreateColisRequest } from "@diaspo/api";
import { colisSchema, type ColisFormData } from "@diaspo/shared";
import { mobileTheme } from "../../theme/tokens";

export default function DiasporaColisScreen() {
  const { data, isLoading, error } = useColis();
  const { createRequest, isPending } = useCreateColisRequest();
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ColisFormData>({
    resolver: zodResolver(colisSchema),
    defaultValues: {
      type: "electromenager",
      poids: 0,
      valeurDeclaree: 0,
      description: "",
      adresseLivraison: ""
    }
  });
  const type = watch("type");
  const active = useMemo(() => data.find((item) => item.status === "en_vol") ?? data[0], [data]);

  const handleCreate = (form: ColisFormData) => {
    void createRequest({
      label:
        form.type === "electromenager"
          ? "Electromenager"
          : form.type === "materiaux"
            ? "Materiaux"
            : "Effets personnels",
      weightKg: form.poids
    }).then(() => {
      reset({
        type: form.type,
        poids: 0,
        valeurDeclaree: 0,
        description: "",
        adresseLivraison: ""
      });
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Colis Diaspora</Text>

      <View style={styles.trackingCard}>
        <Text style={styles.trackId}>{active ? active.id.toUpperCase() : "BL-..."}</Text>
        <Text style={styles.trackMeta}>
          Paris -&gt; CDG -&gt; {active?.currentStep ?? "Vol"} -&gt; Conakry -&gt; Chantier
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nouvel envoi</Text>
        <Controller
          control={control}
          name="type"
          render={({ field: { onChange } }) => (
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <Pressable onPress={() => onChange("electromenager")} style={[styles.pillSelect, type === "electromenager" && styles.pillSelectActive]}>
                <Text>Electro</Text>
              </Pressable>
              <Pressable onPress={() => onChange("materiaux")} style={[styles.pillSelect, type === "materiaux" && styles.pillSelectActive]}>
                <Text>Materiaux</Text>
              </Pressable>
              <Pressable onPress={() => onChange("effets_personnels")} style={[styles.pillSelect, type === "effets_personnels" && styles.pillSelectActive]}>
                <Text>Effets</Text>
              </Pressable>
            </View>
          )}
        />
        <Controller
          control={control}
          name="poids"
          render={({ field: { value, onChange } }) => (
            <TextInput
              placeholder="Poids (kg)"
              style={styles.input}
              value={String(value)}
              onChangeText={(text) => onChange(Number.parseFloat(text || "0"))}
            />
          )}
        />
        <Controller
          control={control}
          name="valeurDeclaree"
          render={({ field: { value, onChange } }) => (
            <TextInput
              placeholder="Valeur declaree"
              style={styles.input}
              value={String(value)}
              onChangeText={(text) => onChange(Number.parseFloat(text || "0"))}
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange } }) => (
            <TextInput placeholder="Description" style={styles.input} value={value} onChangeText={onChange} />
          )}
        />
        <Controller
          control={control}
          name="adresseLivraison"
          render={({ field: { value, onChange } }) => (
            <TextInput placeholder="Adresse livraison" style={styles.input} value={value} onChangeText={onChange} />
          )}
        />
        {errors.poids ? <Text style={styles.error}>{errors.poids.message}</Text> : null}
        {errors.valeurDeclaree ? <Text style={styles.error}>{errors.valeurDeclaree.message}</Text> : null}
        {errors.description ? <Text style={styles.error}>{errors.description.message}</Text> : null}
        {errors.adresseLivraison ? <Text style={styles.error}>{errors.adresseLivraison.message}</Text> : null}
        <Pressable
          accessibilityLabel="Envoyer la demande de colis"
          style={[styles.sendBtn, isPending ? styles.sendBtnDisabled : null]}
          onPress={handleSubmit(handleCreate)}
          disabled={isPending}
        >
          <Text style={styles.sendText}>{isPending ? "Envoi..." : "Envoyer la demande"}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.card}>
        <Text style={styles.sectionTitle}>Historique</Text>
        {isLoading ? <Text style={styles.info}>Chargement...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && data.length === 0 ? <Text style={styles.info}>Aucun colis.</Text> : null}
        {data.map((item) => (
          <View key={item.id} style={styles.row}>
            <View>
              <Text style={styles.name}>{item.id.toUpperCase()} - {item.label}</Text>
              <Text style={styles.meta}>
                {new Date(item.lastUpdate).toLocaleDateString("fr-FR")} - {item.weightKg} kg
              </Text>
            </View>
            <Text style={item.status === "en_vol" ? styles.pillGold : styles.pillGreen}>
              {item.status === "en_vol" ? "En vol" : "Livre"}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: mobileTheme.colors.bg, padding: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: mobileTheme.colors.text },
  trackingCard: {
    borderRadius: mobileTheme.radius.card,
    padding: 14,
    backgroundColor: "#0E1B2E"
  },
  trackId: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  trackMeta: { color: "#D6E4F2", marginTop: 6 },
  card: {
    borderRadius: mobileTheme.radius.card,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    padding: 12
  },
  sectionTitle: { color: mobileTheme.colors.text, fontWeight: "700", marginBottom: 8 },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  pillSelect: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  pillSelectActive: {
    backgroundColor: "#EAF4FF"
  },
  error: {
    color: "#CE1126",
    marginTop: -4,
    marginBottom: 6
  },
  info: {
    color: mobileTheme.colors.textMid,
    marginBottom: 8
  },
  sendBtn: {
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.blue,
    paddingVertical: 10,
    marginTop: 4
  },
  sendBtnDisabled: {
    opacity: 0.6
  },
  sendText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EBF1F9"
  },
  name: { color: mobileTheme.colors.text, fontWeight: "700" },
  meta: { color: mobileTheme.colors.textMid, marginTop: 2 },
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
  }
});
