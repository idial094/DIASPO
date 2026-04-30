import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { projects, chantierUpdates } from "../db/schema.js";

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 8;

export async function uploadsRoutes(app: FastifyInstance) {
  const authHook = { preHandler: app.authenticate };

  /**
   * POST /api/agence/projects/:id/photos
   * Accepts multipart/form-data with up to 10 image files.
   * Uploads to Cloudinary, stores URLs in a new chantierUpdate row.
   */
  app.post(
    "/api/agence/projects/:id/photos",
    authHook,
    async (request, reply) => {
      const { id: projectId } = z.object({ id: z.string() }).parse(request.params);

      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!project) {
        return reply.code(404).send({ message: "Projet introuvable" });
      }

      // Cloudinary not configured → return placeholder URLs
      const useCloudinary = !!app.cloudinary;

      const parts = request.parts({ limits: { files: MAX_FILES, fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 } });
      const photoUrls: string[] = [];
      const errors: string[] = [];

      for await (const part of parts) {
        if (part.type !== "file") continue;

        const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedMimes.includes(part.mimetype)) {
          errors.push(`${part.filename}: type non supporté (${part.mimetype})`);
          await part.toBuffer(); // drain
          continue;
        }

        const buffer = await part.toBuffer();

        if (useCloudinary) {
          try {
            const result = await app.cloudinary!.upload(buffer, `diaspo/chantier/${projectId}`);
            photoUrls.push(result.url);
          } catch (err) {
            app.log.error(err, "Cloudinary upload failed");
            errors.push(`${part.filename}: échec upload`);
          }
        } else {
          // Dev fallback: return a placeholder URL
          photoUrls.push(`https://placehold.co/800x600?text=${encodeURIComponent(part.filename ?? "photo")}`);
        }
      }

      if (photoUrls.length === 0 && errors.length > 0) {
        return reply.code(422).send({ message: "Aucune photo uploadée", errors });
      }

      // Log chantier update with photo URLs
      await db.insert(chantierUpdates).values({
        projectId,
        agenceUserId: request.user.sub,
        stage: project.stage,
        progress: project.progress,
        comment: `${photoUrls.length} photo(s) ajoutée(s)`,
        photoUrls,
      });

      return reply.code(201).send({ urls: photoUrls, errors });
    }
  );
}
