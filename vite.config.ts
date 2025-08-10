import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

// https://vitejs.dev/config/
export default ({ mode }) => {
    const isLib = mode === "lib";
    const userConfig = {
        plugins: [vue(), vanillaExtractPlugin()],
        root: "./",
    };

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
};
