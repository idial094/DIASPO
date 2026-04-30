import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "../../theme/tokens";
import {
  useConfirmProjectPayment,
  useCreateStripePaymentIntent,
  useProjectPayments
} from "@diaspo/api";
import { useStripe } from "@stripe/stripe-react-native";

export default function DiasporaPaiementsScreen() {
  const { data, isLoading, error } = useProjectPayments("p-001");
  const { confirmPayment, isPending } = useConfirmProjectPayment("p-001");
  const { createIntent, isPending: isIntentPending, error: intentError } = useCreateStripePaymentIntent();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const total = data.reduce((sum, item) => sum + item.amountGnf, 0);
  const pending = data
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.amountGnf, 0);

  const startStripePayment = async () => {
    setStripeError(null);
    try {
      const intent = await createIntent({
        projectId: "p-001",
        paymentId: "pay-001",
        amountGnf: 4200000
      });

      if (intent.clientSecret.startsWith("mock_client_secret_")) {
        await confirmPayment("pay-001");
        setShowModal(false);
        setShowSuccess(true);
        return;
      }

      const init = await initPaymentSheet({
        merchantDisplayName: "Diaspo App",
        paymentIntentClientSecret: intent.clientSecret
      });
      if (init.error) {
        setStripeError(init.error.message);
        return;
      }

      const paymentResult = await presentPaymentSheet();
      if (paymentResult.error) {
        setStripeError(paymentResult.error.message);
        return;
      }

      await confirmPayment("pay-001");
      setShowModal(false);
      setShowSuccess(true);
    } catch {
      setStripeError("Paiement Stripe indisponible pour le moment.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paiements Diaspora</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Total verse</Text>
        <Text style={styles.value}>{total.toLocaleString("fr-FR")} GNF</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>En attente</Text>
        <Text style={styles.pending}>{pending.toLocaleString("fr-FR")} GNF</Text>
        {isLoading ? <Text style={styles.info}>Chargement...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable accessibilityLabel="Payer maintenant" style={styles.payBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.payBtnText}>Payer maintenant</Text>
        </Pressable>
      </View>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmer le paiement</Text>
            <Text style={styles.modalText}>Montant: 4 200 000 GNF (≈ 450 EUR)</Text>
            <Text style={styles.modalText}>Methode: Carte bancaire (Stripe)</Text>
            {intentError ? <Text style={styles.error}>{intentError}</Text> : null}
            {stripeError ? <Text style={styles.error}>{stripeError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable accessibilityLabel="Annuler" style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Confirmer le paiement"
                style={[styles.confirmBtn, isPending || isIntentPending ? styles.disabledBtn : null]}
                onPress={() => void startStripePayment()}
                disabled={isPending || isIntentPending}
              >
                <Text style={styles.confirmText}>
                  {isPending || isIntentPending ? "Initialisation..." : "Payer maintenant"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccess} transparent animationType="fade" onRequestClose={() => setShowSuccess(false)}>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { alignItems: "center" }]}>
            <Text style={{ fontSize: 42 }}>✅</Text>
            <Text style={styles.modalTitle}>Paiement confirme</Text>
            <Text style={styles.modalText}>La transaction a bien ete enregistree.</Text>
            <Pressable accessibilityLabel="Fermer le message de succes" style={styles.confirmBtn} onPress={() => setShowSuccess(false)}>
              <Text style={styles.confirmText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: mobileTheme.colors.bg
  },
  title: { fontSize: 22, fontWeight: "700", color: mobileTheme.colors.text },
  card: {
    backgroundColor: mobileTheme.colors.white,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.card,
    padding: 14
  },
  label: { color: mobileTheme.colors.textMid, fontWeight: "600" },
  value: { color: mobileTheme.colors.blue, fontSize: 24, fontWeight: "700", marginTop: 6 },
  pending: { color: mobileTheme.colors.gold, fontSize: 24, fontWeight: "700", marginTop: 6 },
  info: { color: mobileTheme.colors.textMid, marginTop: 8 },
  error: { color: "#CE1126", marginTop: 8 },
  payBtn: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: mobileTheme.colors.blue,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  payBtnText: { color: "#fff", fontWeight: "700", textAlign: "center" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(14,27,46,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  modalCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    padding: 18,
    gap: 10
  },
  modalTitle: { fontWeight: "700", fontSize: 18, color: mobileTheme.colors.text },
  modalText: { color: mobileTheme.colors.textMid },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    paddingVertical: 10
  },
  cancelText: { textAlign: "center", color: mobileTheme.colors.textMid, fontWeight: "700" },
  confirmBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.blue,
    paddingVertical: 10
  },
  disabledBtn: {
    opacity: 0.6
  },
  confirmText: { textAlign: "center", color: "#fff", fontWeight: "700" }
});
