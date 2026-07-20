import { describe, expect, it } from 'vite-plus/test';

import { PanelToggle } from '#tmux-keybindings/application/panel-toggle';
import { FakeHerdrClient, FakeStateRepository } from '#tmux-keybindings/testing/support/fakes';

describe('PanelToggle', () => {
	const environment = { HERDR_WORKSPACE_ID: 'w1', HERDR_TAB_ID: 'w1:t1', HERDR_PANE_ID: 'w1:p1' };

	it('opens a right-side non-focused plugin pane and tracks it per tab', () => {
		const client = new FakeHerdrClient();
		const state = new FakeStateRepository();
		const toggle = new PanelToggle(client, state);

		expect(
			toggle.toggle(environment),
		).toBe('opened');
		expect(client.openedTargetPaneIds).toEqual(['w1:p1']);
		expect(
			state.getTrackedPane('w1', 'w1:t1'),
		).toBe('w1:p-panel');
	});

	it('closes a tracked pane only in its workspace and tab', () => {
		const client = new FakeHerdrClient();
		const state = new FakeStateRepository();

		client.panes.set('w1:p-panel', client.openedPane);
		state.setTrackedPane('w1', 'w1:t1', 'w1:p-panel');

		expect(
			new PanelToggle(client, state).toggle(environment),
		).toBe('closed');
		expect(client.closedPaneIds).toEqual(['w1:p-panel']);
		expect(
			state.getTrackedPane('w1', 'w1:t1'),
		).toBeUndefined();
	});

	it('recovers when a tracked pane was closed manually', () => {
		const client = new FakeHerdrClient();
		const state = new FakeStateRepository();

		state.setTrackedPane('w1', 'w1:t1', 'w1:p-stale');

		expect(
			new PanelToggle(client, state).toggle(environment),
		).toBe('opened');
		expect(client.closedPaneIds).toEqual([]);
		expect(
			state.getTrackedPane('w1', 'w1:t1'),
		).toBe('w1:p-panel');
	});

	it('recovers when a stale id now belongs to a normal pane', () => {
		const client = new FakeHerdrClient();
		const state = new FakeStateRepository();

		client.panes.set('w1:p-stale', { pane_id: 'w1:p-stale', tab_id: 'w1:t1', workspace_id: 'w1' });
		client.closeResult = false;
		state.setTrackedPane('w1', 'w1:t1', 'w1:p-stale');

		expect(
			new PanelToggle(client, state).toggle(environment),
		).toBe('opened');
		expect(
			state.getTrackedPane('w1', 'w1:t1'),
		).toBe('w1:p-panel');
	});

	it('keeps tracking independent between tabs', () => {
		const client = new FakeHerdrClient();
		const state = new FakeStateRepository();

		state.setTrackedPane('w1', 'w1:t2', 'w1:p-other-panel');

		new PanelToggle(client, state).toggle(environment);

		expect(
			state.getTrackedPane('w1', 'w1:t1'),
		).toBe('w1:p-panel');
		expect(
			state.getTrackedPane('w1', 'w1:t2'),
		).toBe('w1:p-other-panel');
	});
});
