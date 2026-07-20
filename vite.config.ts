import { defineConfig } from 'vite-plus';

export default defineConfig(
	{
		fmt: {
			ignorePatterns: ['**/*.ts', '**/*.tsx', '**/*.vue'],
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
			include: ['packages/**/*.test.ts', 'plugins/**/*.test.ts'],
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
	},
);
