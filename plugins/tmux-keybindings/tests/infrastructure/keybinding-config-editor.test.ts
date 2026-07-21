import { describe, expect, it } from 'vite-plus/test';

import type { ConfigurationSnapshot } from '#tmux-keybindings/domain/models';
import { KeybindingConfigEditor } from '#tmux-keybindings/infrastructure/keybinding-config-editor';

describe('KeybindingConfigEditor', () => {
	const editor = new KeybindingConfigEditor();

	it('replaces managed values while preserving comments and unrelated settings', () => {
		const source = ['# personal configuration', '[keys]', 'prefix = "ctrl+a" # keep this explanation', 'new_tab = "ctrl+t"', 'settings = "prefix+s"', '', '[theme]', 'name = "nord"', ''].join(
			'\n',
		);

		const edit = editor.apply(source, '/config.toml');

		expect(edit.content).toContain('prefix = "ctrl+b" # keep this explanation');
		expect(edit.content).toContain('new_tab = "prefix+c"');
		expect(edit.content).toContain('settings = "prefix+s"');
		expect(edit.content).toContain('[theme]\nname = "nord"');
		expect(edit.snapshot.assignments['prefix']).toBe('prefix = "ctrl+a" # keep this explanation');
	});

	it('distinguishes comments from hashes inside literal strings', () => {
		const source = ['[keys]', "prefix = 'ctrl+#' # keep this explanation", ''].join('\n');

		const edit = editor.apply(source, '/config.toml');

		expect(edit.content).toContain('prefix = "ctrl+b" # keep this explanation');
		expect(edit.snapshot.assignments['prefix']).toBe("prefix = 'ctrl+#' # keep this explanation");
	});

	it('preserves unrelated shortcuts, displaces direct conflicts, and removes legacy plugin actions', () => {
		const source = [
			'[theme]',
			'name = "nord"',
			'',
			'[[keys.command]]',
			'key = "prefix+?"',
			'type = "shell"',
			'command = "old-help"',
			'',
			'[[keys.command]]',
			'key = "prefix+super+q"',
			'type = "shell"',
			'command = "old-super"',
			'',
			'[[keys.command]]',
			'key = "prefix+ctrl+alt+shift+super+q"',
			'type = "shell"',
			'command = "old-hyper"',
			'',
			'[[keys.command]]',
			'key = "prefix+ctrl+g"',
			'type = "shell"',
			'command = "old-bridge"',
			'',
			'[[keys.command]]',
			'key = "prefix+l"',
			'type = "plugin_action"',
			'command = "oullin.tmux-keybindings.toggle"',
			'',
			'[[keys.command]]',
			'key = "alt+super+t"',
			'type = "popup"',
			'command = "lazygit"',
			'',
			'[[keys.command]]',
			'key = "prefix+t"',
			'type = "popup"',
			'command = "gitui"',
			'',
		].join('\n');

		const edit = editor.apply(source, '/config.toml');

		expect(edit.snapshot.version).toBe(5);
		expect(edit.content).toContain('[keys]\nprefix = "ctrl+b"');
		expect(
			edit.content.match(/oullin\.tmux-keybindings\.toggle/gu),
		).toHaveLength(1);
		expect(edit.content).toContain('command = "old-help"');
		expect(edit.content).toContain('command = "old-super"');
		expect(edit.content).toContain('command = "old-hyper"');
		expect(edit.content).toContain('command = "old-bridge"');
		expect(edit.content).toContain('command = "gitui"');
		expect(edit.content).not.toContain('command = "lazygit"');
		expect(edit.content).not.toContain('help = ""');
		expect(edit.snapshot.displacedCommands).toEqual([
			{
				line: 28,
				text: ['[[keys.command]]', 'key = "alt+super+t"', 'type = "popup"', 'command = "lazygit"', ''].join('\n'),
			},
		]);

		const restored = editor.restore(edit.content, edit.snapshot);

		expect(restored).toContain('command = "old-help"');
		expect(restored).toContain('command = "old-super"');
		expect(restored).toContain('command = "old-hyper"');
		expect(restored).toContain('command = "old-bridge"');
		expect(restored).toContain('command = "lazygit"');
		expect(restored).toContain('command = "gitui"');
		expect(restored).not.toContain('oullin.tmux-keybindings.toggle');
	});

	it('is idempotent and restores only plugin-owned values', () => {
		const source = ['[keys]', 'prefix = "ctrl+a"', 'settings = "prefix+s"', '', '[[keys.command]]', 'key = "prefix+?"', 'type = "shell"', 'command = "old-help"', ''].join('\n');

		const first = editor.apply(source, '/config.toml');
		const second = editor.apply(first.content, '/config.toml');

		expect(second.content).toBe(first.content);

		const customised = first.content.replace('settings = "prefix+s"', 'settings = "ctrl+s"');
		const restored = editor.restore(customised, first.snapshot);

		expect(restored).toBe(source.replace('settings = "prefix+s"', 'settings = "ctrl+s"'));
	});

	it('restores multiple displaced commands at their original positions', () => {
		const source = [
			'[keys]',
			'prefix = "ctrl+a"',
			'settings = "prefix+s"',
			'',
			'[[keys.command]]',
			'key = "alt+super+t"',
			'type = "shell"',
			'command = "first-dialog"',
			'',
			'[[keys.command]]',
			'key = "prefix+t"',
			'type = "popup"',
			'command = "lazygit"',
			'',
			'[[keys.command]]',
			'key = "alt+super+t"',
			'type = "shell"',
			'command = "second-dialog"',
			'',
		].join('\n');

		const edit = editor.apply(source, '/config.toml');
		const restored = editor.restore(edit.content, edit.snapshot);

		expect(
			edit.snapshot.displacedCommands.map((command) => command.line),
		).toEqual([4, 14]);
		expect(restored).toBe(source);
	});

	it('merges current snapshots without losing first-install state', () => {
		const legacyHelp = ['[[keys.command]]', 'key = "prefix+?"', 'type = "shell"', 'command = "old-help"', ''].join('\n');
		const legacyPluginAction = ['[[keys.command]]', 'key = "prefix+?"', 'type = "plugin_action"', 'command = "oullin.tmux-keybindings.toggle"', ''].join('\n');

		const saved: ConfigurationSnapshot = {
			version: 1,
			configPath: '/config.toml',
			keysSectionExisted: true,
			assignments: {
				prefix: 'prefix = "ctrl+a"',
				help: 'help = "ctrl+h"',
			},
			displacedCommands: [
				{ line: 4, text: legacyHelp },
				{ line: 9, text: legacyPluginAction },
			],
		};

		const directConflict = ['[[keys.command]]', 'key = "alt+super+t"', 'type = "shell"', 'command = "dialog-help"', ''].join('\n');
		const discovered = editor.apply(directConflict, '/config.toml').snapshot;
		const merged = editor.mergeSnapshots(saved, discovered);

		expect(merged).toEqual({
			...saved,
			version: 5,
			displacedCommands: [
				{ line: 4, text: legacyHelp },
				{ line: 0, text: directConflict },
			],
		});

		const restored = editor.restore(editor.apply('', '/config.toml').content, saved);

		expect(restored).toContain('command = "old-help"');
		expect(restored).not.toContain('oullin.tmux-keybindings.toggle');
	});
});
