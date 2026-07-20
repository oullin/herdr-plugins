import { defineConfig } from 'vite-plus';

export default defineConfig({
  fmt: {
    semi: true,
    singleQuote: true,
  },
  lint: {
    plugins: ['typescript'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  test: {
    include: ['plugins/**/*.test.ts'],
  },
  run: {
    cache: {
      scripts: true,
      tasks: true,
    },
    tasks: {
      ready: {
        command: ['vp check', 'vp test'],
        output: [],
      },
    },
  },
});
