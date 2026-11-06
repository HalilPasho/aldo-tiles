/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

// Astro's own Vite setup lets tests/unit/page-states.test.ts render .astro pages.
export default getViteConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
