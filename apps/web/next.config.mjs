import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@diaspo/api", "@diaspo/shared", "@diaspo/store", "@diaspo/ui"],
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      react: path.resolve(process.cwd(), "node_modules/react"),
      "react/jsx-runtime": path.resolve(process.cwd(), "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(process.cwd(), "node_modules/react/jsx-dev-runtime"),
      "react-dom": path.resolve(process.cwd(), "node_modules/react-dom"),
      "@tanstack/react-query": path.resolve(
        process.cwd(),
        "node_modules/@tanstack/react-query"
      ),
    };
    return config;
  },
};

export default nextConfig;
