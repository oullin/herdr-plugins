import { describe, expect, it } from 'vite-plus/test';

import { HerdrCommandError, PluginContext } from '@oullin/herdr-plugin-core';

describe('PluginContext', () => {
	it('prefers injected identifiers and falls back to event entities', () => {
		const context = new PluginContext({
			HERDR_TAB_ID: 'direct-tab',
			HERDR_PLUGIN_EVENT_JSON: JSON.stringify({
				data: {
					pane: { pane_id: 'event-pane', tab_id: 'event-tab', workspace_id: 'event-workspace' },
				},
			}),
		});

		expect(
			context.tabId(),
		).toBe('direct-tab');
		expect(
			context.paneId(),
		).toBe('event-pane');
		expect(
			context.workspaceId(),
		).toBe('event-workspace');
	});

	it('rejects malformed event JSON when fallback data is needed', () => {
		const context = new PluginContext({ HERDR_PLUGIN_EVENT_JSON: '{bad' });

		expect(() => context.tabId()).toThrowError(new HerdrCommandError('HERDR_PLUGIN_EVENT_JSON contains malformed JSON'));
	});

	it('caches event data across identifier lookups', () => {
		const environment: Record<string, string | undefined> = {
			HERDR_PLUGIN_EVENT_JSON: JSON.stringify({ data: { workspace_id: 'w1', tab_id: 't1' } }),
		};

		const context = new PluginContext(environment);

		expect(
			context.workspaceId(),
		).toBe('w1');

		environment['HERDR_PLUGIN_EVENT_JSON'] = '{changed-after-first-read';

		expect(
			context.tabId(),
		).toBe('t1');
	});
});
