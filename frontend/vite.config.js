import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                prediction: resolve(__dirname, 'src/pages/prediction.html'),
                map: resolve(__dirname, 'src/pages/map.html'),
                reports: resolve(__dirname, 'src/pages/reports.html'),
            }
        }
    },
});