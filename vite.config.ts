import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default ({ mode }) => {
    const userConfig = {
        plugins: [vue()],
        root: "./",
    };
    if (mode === "lib") {
        Object.assign(userConfig, {
            build: {
                lib: {
                    entry: "src/index.ts",
                    name: "organic-shape",
                    formats: ["es", "umd"],
                    fileName: (format) => `organic-shape.${format}.js`,
                },
                outDir: "dist",
                emptyOutDir: true,
                rollupOptions: {
                    input: {
                        index: "./src/index.ts",
                    },
                },
            },
        });
        userConfig.plugins.push(dts());
    }

    return defineConfig(userConfig);
};
