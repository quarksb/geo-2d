import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isLib = mode === "lib";

  return {
    plugins: [vue(), ...(isLib ? [dts()] : [])],
    ...(isLib && {
      build: {
        lib: {
          entry: "src/index.ts",
          name: "geometry",
          formats: ["es", "umd"],
          fileName: (format) => `geometry.${format}.js`,
        },
        outDir: "dist",
        emptyOutDir: true,
      },
    }),
  };
});
