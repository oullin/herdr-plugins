import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const root = join(
	process.cwd(),
	'plugins',
	'pane-navigation-hints',
);

function sourceFiles(directory: string): readonly string[] {
	return readdirSync(
		directory,
		{ withFileTypes: true },
	).flatMap((entry) => {
		const path = join(directory, entry.name);

		if (entry.isDirectory()) {
			return entry.name === 'node_modules' ? [] : sourceFiles(path);
		}

		return ['.js', '.ts'].includes(extname(entry.name)) ? [path] : [];
	});
}

describe('pane-navigation-hints plugin contract', () => {
	it('declares an independently installable Herdr 0.7.4 plugin', () => {
		const manifest = readFileSync(
			join(root, 'herdr-plugin.toml'),
			'utf8',
		);

		expect(manifest).toContain('id = "oullin.pane-navigation-hints"');
		expect(manifest).toContain('version = "0.1.0"');
		expect(manifest).toContain('min_herdr_version = "0.7.4"');
		expect(manifest).toContain('id = "refresh"');
		expect(manifest).toContain('id = "clear"');
		expect(manifest).toContain('on = "pane.created"');
	});

	it('keeps package metadata, aliases, and local core dependency aligned', () => {
		const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
			readonly name?: string;
			readonly version?: string;
			readonly imports?: Record<string, string>;
			readonly dependencies?: Record<string, string>;
		};

		expect(packageJson.name).toBe('@oullin/herdr-pane-navigation-hints');
		expect(packageJson.version).toBe('0.1.0');
		expect(packageJson.dependencies).toEqual({ '@oullin/herdr-plugin-core': 'file:../../package/core' });
		expect(
			Object.keys(packageJson.imports ?? {}),
		).toEqual([
			'#pane-navigation-hints/application/*',
			'#pane-navigation-hints/domain/*',
			'#pane-navigation-hints/errors/*',
			'#pane-navigation-hints/infrastructure/*',
			'#pane-navigation-hints/presentation/*',
			'#pane-navigation-hints/testing/*',
		]);
	});

	it('uses aliases instead of relative module specifiers', () => {
		const relativeModulePattern = /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+)['"]\.{1,2}\//u;

		const violations = sourceFiles(root)
			.filter((file) => relativeModulePattern.test(readFileSync(file, 'utf8')))
			.map((file) => relative(root, file));

		expect(violations).toEqual([]);
	});

	it('documents catalogue installation and reversible cleanup', () => {
		const catalogue = readFileSync(
			join(
				process.cwd(),
				'README.md',
			),
			'utf8',
		);
		const readme = readFileSync(
			join(root, 'README.md'),
			'utf8',
		);

		expect(catalogue).toContain('[Pane Navigation Hints](plugins/pane-navigation-hints)');
		expect(readme).toContain('oullin.pane-navigation-hints.refresh');
		expect(readme).toContain('oullin.pane-navigation-hints.clear');
		expect(readme).toContain('Clear active hints before disabling or uninstalling');
	});
});
