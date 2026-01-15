import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isFastBuild = mode === "development" || mode === "fast";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      target: "es2018",
      sourcemap: false,
      reportCompressedSize: false,
      minify: isFastBuild ? false : "esbuild",
      cssMinify: isFastBuild ? false : "esbuild",
    },
  };
});
