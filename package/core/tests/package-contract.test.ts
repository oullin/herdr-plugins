import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

describe('plugin core package contract', () => {
	it('exposes private source runtime and testing entrypoints', () => {
		const packageJson = JSON.parse(readFileSync(join(
			process.cwd(),
			'package',
			'core',
			'package.json',
		), 'utf8')) as {
			readonly name?: string;
			readonly private?: boolean;
			readonly version?: string;
			readonly exports?: Record<string, string>;
		};

		expect(packageJson).toMatchObject({
			name: '@oullin/herdr-plugin-core',
			private: true,
			version: '0.1.1',
			exports: {
				'.': './src/index.ts',
				'./herdr-cli': './src/herdr-cli/index.ts',
				'./herdr-cli/*': './src/herdr-cli/*/index.ts',
				'./path-resolvers': './src/path-resolvers/index.ts',
				'./path-resolvers/*': './src/path-resolvers/*/index.ts',
				'./persistence': './src/persistence/index.ts',
				'./persistence/*': './src/persistence/*/index.ts',
				'./testing': './src/testing/index.ts',
			},
		});
	});

	it('is discovered from the singular package workspace path', () => {
		const workspace = readFileSync(
			join(
				process.cwd(),
				'pnpm-workspace.yaml',
			),
			'utf8',
		);
		const tsconfig = readFileSync(
			join(
				process.cwd(),
				'tsconfig.json',
			),
			'utf8',
		);
		const viteConfig = readFileSync(
			join(
				process.cwd(),
				'vite.config.ts',
			),
			'utf8',
		);

		expect(workspace).toContain('- package/*');
		expect(workspace).not.toContain('- packages/*');
		expect(tsconfig).toContain('"package/**/*.ts"');
		expect(viteConfig).toContain("'package/**/*.test.ts'");
	});

	it('points repository metadata at the relocated package', () => {
		const packageJson = JSON.parse(readFileSync(join(
			process.cwd(),
			'package',
			'core',
			'package.json',
		), 'utf8')) as {
			readonly repository?: { readonly directory?: string };
		};

		expect(packageJson.repository?.directory).toBe('package/core');
	});
});
