import vinext from "vinext";
import { defineConfig } from "vite";
import { seedDesignPlugin } from "@seed-design/vite-plugin";
import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { configureToolEnvironment } from "./scripts/tool-environment.mjs";
import { sites } from "./scripts/vite/sites-vite-plugin";
import { connectorPreview } from "./scripts/vite/connector-preview-plugin.mjs";

const LOCAL_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";

const localBindingConfig = {
  name: process.env.CAMP_WORKER_NAME || "huddlers-fire",
  main: "./worker/index.ts",
  compatibility_date: "2026-05-15",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: [
    {
      binding: "DB",
      database_name: "huddlers-fire",
      database_id: process.env.CAMP_D1_DATABASE_ID || LOCAL_DATABASE_ID,
      migrations_dir: fileURLToPath(new URL("./drizzle", import.meta.url)),
    },
  ],
};

export default defineConfig(async ({ command }) => {
  configureToolEnvironment(process.cwd());
  const release=command==='build' ? JSON.parse(process.env.CAMP_BUILD_RELEASE||'null') : {id:'development',revision:0};
  if(!release||typeof release.id!=='string'||!Number.isSafeInteger(release.revision))throw new Error('Build through npm run build to create a shared release identity.');
  const previewJob = command === "serve" && process.env.CAMP_PREVIEW_JOB;
  // Keep project-only authoring dependencies outside the published app's build graph.
  const previewModule = new URL("./tests/sprite-preview-plugin.mjs", import.meta.url).href;
  const previewPlugins = previewJob
    ? [(await import(/* @vite-ignore */ previewModule)).spritePreviewPlugin(previewJob)]
    : [];
  const materialPreview = command === "serve" && process.env.CAMP_MATERIAL_PREVIEW;
  if (materialPreview) {
    const materialModule = new URL("./tests/lighting-preview-plugin.mjs", import.meta.url).href;
    previewPlugins.push((await import(/* @vite-ignore */ materialModule)).materialPreviewPlugin(materialPreview));
  }

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    define: {__CAMP_RELEASE__:JSON.stringify(release)},
    server: {
      ...(managedLinux
        ? { host: "0.0.0.0", allowedHosts: ["terminal.local"] }
        : {}),
      watch: {
        ignored: ["**/.wrangler/**", "**/.npm-cache/**", "**/outputs/**"],
        ...(isCodexSeatbeltSandbox ? { useFsEvents: false, usePolling: true } : {}),
      },
    },
    plugins: [
      ...previewPlugins,
      vinext(),
      seedDesignPlugin({ colorMode: "dark-only" }),
      ...(command === "serve" ? [sites({ mockAuth: !managedLinux }), connectorPreview()] : []),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          ...localBindingConfig,
          ...(command === "serve"
            ? {
                services: [
                  {
                    binding: "CONNECTORS",
                    service: "sites-connector-preview",
                    entrypoint: "ConnectorPreview",
                  },
                ],
              }
            : {}),
        },
        ...(command === "serve"
          ? {
              auxiliaryWorkers: [
                {
                  config: {
                    name: "sites-connector-preview",
                    main: "./scripts/connector-preview/worker.mjs",
                    compatibility_date: "2026-05-15",
                  },
                },
              ],
            }
          : {}),
      }),
    ],
  };
});
