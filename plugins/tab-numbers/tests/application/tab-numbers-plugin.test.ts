import { describe, expect, it } from 'vite-plus/test';

import { TabNumberSynchronizer } from '../../src/application/tab-number-synchronizer.ts';
import { TabNumbersPlugin } from '../../src/application/tab-numbers-plugin.ts';
import type { Tab } from '../../src/domain/models.ts';
import { HerdrCommandError } from '../../src/errors/herdr-command-error.ts';
import { FakeHerdrClient } from '../support/fake-herdr-client.ts';

class MissingTabClient extends FakeHerdrClient {
	override getTab(): Tab {
		throw new HerdrCommandError('tab is gone', { code: 'tab_not_found' });
	}
}

describe('TabNumbersPlugin', () => {
	it.each(['tab.created', 'tab.renamed'])('updates only the affected tab for %s', (event) => {
		const selectedTab: Tab = { tab_id: 'w1:t7', workspace_id: 'w1', label: 'new label', number: 7 };

		const tabs: readonly Tab[] = [
			{ tab_id: 'w1:t1', workspace_id: 'w1', label: 'skills · 1', number: 1 },
			{ tab_id: 'w1:t5', workspace_id: 'w1', label: 'gocanto.sh · 2', number: 5 },
			selectedTab,
		];

		const client = new FakeHerdrClient({
			selectedTab,
			tabsByWorkspace: new Map([['w1', tabs]]),
		});

		const plugin = new TabNumbersPlugin(new TabNumberSynchronizer(client));

		expect(
			plugin.run({ HERDR_PLUGIN_EVENT: event, HERDR_TAB_ID: 'w1:t7' }),
		).toBe(1);
		expect(client.requestedTabs).toEqual(['w1:t7']);
		expect(client.requestedWorkspaces).toEqual(['w1']);
		expect(client.listWorkspaceCalls).toBe(0);
		expect(client.renameCalls).toEqual([['w1:t7', 'new label · 3']]);
	});

	it.each(['tab.closed', 'tab.moved'])('reindexes the affected workspace for %s', (event) => {
		const client = new FakeHerdrClient({
			tabsByWorkspace: new Map([
				[
					'w1',
					[
						{ tab_id: 'w1:t1', workspace_id: 'w1', label: 'skills · 1', number: 1 },
						{ tab_id: 'w1:t5', workspace_id: 'w1', label: 'gocanto.sh · 5', number: 5 },
						{ tab_id: 'w1:t7', workspace_id: 'w1', label: 'oullin-web · 7', number: 7 },
					],
				],
			]),
		});

		const plugin = new TabNumbersPlugin(new TabNumberSynchronizer(client));

		expect(
			plugin.run({ HERDR_PLUGIN_EVENT: event, HERDR_WORKSPACE_ID: 'w1' }),
		).toBe(2);
		expect(client.requestedTabs).toEqual([]);
		expect(client.requestedWorkspaces).toEqual(['w1']);
		expect(client.renameCalls).toEqual([
			['w1:t5', 'gocanto.sh · 2'],
			['w1:t7', 'oullin-web · 3'],
		]);
	});

	it('treats a tab closed before its queued hook runs as a no-op', () => {
		const client = new MissingTabClient();
		const plugin = new TabNumbersPlugin(new TabNumberSynchronizer(client));

		expect(
			plugin.run({ HERDR_PLUGIN_EVENT: 'tab.renamed', HERDR_TAB_ID: 'w1:t8' }),
		).toBe(0);
	});

	it('reports malformed event JSON when no tab context is available', () => {
		const plugin = new TabNumbersPlugin(new TabNumberSynchronizer(new FakeHerdrClient()));

		expect(() => plugin.run({ HERDR_PLUGIN_EVENT: 'tab.created', HERDR_PLUGIN_EVENT_JSON: '{not-json' })).toThrowError('HERDR_PLUGIN_EVENT_JSON contains malformed JSON');
	});
});
