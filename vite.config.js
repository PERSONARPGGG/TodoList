import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

function serviceWorkerPlugin() {
    return {
        name: 'chronos-service-worker',
        generateBundle(_, bundle) {
            const assets = ['./', './index.html', ...Object.keys(bundle)
                .filter(fileName => fileName !== 'sw.js')
                .map(fileName => `./${fileName}`)];
            const source = readFileSync('sw.js', 'utf8').replace(
                /const ASSETS = \[[\s\S]*?\];/,
                `const ASSETS = ${JSON.stringify(assets, null, 4)};`
            );
            this.emitFile({ type: 'asset', fileName: 'sw.js', source });
        }
    };
}

export default defineConfig({
    plugins: [serviceWorkerPlugin()],
    server: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true,
        hmr: {
            host: '127.0.0.1',
            port: 5173
        }
    },
    preview: {
        host: '127.0.0.1',
        port: 5173,
        strictPort: true
    }
});
