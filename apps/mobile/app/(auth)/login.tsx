import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@diaspo/store";
import { fr, loginSchema, type LoginFormData } from "@diaspo/shared";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const SECURE_STORE_TOKEN_KEY = "auth_token";

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "mariam@example.com",
      password: "motdepasse123",
      role: "diaspora"
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password, role: data.role }),
      });

      if (!res.ok) {
        const body = await res.json() as { message?: string };
        setServerError(body.message ?? "Identifiants incorrects");
        return;
      }

      const body = await res.json() as {
        token: string;
        user: { id: string; email: string; role: "diaspora" | "agence"; name: string; location?: string };
      };

      await SecureStore.setItemAsync(SECURE_STORE_TOKEN_KEY, body.token);
      login(body.user, body.token);
    } catch {
      Alert.alert("Erreur", "Impossible de contacter le serveur. Vérifiez votre connexion.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{fr["app.name"]}</Text>
      <Text style={styles.subtitle}>{fr["auth.login.subtitle"]}</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
        )}
      />
      {errors.email ? <Text style={styles.error}>{errors.email.message}</Text> : null}

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="Mot de passe"
            secureTextEntry
            style={styles.input}
          />
        )}
      />
      {errors.password ? <Text style={styles.error}>{errors.password.message}</Text> : null}

      <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
        <Controller
          control={control}
          name="role"
          render={({ field: { value, onChange } }) => (
            <>
              <Pressable
                accessibilityLabel="Choisir role diaspora"
                style={[styles.secondaryBtn, { flex: 1, backgroundColor: value === "diaspora" ? "#EAF4FF" : "#FFFFFF" }]}
                onPress={() => onChange("diaspora")}
              >
                <Text style={styles.secondaryText}>Diaspora</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Choisir role agence"
                style={[styles.secondaryBtn, { flex: 1, backgroundColor: value === "agence" ? "#EAF4FF" : "#FFFFFF" }]}
                onPress={() => onChange("agence")}
              >
                <Text style={styles.secondaryText}>Agence</Text>
              </Pressable>
            </>
          )}
        />
      </View>

      {serverError ? <Text style={styles.error}>{serverError}</Text> : null}

      <Pressable
        accessibilityLabel="Se connecter"
        style={[styles.primaryBtn, isSubmitting ? styles.primaryBtnDisabled : null]}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      >
        <Text style={styles.primaryText}>{isSubmitting ? "Connexion..." : "Se connecter"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24
  },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#4A6080", marginBottom: 12 },
  input: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D6E4F2"
  },
  error: { width: "100%", marginTop: -8, color: "#CE1126", fontSize: 12 },
  primaryBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#1A6FC4"
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryText: { color: "#FFFFFF", fontWeight: "700", textAlign: "center" },
  secondaryBtn: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#D6E4F2"
  },
  secondaryText: { color: "#1A2B40", fontWeight: "700", textAlign: "center" }
});
