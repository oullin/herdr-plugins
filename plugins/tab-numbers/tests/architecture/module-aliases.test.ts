import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

class ModuleAliasPolicy {
	private static readonly ignoredDirectories: ReadonlySet<string> = new Set(['.git', 'node_modules']);
	private static readonly sourceExtensions: ReadonlySet<string> = new Set(['.cjs', '.js', '.mjs', '.ts', '.tsx']);
	private static readonly relativeModulePattern = /(?:\bfrom\s+|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)['"]\.{1,2}\//u;

	private readonly root: string;

	constructor(root: string) {
		this.root = root;
	}

	violations(): readonly string[] {
		return this.sourceFiles(this.root)
			.filter((file) => ModuleAliasPolicy.relativeModulePattern.test(readFileSync(file, 'utf8')))
			.map((file) => relative(this.root, file));
	}

	private sourceFiles(directory: string): readonly string[] {
		const files: string[] = [];

		for (const entry of readdirSync(
			directory,
			{ withFileTypes: true },
		)) {
			if (ModuleAliasPolicy.ignoredDirectories.has(entry.name)) {
				continue;
			}

			const path = join(directory, entry.name);

			if (entry.isDirectory()) {
				files.push(...this.sourceFiles(path));
			} else if (ModuleAliasPolicy.sourceExtensions.has(extname(entry.name))) {
				files.push(path);
			}
		}

		return files;
	}
}

describe('module aliases', () => {
	it('rejects relative module specifiers across the codebase', () => {
		const policy = new ModuleAliasPolicy(process.cwd());

		expect(
			policy.violations(),
		).toEqual([]);
	});

	it('declares the shared runtime as a local direct dependency', () => {
		const packageJson = JSON.parse(readFileSync(join(
			process.cwd(),
			'plugins',
			'tab-numbers',
			'package.json',
		), 'utf8')) as {
			readonly dependencies?: Record<string, string>;
		};

		expect(packageJson.dependencies).toEqual({ '@oullin/herdr-plugin-core': 'file:../../package/core' });
	});

	it('keeps package and manifest versions aligned', () => {
		const root = join(
			process.cwd(),
			'plugins',
			'tab-numbers',
		);

		const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
			readonly version?: string;
		};

		const manifest = readFileSync(
			join(root, 'herdr-plugin.toml'),
			'utf8',
		);

		expect(packageJson.version).toBe('0.1.8');
		expect(manifest).toContain(`version = "${packageJson.version}"`);
	});
});
