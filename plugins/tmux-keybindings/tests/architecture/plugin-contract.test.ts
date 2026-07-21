import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

describe('tmux-keybindings plugin contract', () => {
	const root = join(
		process.cwd(),
		'plugins',
		'tmux-keybindings',
	);

	it('declares the public plugin metadata, actions, startup hook, and pane', () => {
		const manifest = readFileSync(
			join(root, 'herdr-plugin.toml'),
			'utf8',
		);

		expect(manifest).toContain('id = "oullin.tmux-keybindings"');
		expect(manifest).toContain('version = "0.2.0"');
		expect(manifest).toContain('min_herdr_version = "0.7.4"');
		expect(manifest).toContain('[[build]]');
		expect(manifest).toContain('"npm"');
		expect(manifest).toContain('"--omit=dev"');
		expect(
			manifest.match(/^id = "(apply|toggle|restore|bindings)"$/gmu),
		).toHaveLength(4);
		expect(manifest).toContain('on = "workspace.created"');
		expect(manifest).toContain('placement = "popup"');
		expect(manifest).toContain('width = 84');
		expect(manifest).toContain('height = 24');
	});

	it('uses concern aliases and is listed in the root catalogue', () => {
		const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
			readonly dependencies?: Record<string, string>;
			readonly imports?: Record<string, string>;
			readonly version?: string;
		};

		const catalogue = readFileSync(
			join(
				process.cwd(),
				'README.md',
			),
			'utf8',
		);

		expect(
			Object.keys(packageJson.imports ?? {}),
		).toEqual([
			'#tmux-keybindings/application/*',
			'#tmux-keybindings/domain/*',
			'#tmux-keybindings/errors/*',
			'#tmux-keybindings/infrastructure/*',
			'#tmux-keybindings/presentation/*',
			'#tmux-keybindings/testing/*',
		]);
		expect(catalogue).toContain('[Tmux Keybindings](plugins/tmux-keybindings)');
		expect(packageJson.version).toBe('0.2.0');
		expect(packageJson.dependencies).toEqual({ '@oullin/herdr-plugin-core': 'file:../../packages/plugin-core' });
	});
});
