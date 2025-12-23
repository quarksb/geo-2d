import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

// https://vitejs.dev/config/
export default ({ mode }) => {
    const isLib = mode === "lib";

    return {
        plugins: [vue(), vanillaExtractPlugin(), ...(isLib ? [dts()] : [])],
        root: "./",
        ...(isLib && {
            build: {
                lib: {
                    entry: "src/index.ts",
                    name: "geometry",
                    formats: ["es"],
                    fileName: "index",
                },
                outDir: "dist",
                emptyOutDir: true,
                rollupOptions: {
                    external: ["gl-matrix"],
                    output: {
                        globals: {
                            "gl-matrix": "glMatrix",
                        },
                    },
                },
            },
        }),
    };
};
