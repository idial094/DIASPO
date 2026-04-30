"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Card } from "@diaspo/ui";
import { InputField, SelectField, TextareaField } from "@diaspo/ui/src/components/FormField";
import { chantierUpdateSchema, type ChantierUpdateData } from "@diaspo/shared";
import { useAgenceProjects, useUpdateAgenceProgress } from "@diaspo/api";
import { z } from "zod";

export default function AgenceChantierPage() {
  const router = useRouter();
  const { data } = useAgenceProjects();
  const { updateProgress, isPending } = useUpdateAgenceProgress();
  const chantierFormSchema = chantierUpdateSchema.extend({
    projectId: z.string().min(1, "Projet requis")
  });
  type ChantierFormData = ChantierUpdateData & { projectId: string };
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ChantierFormData>({
    resolver: zodResolver(chantierFormSchema),
    defaultValues: {
      projectId: "p-001",
      etape: "Murs",
      avancement: 60,
      commentaire: "Mise a jour en cours sur le chantier."
    }
  });

  const submit = (payload: ChantierFormData) => {
    void updateProgress({
      projectId: payload.projectId,
      progress: payload.avancement,
      stage: payload.etape
    }).then(() => {
      setValue("commentaire", "");
    });
  };

  return (
    <section className="grid gap-5">
      <button
        type="button"
        onClick={() => router.push("/agence/projets")}
        className="w-fit rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-textMid"
      >
        ← Retour aux projets
      </button>
      <header>
        <h2>Mise à jour chantier</h2>
        <p className="mt-1 text-sm text-textMuted">Mariam Kouyaté - Villa Ratoma</p>
      </header>
      <div className="grid gap-4 min-[981px]:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue" />
            <h3>Déposer des photos</h3>
          </div>
          <button
            type="button"
            className="mt-2 grid w-full place-items-center rounded-2xl border-2 border-dashed border-border bg-bgAlt p-8 text-center"
          >
            <span className="mb-2 text-3xl">📸</span>
            <span className="text-sm font-semibold text-text">Cliquez pour sélectionner vos photos</span>
            <span className="text-xs text-textMuted">JPG, PNG - 10 Mo max par photo</span>
          </button>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-lg border border-border bg-bg px-2 py-1 text-xs text-textMid">murs_nord_03mars.jpg</span>
            <span className="rounded-lg border border-border bg-bg px-2 py-1 text-xs text-textMid">murs_sud_03mars.jpg</span>
            <span className="rounded-lg border border-border bg-bg px-2 py-1 text-xs text-textMid">facade_principale.jpg</span>
          </div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C8922A]" />
            <h3>Note de chantier</h3>
          </div>
          <form className="mt-2 grid gap-2.5" onSubmit={handleSubmit(submit)}>
            <SelectField
              label="Projet"
              {...register("projectId")}
              options={data.map((item) => ({
                value: item.id,
                label: `${item.clientName} - ${item.title}`
              }))}
              error={errors.projectId?.message}
            />
            <InputField {...register("etape")} label="Étape actuelle" placeholder="Étape" error={errors.etape?.message} />
            <InputField
              type="number"
              {...register("avancement", { valueAsNumber: true })}
              label="Pourcentage d'avancement"
              placeholder="Progression %"
              error={errors.avancement?.message}
            />
            <TextareaField
              {...register("commentaire")}
              label="Commentaire"
              placeholder="Commentaire chantier"
              error={errors.commentaire?.message}
            />
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                className="rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-bold text-textMid"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Envoi..." : "Envoyer mise a jour"}
              </button>
            </div>
          </form>
        </Card>
      </div>
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green" />
          <h3>Demander un paiement</h3>
        </div>
        <div className="mt-2 grid gap-2.5 min-[1020px]:grid-cols-[1.2fr_1fr_1fr_auto]">
          <SelectField
            options={[
              { value: "murs", label: "Elevation des murs" },
              { value: "toiture", label: "Toiture" },
              { value: "finitions", label: "Finitions" }
            ]}
          />
          <InputField value="4 200 000" readOnly />
          <InputField type="file" />
          <button
            type="button"
            className="h-fit rounded-xl border-none bg-gradient-to-br from-blue to-blue-mid px-3 py-2.5 text-sm font-bold text-white"
          >
            Envoyer la demande
          </button>
        </div>
      </Card>
    </section>
  );
}
