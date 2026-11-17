process.env.TZ = 'Asia/Seoul';

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['tests/**/*.test.js'],
        env: { TZ: 'Asia/Seoul' },
    },
});
