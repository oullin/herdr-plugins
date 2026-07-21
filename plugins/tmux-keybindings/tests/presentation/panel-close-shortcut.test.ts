import { describe, expect, it } from 'vite-plus/test';

import { PanelCloseShortcut } from '#tmux-keybindings/presentation/panel-close-shortcut';

describe('PanelCloseShortcut', () => {
	const shortcut = new PanelCloseShortcut();

	it('closes for the exact supported input sequences', () => {
		expect(
			shortcut.accept(Uint8Array.from([0x1b])),
		).toBe(true);
		expect(
			shortcut.accept(Uint8Array.from([0x03])),
		).toBe(true);
		expect(
			shortcut.accept(Uint8Array.from([0x1b, 0x74])),
		).toBe(true);
	});

	it('rejects terminal arrow sequences', () => {
		expect(
			shortcut.accept(Uint8Array.from([0x1b, 0x5b, 0x41])),
		).toBe(false);
	});

	it('rejects unrelated Alt and plain input sequences', () => {
		expect(
			shortcut.accept(Uint8Array.from([0x1b, 0x78])),
		).toBe(false);
		expect(
			shortcut.accept(Uint8Array.from([0x74])),
		).toBe(false);
	});
});
