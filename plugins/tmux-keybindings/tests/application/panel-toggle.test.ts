import { describe, expect, it } from 'vite-plus/test';

import { PanelToggle } from '#tmux-keybindings/application/panel-toggle';
import { FakeHerdrClient } from '#tmux-keybindings/testing/support/fakes';

describe('PanelToggle', () => {
	it('opens a modal popup for the active pane', () => {
		const client = new FakeHerdrClient();

		expect(
			new PanelToggle(client).toggle({ HERDR_PANE_ID: 'w1:p1' }),
		).toBe('opened');
		expect(client.popupOpenCalls).toBe(1);
	});

	it('requires an active pane', () => {
		expect(() => new PanelToggle(new FakeHerdrClient()).toggle({})).toThrowError('The keybinding dialog requires an active pane');
	});
});
