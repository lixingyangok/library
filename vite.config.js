import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
const path = require('path');

// https://vitejs.dev/config/
export default defineConfig({
    base: process.env.ELECTRON == "true" ? './' : "",
    plugins: [vue()],
    resolve: {
        alias: { // 配置路径别名（可多个）
            '@': path.resolve(__dirname, './src'),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                charset: false,
            },
        },
    },
    build: {
        minify: false,
    },
});

// 原版
// "build:for:electron": "vue-tsc --noEmit && cross-env ELECTRON=true vite build",
// "electron:dev": "concurrently -k \"cross-env BROWSER=none yarn dev\" \"yarn electron\"",
