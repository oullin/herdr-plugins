import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_PANE_NAVIGATION_BINDINGS } from '#pane-navigation-hints/domain/default-keybindings';
import { KeybindingConfigParser } from '#pane-navigation-hints/infrastructure/keybinding-config-parser';

describe('KeybindingConfigParser', () => {
	const parser = new KeybindingConfigParser();

	it('returns Herdr 0.7.4 defaults when the keys section is absent', () => {
		expect(
			parser.parse('[ui]\npane_borders = true\n'),
		).toEqual(DEFAULT_PANE_NAVIGATION_BINDINGS);
	});

	it('merges quoted overrides, preserves empty bindings, and ignores inline comments', () => {
		const bindings = parser.parse(
			[
				'[keys]',
				"prefix = 'ctrl+a' # literal string",
				'focus_pane_left = "prefix+left" # move left',
				'focus_pane_down = ""',
				'cycle_pane_next = "alt+n"',
				'last_pane = "prefix+semicolon"',
				'[ui]',
				'focus_pane_right = "not-in-keys"',
			].join('\n'),
		);

		expect(bindings).toEqual({
			...DEFAULT_PANE_NAVIGATION_BINDINGS,
			prefix: 'ctrl+a',
			focusPaneLeft: 'prefix+left',
			focusPaneDown: '',
			cyclePaneNext: 'alt+n',
			lastPane: 'prefix+semicolon',
		});
	});

	it('parses escaped basic strings and hash characters inside quotes', () => {
		const bindings = parser.parse(['[keys]', 'prefix = "ctrl+\\\\"', 'focus_pane_left = "ctrl+#" # comment'].join('\n'));

		expect(bindings.prefix).toBe('ctrl+\\');
		expect(bindings.focusPaneLeft).toBe('ctrl+#');
	});

	it('parses Windows line endings without retaining carriage returns', () => {
		const bindings = parser.parse(['[keys]', 'prefix = "ctrl+a"', 'focus_pane_left = "alt+h"', '[ui]', 'focus_pane_right = "not-in-keys"'].join('\r\n'));

		expect(bindings.prefix).toBe('ctrl+a');
		expect(bindings.focusPaneLeft).toBe('alt+h');
		expect(bindings.focusPaneRight).toBe(DEFAULT_PANE_NAVIGATION_BINDINGS.focusPaneRight);
	});

	it.each(['"', "'"])('rejects a lone %s quote as an unterminated value', (quote) => {
		expect(() => parser.parse(`[keys]\nprefix = ${quote}\n`)).toThrowError('[keys].prefix must be a quoted string');
	});

	it('rejects unquoted managed values', () => {
		expect(() => parser.parse('[keys]\nprefix = ctrl+b\n')).toThrowError('[keys].prefix must be a quoted string');
	});
});
