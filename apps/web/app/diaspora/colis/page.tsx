"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card, TrackingCard, Badge } from "@diaspo/ui";
import { InputField, SelectField } from "@diaspo/ui/src/components/FormField";
import { colisSchema, type ColisFormData } from "@diaspo/shared";
import { useColis, useCreateColisRequest } from "@diaspo/api";

export default function DiasporaColisPage() {
  const router = useRouter();
  const { data, isLoading, error } = useColis();
  const { createRequest, isPending } = useCreateColisRequest();
  const [typeLabel, setTypeLabel] = useState("Electromenager");
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ColisFormData>({
    resolver: zodResolver(colisSchema),
    defaultValues: {
      type: "electromenager",
      poids: 0,
      valeurDeclaree: 0,
      description: "",
      adresseLivraison: ""
    }
  });

  const active = useMemo(() => data.find((item) => item.status === "en_vol") ?? data[0], [data]);

  const handleCreateRequest = (form: ColisFormData) => {
    void createRequest({
      label: typeLabel,
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
    <section className="grid gap-5">
      <button
        type="button"
        onClick={() => router.push("/diaspora/dashboard")}
        className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textMid"
      >
        ← Tableau de bord
      </button>
      <header>
        <h2>Transfert de colis</h2>
        <p className="mt-1 text-sm text-textMuted">Envoyez depuis l'Europe, recevez à Conakry</p>
      </header>
      {active ? <TrackingCard trackingNumber={active.id.toUpperCase()} currentStep={active.currentStep} /> : null}

      <div className="grid gap-4 min-[1041px]:grid-cols-[1fr_1fr]">
        <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue" />
          <h3>Envoyer un colis</h3>
        </div>
        <form className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]" onSubmit={handleSubmit(handleCreateRequest)}>
          <SelectField
            {...register("type")}
            onChange={(e) => {
              const value = e.target.value as ColisFormData["type"];
              setValue("type", value);
              setTypeLabel(
                value === "electromenager"
                  ? "Electromenager"
                  : value === "materiaux"
                    ? "Materiaux"
                    : "Effets personnels"
              );
            }}
            options={[
              { value: "electromenager", label: "Electromenager" },
              { value: "materiaux", label: "Materiaux" },
              { value: "effets_personnels", label: "Effets personnels" }
            ]}
          />
          <InputField type="number" {...register("poids", { valueAsNumber: true })} placeholder="Poids (kg)" error={errors.poids?.message} />
          <InputField type="number" {...register("valeurDeclaree", { valueAsNumber: true })} placeholder="Valeur declaree" error={errors.valeurDeclaree?.message} />
          <InputField {...register("description")} placeholder="Description" error={errors.description?.message} />
          <InputField {...register("adresseLivraison")} placeholder="Adresse livraison" error={errors.adresseLivraison?.message} />
          <div className="mt-1">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 font-bold text-white disabled:opacity-70"
            >
              {isPending ? "Envoi..." : "Envoyer la demande"}
            </button>
          </div>
        </form>
        <div className="mt-3 grid gap-2.5 [grid-template-columns:repeat(3,minmax(0,1fr))] max-[780px]:grid-cols-1">
          <div className="rounded-xl border border-border bg-bgAlt px-2 py-2.5 text-center font-bold text-text">Electromenager</div>
          <div className="rounded-xl border border-border bg-bgAlt px-2 py-2.5 text-center font-bold text-text">Materiaux</div>
          <div className="rounded-xl border border-border bg-bgAlt px-2 py-2.5 text-center font-bold text-text">Effets personnels</div>
        </div>
        </Card>

        <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue" />
          <h3>Historique des envois</h3>
        </div>
        {isLoading ? <p className="text-sm text-textMid">Chargement des envois...</p> : null}
        {error ? <p className="text-sm text-[#8c2130]">{error}</p> : null}
        {data.map((item) => (
          <div key={item.id} className="mb-2.5 flex items-center justify-between gap-2.5 rounded-xl border border-border bg-bg px-3 py-2.5 last:mb-0">
            <div>
              <strong>{item.id.toUpperCase()} - {item.label}</strong>
              <div className="mt-0.5 text-[13px] text-textMid">
                {item.weightKg} kg - mise a jour {new Date(item.lastUpdate).toLocaleDateString("fr-FR")}
              </div>
            </div>
            <Badge tone={item.status === "en_vol" ? "gold" : "green"}>
              {item.status === "en_vol" ? "En vol" : "Livre"}
            </Badge>
          </div>
        ))}
        </Card>
      </div>
    </section>
  );
}
