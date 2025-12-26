import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { name } from "./package.json";

// https://vitejs.dev/config/
export default ({ mode }) => {
    const isLib = mode === "lib";

    return {
        plugins: [vue(), vanillaExtractPlugin(), ...(isLib ? [dts({ rollupTypes: true })] : [])],
        root: "./",
        ...(isLib && {
            build: {
                lib: {
                    entry: "src/index.ts",
                    name: name,
                    formats: ["es"],
                    fileName: (format) => `${name}.${format}.js`,
                },
                outDir: "dist",
                emptyOutDir: true,
            },
        }),
    };
};
