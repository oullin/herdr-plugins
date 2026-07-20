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
		expect(edit.content).toContain('help = "prefix+?"');
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

	it('keeps native help, displaces slash conflicts, and removes legacy plugin actions', () => {
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
			'key = "prefix+/"',
			'type = "shell"',
			'command = "old-panel"',
			'',
			'[[keys.command]]',
			'key = "prefix+l"',
			'type = "plugin_action"',
			'command = "oullin.tmux-keybindings.toggle"',
			'',
			'[[keys.command]]',
			'key = "prefix+t"',
			'type = "popup"',
			'command = "lazygit"',
			'',
		].join('\n');

		const edit = editor.apply(source, '/config.toml');

		expect(edit.content).toContain('[keys]\nprefix = "ctrl+b"');
		expect(edit.content).toContain('help = "prefix+?"');
		expect(edit.content).toContain('key = "prefix+?"\ntype = "shell"\ncommand = "old-help"');
		expect(edit.content).toContain('key = "prefix+/"\ntype = "plugin_action"');
		expect(edit.content).toContain('description = "toggle tmux keybinding panel"');
		expect(
			edit.content.match(/oullin\.tmux-keybindings\.toggle/gu),
		).toHaveLength(1);
		expect(edit.content).toContain('command = "lazygit"');
		expect(edit.content).not.toContain('command = "old-panel"');
		expect(edit.snapshot.displacedCommands).toEqual([
			{
				line: 8,
				text: ['[[keys.command]]', 'key = "prefix+/"', 'type = "shell"', 'command = "old-panel"', ''].join('\n'),
			},
		]);

		const restored = editor.restore(edit.content, edit.snapshot);

		expect(restored).toContain('command = "old-help"');
		expect(restored).toContain('command = "old-panel"');
		expect(restored).toContain('command = "lazygit"');
		expect(restored).not.toContain('oullin.tmux-keybindings.toggle');
	});

	it('is idempotent and restores only plugin-owned values', () => {
		const source = ['[keys]', 'prefix = "ctrl+a"', 'settings = "prefix+s"', '', '[[keys.command]]', 'key = "prefix+/"', 'type = "shell"', 'command = "old-panel"', ''].join('\n');

		const first = editor.apply(source, '/config.toml');
		const second = editor.apply(first.content, '/config.toml');

		expect(second.content).toBe(first.content);

		const customised = first.content.replace('settings = "prefix+s"', 'settings = "ctrl+s"');
		const restored = editor.restore(customised, first.snapshot);

		expect(restored).toBe(source.replace('settings = "prefix+s"', 'settings = "ctrl+s"'));
	});

	it('upgrades version-one snapshots without losing first-install state', () => {
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

		const discovered = editor.apply(['[[keys.command]]', 'key = "prefix+/"', 'type = "shell"', 'command = "slash-help"', ''].join('\n'), '/config.toml').snapshot;
		const merged = editor.mergeSnapshots(saved, discovered);

		expect(merged).toEqual({
			...saved,
			version: 2,
			displacedCommands: [
				{ line: 4, text: legacyHelp },
				{ line: 0, text: ['[[keys.command]]', 'key = "prefix+/"', 'type = "shell"', 'command = "slash-help"', ''].join('\n') },
			],
		});

		const restored = editor.restore(editor.apply('', '/config.toml').content, saved);

		expect(restored).toContain('command = "old-help"');
		expect(restored).not.toContain('oullin.tmux-keybindings.toggle');
	});
});
