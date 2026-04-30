import fp from "fastify-plugin";
import { v2 as cloudinary } from "cloudinary";
import type { FastifyInstance } from "fastify";

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
}

async function plugin(app: FastifyInstance) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    app.log.warn(
      "Cloudinary env vars missing — photo upload will be disabled. " +
      "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
    );
    return;
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  app.decorate("cloudinary", {
    async upload(buffer: Buffer, folder: string): Promise<UploadResult> {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "image", transformation: [{ quality: "auto", fetch_format: "auto" }] },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error("Upload failed"));
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
            });
          }
        );
        stream.end(buffer);
      });
    },
  });
}

declare module "fastify" {
  interface FastifyInstance {
    cloudinary?: {
      upload(buffer: Buffer, folder: string): Promise<UploadResult>;
    };
  }
}

export const cloudinaryPlugin = fp(plugin);
