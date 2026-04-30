import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { useAgenceProjects, useUpdateAgenceProgress } from "@diaspo/api";
import { chantierUpdateSchema, type ChantierUpdateData } from "@diaspo/shared";
import { getToken } from "@diaspo/store";
import { mobileTheme } from "../../theme/tokens";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function AgenceChantierScreen() {
  const { data } = useAgenceProjects();
  const { updateProgress, isPending } = useUpdateAgenceProgress();
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [uploadPending, setUploadPending] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ChantierUpdateData & { projectId: string }>({
    resolver: zodResolver(
      chantierUpdateSchema.extend({ projectId: chantierUpdateSchema.shape.etape })
    ),
    defaultValues: {
      projectId: "p-001",
      etape: "Murs",
      avancement: 60,
      commentaire: "Mise a jour en cours sur le chantier.",
    },
  });
  const projectId = watch("projectId");

  const active = useMemo(
    () => data.find((item) => item.id === projectId) ?? data[0],
    [data, projectId]
  );

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "L'accès à la galerie est nécessaire pour uploader des photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (pid: string): Promise<string[]> => {
    if (photos.length === 0) return [];

    const formData = new FormData();
    for (const photo of photos) {
      formData.append("files", {
        uri: photo.uri,
        name: photo.fileName ?? `photo_${Date.now()}.jpg`,
        type: photo.mimeType ?? "image/jpeg",
      } as unknown as Blob);
    }

    const token = getToken() ?? "";
    const res = await fetch(`${API_BASE}/api/agence/projects/${pid}/photos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) return [];
    const json = await res.json() as { urls: string[] };
    return json.urls ?? [];
  };

  const submit = async (payload: ChantierUpdateData & { projectId: string }) => {
    setUploadPending(true);
    try {
      await uploadPhotos(payload.projectId);
      await updateProgress({
        projectId: payload.projectId,
        progress: payload.avancement,
        stage: payload.etape,
      });
      setValue("commentaire", "");
      setPhotos([]);
      Alert.alert("Succès", "Mise à jour envoyée avec succès.");
    } catch {
      Alert.alert("Erreur", "Impossible d'envoyer la mise à jour.");
    } finally {
      setUploadPending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 12, padding: 16 }}>
      <Text style={styles.title}>Mise a jour chantier</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Projet sélectionné</Text>
        <Text style={styles.value}>
          {active ? `${active.clientName} - ${active.title}` : "Aucun projet"}
        </Text>
        <Controller
          control={control}
          name="projectId"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="ID projet (ex: p-001)"
              style={styles.input}
            />
          )}
        />
        <Controller
          control={control}
          name="etape"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Étape"
              style={styles.input}
            />
          )}
        />
        {errors.etape ? <Text style={styles.error}>{errors.etape.message}</Text> : null}
        <Controller
          control={control}
          name="avancement"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={String(value)}
              onChangeText={(text) => onChange(Number.parseInt(text || "0", 10))}
              placeholder="Progression %"
              keyboardType="number-pad"
              style={styles.input}
            />
          )}
        />
        {errors.avancement ? <Text style={styles.error}>{errors.avancement.message}</Text> : null}
        <Controller
          control={control}
          name="commentaire"
          render={({ field: { value, onChange } }) => (
            <TextInput
              value={value}
              onChangeText={onChange}
              placeholder="Commentaire chantier"
              multiline
              style={[styles.input, styles.textarea]}
            />
          )}
        />

        {/* Photo upload section */}
        <Text style={[styles.label, { marginTop: 4 }]}>Photos du chantier</Text>
        <Pressable
          accessibilityLabel="Sélectionner des photos"
          onPress={pickPhotos}
          style={styles.photoPickerBtn}
        >
          <Text style={styles.photoPickerText}>+ Ajouter des photos ({photos.length}/10)</Text>
        </Pressable>

        {photos.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {photos.map((photo, index) => (
                <View key={photo.uri} style={styles.thumbContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.thumb} />
                  <Pressable
                    accessibilityLabel="Supprimer la photo"
                    onPress={() => removePhoto(index)}
                    style={styles.removeBtn}
                  >
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}

        <Pressable
          accessibilityLabel="Envoyer la mise a jour chantier"
          onPress={handleSubmit(submit)}
          style={styles.submitBtn}
          disabled={isPending || uploadPending}
        >
          <Text style={styles.submitText}>
            {isPending || uploadPending ? "Envoi en cours..." : "Envoyer mise à jour"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.bg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  card: {
    borderRadius: mobileTheme.radius.card,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    padding: 12,
    gap: 8,
  },
  label: {
    color: mobileTheme.colors.textMid,
    fontWeight: "600",
  },
  value: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  textarea: {
    minHeight: 84,
    textAlignVertical: "top",
  },
  error: {
    color: "#CE1126",
    marginTop: -4,
  },
  photoPickerBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: mobileTheme.colors.blue,
    paddingVertical: 10,
    alignItems: "center",
  },
  photoPickerText: {
    color: mobileTheme.colors.blue,
    fontWeight: "600",
  },
  thumbContainer: {
    position: "relative",
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.border,
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 99,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: mobileTheme.colors.blue,
    marginTop: 4,
  },
  submitText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
