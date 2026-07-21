import { describe, expect, it } from 'vite-plus/test';

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

	it('inserts a keys section and deduplicates the managed custom command', () => {
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
				line: 23,
				text: ['[[keys.command]]', 'key = "prefix+l"', 'type = "plugin_action"', 'command = "oullin.tmux-keybindings.toggle"', ''].join('\n'),
			},
			{
				line: 28,
				text: ['[[keys.command]]', 'key = "alt+super+t"', 'type = "popup"', 'command = "lazygit"', ''].join('\n'),
			},
		]);
		expect(
			editor.restore(edit.content, edit.snapshot),
		).toBe(source);
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
});
