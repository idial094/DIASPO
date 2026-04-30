import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAgencePaymentRequests,
  useCreateAgencePaymentRequest
} from "@diaspo/api";
import { paiementRequestSchema, type PaiementRequestData } from "@diaspo/shared";
import { mobileTheme } from "../../theme/tokens";

export default function AgencePaiementsScreen() {
  const { data, isLoading, error } = useAgencePaymentRequests();
  const { createRequest, isPending } = useCreateAgencePaymentRequest();
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<PaiementRequestData>({
    resolver: zodResolver(paiementRequestSchema),
    defaultValues: {
      clientId: "p-001",
      etape: "Etape 4 - Murs",
      montantGNF: 4200000
    }
  });
  const pending = useMemo(
    () => data.filter((item) => item.status === "pending").length,
    [data]
  );

  const handleCreate = (payload: PaiementRequestData) => {
    void createRequest({
      projectId: payload.clientId,
      clientName: "Client " + payload.clientId.toUpperCase(),
      stage: payload.etape,
      amountGnf: payload.montantGNF
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paiements agence</Text>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Nouvelle demande</Text>
        <Controller
          control={control}
          name="clientId"
          render={({ field: { value, onChange } }) => (
            <TextInput value={value} onChangeText={onChange} placeholder="ID projet/client" style={styles.input} />
          )}
        />
        <Controller
          control={control}
          name="etape"
          render={({ field: { value, onChange } }) => (
            <TextInput value={value} onChangeText={onChange} placeholder="Etape" style={styles.input} />
          )}
        />
        <Controller
          control={control}
          name="montantGNF"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={String(value)}
              onChangeText={(text) => onChange(Number.parseInt(text || "0", 10))}
              placeholder="Montant GNF"
              style={styles.input}
              keyboardType="number-pad"
            />
          )}
        />
        {errors.clientId ? <Text style={styles.error}>{errors.clientId.message}</Text> : null}
        {errors.etape ? <Text style={styles.error}>{errors.etape.message}</Text> : null}
        {errors.montantGNF ? <Text style={styles.error}>{errors.montantGNF.message}</Text> : null}
        <Pressable
          accessibilityLabel="Creer une demande de paiement agence"
          style={[styles.submitBtn, isPending ? styles.submitBtnDisabled : null]}
          onPress={handleSubmit(handleCreate)}
          disabled={isPending}
        >
          <Text style={styles.submitText}>
            {isPending ? "Creation..." : "Creer la demande"}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.card}>
        <Text style={styles.subtitle}>Demandes recentes ({pending} en attente)</Text>
        {isLoading ? <Text style={styles.info}>Chargement...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isLoading && !error && data.length === 0 ? <Text style={styles.info}>Aucune demande recente.</Text> : null}
        {data.map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.clientName}</Text>
              <Text style={styles.meta}>
                {item.stage} - {item.amountGnf.toLocaleString("fr-FR")} GNF
              </Text>
            </View>
            <Text style={item.status === "pending" ? styles.pillGold : styles.pillGreen}>
              {item.status}
            </Text>
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
  card: {
    borderRadius: mobileTheme.radius.card,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    padding: 12
  },
  subtitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    marginBottom: 8
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  error: {
    color: "#CE1126",
    marginTop: -6,
    marginBottom: 8
  },
  submitBtn: {
    borderRadius: 12,
    backgroundColor: mobileTheme.colors.blue,
    paddingVertical: 10
  },
  submitBtnDisabled: {
    opacity: 0.6
  },
  submitText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EBF1F9"
  },
  info: {
    color: mobileTheme.colors.textMid,
    marginBottom: 8
  },
  name: {
    color: mobileTheme.colors.text,
    fontWeight: "700"
  },
  meta: {
    color: mobileTheme.colors.textMid,
    marginTop: 2
  },
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
