import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import path from 'path' 

// https://vitejs.dev/config/
export default defineConfig({
    // base: path.resolve(__dirname, './dist/'),	// 后来新增的
    base: './',	// 后来新增的
    plugins: [vue()]
})

