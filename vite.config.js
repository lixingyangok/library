import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
    base: process.env.ELECTRON == "true" ? './' : "",
    plugins: [vue()],
});

// 原版
// "build:for:electron": "vue-tsc --noEmit && cross-env ELECTRON=true vite build",
// "electron:dev": "concurrently -k \"cross-env BROWSER=none yarn dev\" \"yarn electron\"",
