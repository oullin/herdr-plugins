import { describe, expect, it } from 'vite-plus/test';

import { PanelCloseShortcut } from '#tmux-keybindings/presentation/panel-close-shortcut';

describe('PanelCloseShortcut', () => {
	it('closes when Option+Command+T arrives as a legacy alt sequence', () => {
		expect(
			new PanelCloseShortcut().accept(Uint8Array.from([0x1b, 0x74])),
		).toBe(true);
	});

	it('ignores plain input', () => {
		expect(
			new PanelCloseShortcut().accept(Uint8Array.from([0x74])),
		).toBe(false);
	});

	it('also closes a modal dialog with Escape', () => {
		expect(
			new PanelCloseShortcut().accept(Uint8Array.from([0x1b])),
		).toBe(true);
	});
});
