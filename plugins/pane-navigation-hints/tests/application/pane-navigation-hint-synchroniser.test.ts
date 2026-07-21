import { describe, expect, it } from 'vite-plus/test';

import { PANE_TITLE_SOURCE, PaneNavigationHintSynchroniser } from '#pane-navigation-hints/application/pane-navigation-hint-synchroniser';
import { NavigationHintFormatter } from '#pane-navigation-hints/domain/navigation-hint-formatter';
import { FakeHerdrClient, FakeKeybindingConfiguration, panes } from '#pane-navigation-hints/testing/support/fakes';

describe('PaneNavigationHintSynchroniser', () => {
	it('validates the active config and refreshes every existing pane', () => {
		const client = new FakeHerdrClient(panes);
		const configuration = new FakeKeybindingConfiguration();
		const synchroniser = new PaneNavigationHintSynchroniser(client, configuration, new NavigationHintFormatter());

		expect(
			synchroniser.refreshAll({ HERDR_CONFIG_PATH: '/config/herdr/config.toml' }),
		).toBe(2);
		expect(client.validatedConfigPaths).toEqual(['/config/herdr/config.toml']);
		expect(client.reports).toEqual([
			{
				paneId: 'w1:p1',
				update: { source: PANE_TITLE_SOURCE, title: 'Ctrl+B then: Focus ←/↓/↑/→ h/j/k/l · Cycle next/prev Tab/Shift+Tab' },
			},
			{
				paneId: 'w1:p2',
				update: { source: PANE_TITLE_SOURCE, title: 'Ctrl+B then: Focus ←/↓/↑/→ h/j/k/l · Cycle next/prev Tab/Shift+Tab' },
			},
		]);
	});

	it('refreshes only the pane named by a pane-created hook', () => {
		const client = new FakeHerdrClient(panes);
		const synchroniser = new PaneNavigationHintSynchroniser(client, new FakeKeybindingConfiguration(), new NavigationHintFormatter());

		expect(
			synchroniser.refreshPane('w1:p2'),
		).toBe(1);
		expect(
			client.reports.map(({ paneId }) => paneId),
		).toEqual(['w1:p2']);
	});

	it('ignores a pane that closed before its hook ran', () => {
		const client = new FakeHerdrClient(panes);
		const configuration = new FakeKeybindingConfiguration();
		const synchroniser = new PaneNavigationHintSynchroniser(client, configuration, new NavigationHintFormatter());

		expect(
			synchroniser.refreshPane('w1:missing'),
		).toBe(0);
		expect(configuration.environments).toEqual([]);
		expect(client.reports).toEqual([]);
	});

	it('clears only this plugin source from every existing pane', () => {
		const client = new FakeHerdrClient(panes);
		const synchroniser = new PaneNavigationHintSynchroniser(client, new FakeKeybindingConfiguration(), new NavigationHintFormatter());

		expect(
			synchroniser.clearAll(),
		).toBe(2);
		expect(client.validatedConfigPaths).toEqual([]);
		expect(client.reports).toEqual([
			{ paneId: 'w1:p1', update: { source: PANE_TITLE_SOURCE, clearTitle: true } },
			{ paneId: 'w1:p2', update: { source: PANE_TITLE_SOURCE, clearTitle: true } },
		]);
	});
});
