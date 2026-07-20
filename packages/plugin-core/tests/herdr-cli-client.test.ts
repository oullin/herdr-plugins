import { describe, expect, it } from 'vite-plus/test';

import { HerdrCliClient, HerdrCommandError } from '@oullin/herdr-plugin-core';
import { StubCommandRunner } from '@oullin/herdr-plugin-core/testing';

describe('HerdrCliClient', () => {
	it('decodes workspaces, tabs, and plugin panes through one transport', () => {
		const runner = new StubCommandRunner(
			{
				error: undefined,
				status: 0,
				stdout: JSON.stringify({ result: { workspaces: [{ workspace_id: 'w1' }] } }),
				stderr: '',
			},
			{
				error: undefined,
				status: 0,
				stdout: JSON.stringify({ result: { tabs: [{ tab_id: 't1', workspace_id: 'w1', label: 'one', number: 1 }] } }),
				stderr: '',
			},
			{
				error: undefined,
				status: 0,
				stdout: JSON.stringify({ result: { plugin_pane: { pane: { pane_id: 'p2', tab_id: 't1', workspace_id: 'w1' } } } }),
				stderr: '',
			},
		);

		const client = new HerdrCliClient('/mock/herdr', runner);

		expect(
			client.listWorkspaces(),
		).toEqual([{ workspace_id: 'w1' }]);
		expect(
			client.listTabs('w1'),
		).toEqual([{ tab_id: 't1', workspace_id: 'w1', label: 'one', number: 1 }]);
		expect(
			client.openPluginPane({ pluginId: 'example.plugin', entrypoint: 'panel', targetPaneId: 'p1' }),
		).toEqual({ pane_id: 'p2', tab_id: 't1', workspace_id: 'w1' });
		expect(runner.calls[2]?.args).toEqual([
			'plugin',
			'pane',
			'open',
			'--plugin',
			'example.plugin',
			'--entrypoint',
			'panel',
			'--placement',
			'split',
			'--target-pane',
			'p1',
			'--direction',
			'right',
			'--no-focus',
		]);
	});

	it('preserves structured Herdr error codes', () => {
		const runner = new StubCommandRunner({
			error: undefined,
			status: 1,
			stdout: '',
			stderr: JSON.stringify({ error: { code: 'tab_not_found', message: 'missing tab' } }),
		});

		const client = new HerdrCliClient('/mock/herdr', runner);

		try {
			client.getTab('missing');
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(HerdrCommandError);
			expect((error as HerdrCommandError).code).toBe('tab_not_found');
		}
	});
});
