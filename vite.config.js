import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
    base: process.env.ELECTRON == "true" ? './' : "",
    plugins: [vue()],
    css: {
        preprocessorOptions: {
            scss: {
                charset: false,
            },
        },
        // postcss: {
        //     plugins: [
        //         {
        //             postcssPlugin: 'internal:charset-removal',
        //             AtRule: {
        //                 charset: (atRule) => {
        //                     if (atRule.name === 'charset') {
        //                         atRule.remove();
        //                     }
        //                 },
        //             },
        //         },
        //     ],
        // },
    },
    build: {
        minify: false,
    },
});

// 原版
// "build:for:electron": "vue-tsc --noEmit && cross-env ELECTRON=true vite build",
// "electron:dev": "concurrently -k \"cross-env BROWSER=none yarn dev\" \"yarn electron\"",
