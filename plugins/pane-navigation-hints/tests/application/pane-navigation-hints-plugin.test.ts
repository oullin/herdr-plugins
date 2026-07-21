import { describe, expect, it } from 'vite-plus/test';

import { PaneNavigationHintSynchroniser } from '#pane-navigation-hints/application/pane-navigation-hint-synchroniser';
import { PaneNavigationHintsPlugin } from '#pane-navigation-hints/application/pane-navigation-hints-plugin';
import { NavigationHintFormatter } from '#pane-navigation-hints/domain/navigation-hint-formatter';
import { FakeHerdrClient, FakeKeybindingConfiguration, panes } from '#pane-navigation-hints/testing/support/fakes';

describe('PaneNavigationHintsPlugin', () => {
	function plugin(): PaneNavigationHintsPlugin {
		return new PaneNavigationHintsPlugin(new PaneNavigationHintSynchroniser(new FakeHerdrClient(panes), new FakeKeybindingConfiguration(), new NavigationHintFormatter()));
	}

	it('dispatches refresh and clear actions', () => {
		expect(
			plugin().run('refresh'),
		).toEqual({ operation: 'refreshed', panes: 2 });
		expect(
			plugin().run('clear'),
		).toEqual({ operation: 'cleared', panes: 2 });
	});

	it('reads the pane id from a pane-created event', () => {
		expect(
			plugin().run('pane-created', {
					HERDR_PLUGIN_EVENT: 'pane.created',
					HERDR_PANE_ID: 'w1:p2',
				}),
		).toEqual({ operation: 'refreshed', panes: 1 });
	});

	it('rejects missing or unexpected event context', () => {
		expect(() => plugin().run('pane-created', { HERDR_PLUGIN_EVENT: 'pane.closed', HERDR_PANE_ID: 'w1:p2' })).toThrowError('Expected pane.created event');
		expect(() => plugin().run('pane-created', { HERDR_PLUGIN_EVENT: 'pane.created' })).toThrowError('pane.created did not include a pane id');
	});

	it('rejects unknown commands', () => {
		expect(() => plugin().run('unknown')).toThrowError('Unknown pane-navigation-hints command: unknown');
	});
});
