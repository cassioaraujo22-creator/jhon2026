import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

function createBuildInfo() {
  const buildTime = new Date().toISOString();
  const buildId =
    process.env.VITE_APP_BUILD_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA?.slice(0, 12) ||
    `${Date.now()}`;
  const version = process.env.npm_package_version || "0.0.0";
  return { version, buildId, buildTime };
}

function writeVersionFile(buildInfo: { version: string; buildId: string; buildTime: string }) {
  const publicDir = path.resolve(__dirname, "public");
  const versionPath = path.resolve(publicDir, "version.json");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(versionPath, JSON.stringify(buildInfo, null, 2));
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const buildInfo = createBuildInfo();

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      {
        name: "build-version-json",
        buildStart() {
          writeVersionFile(buildInfo);
        },
        configureServer() {
          writeVersionFile(buildInfo);
        },
      },
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          // Workaround for intermittent Workbox terser crash on Node 24 during build.
          mode: "development",
        },
        manifest: {
          name: "Fit Pro Wave",
          short_name: "FitPro",
          description: "Seus treinos em alta performance",
          theme_color: "#7148EC",
          background_color: "#0b0b12",
          display: "standalone",
          start_url: "/",
          icons: [],
        },
      }),
    ].filter(Boolean),
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(buildInfo.version),
      "import.meta.env.VITE_APP_BUILD_ID": JSON.stringify(buildInfo.buildId),
      "import.meta.env.VITE_APP_BUILD_TIME": JSON.stringify(buildInfo.buildTime),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "@tanstack/react-query"],
    },
  };
});
