import { describe, expect, it } from 'vite-plus/test';

import { PanelCloseShortcut } from '#tmux-keybindings/presentation/panel-close-shortcut';

describe('PanelCloseShortcut', () => {
	it('closes when Ctrl+B and Q arrive together', () => {
		expect(
			new PanelCloseShortcut().accept(Uint8Array.from([0x02, 0x71])),
		).toBe(true);
	});

	it('remembers Ctrl+B across input chunks', () => {
		const shortcut = new PanelCloseShortcut();

		expect(
			shortcut.accept(Uint8Array.from([0x02])),
		).toBe(false);
		expect(
			shortcut.accept(Uint8Array.from([0x51])),
		).toBe(true);
	});

	it('ignores unrelated keys after the prefix', () => {
		const shortcut = new PanelCloseShortcut();

		expect(
			shortcut.accept(Uint8Array.from([0x02, 0x78, 0x71])),
		).toBe(false);
	});

	it('also closes a modal dialog with Escape', () => {
		expect(
			new PanelCloseShortcut().accept(Uint8Array.from([0x1b])),
		).toBe(true);
	});
});
