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
                    entry: {
                        index: "src/index.ts",
                        "core/index": "src/core/index.ts",
                        "core/base/index": "src/core/base/index.ts",
                        "core/math/index": "src/core/math/index.ts",
                        "core/curve/index": "src/core/curve/index.ts",
                        "core/shape/index": "src/core/shape/index.ts",
                        "core/path/index": "src/core/path/index.ts",
                        "core/transform/index": "src/core/transform/index.ts",
                        "core/utils/index": "src/core/utils/index.ts",
                        "struct/index": "src/struct/index.ts",
                    },
                    formats: ["es"],
                },
                outDir: "dist",
                emptyOutDir: true,
                rollupOptions: {
                    external: ["gl-matrix"],
                    output: {
                        preserveModules: true,
                        preserveModulesRoot: "src",
                        entryFileNames: "[name].js",
                        globals: {
                            "gl-matrix": "glMatrix",
                        },
                    },
                },
            },
        }),
    };
};
