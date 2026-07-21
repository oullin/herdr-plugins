import { describe, expect, it } from 'vite-plus/test';

import { HerdrCliClient, HerdrCommandError } from '@oullin/herdr-plugin-core';
import { HerdrTabClient } from '@oullin/herdr-plugin-core/herdr-cli/tabs';
import { HerdrCliTransport } from '@oullin/herdr-plugin-core/herdr-cli/transport';
import { StubCommandRunner } from '@oullin/herdr-plugin-core/testing';

describe('HerdrCliClient', () => {
	it('exposes independently composable concern clients', () => {
		const runner = new StubCommandRunner({
			error: undefined,
			status: 0,
			stdout: JSON.stringify({ result: { tab: { tab_id: 't1', workspace_id: 'w1', label: 'one', number: 1 } } }),
			stderr: '',
		});

		const transport = new HerdrCliTransport('/mock/herdr', runner);
		const tabs = new HerdrTabClient(transport);

		expect(
			tabs.getTab('t1'),
		).toEqual({ tab_id: 't1', workspace_id: 'w1', label: 'one', number: 1 });
		expect(runner.calls[0]?.args).toEqual(['tab', 'get', 't1']);
	});

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

	it('lists panes and owns source-scoped pane title metadata', () => {
		const runner = new StubCommandRunner(
			{
				error: undefined,
				status: 0,
				stdout: JSON.stringify({ result: { panes: [{ pane_id: 'p1', tab_id: 't1', workspace_id: 'w1' }] } }),
				stderr: '',
			},
			{
				error: undefined,
				status: 0,
				stdout: '',
				stderr: '',
			},
			{
				error: undefined,
				status: 0,
				stdout: '',
				stderr: '',
			},
		);

		const client = new HerdrCliClient('/mock/herdr', runner);

		expect(
			client.listPanes('w1'),
		).toEqual([{ pane_id: 'p1', tab_id: 't1', workspace_id: 'w1' }]);

		client.reportPaneTitle('p1', { source: 'example.hints', title: 'Ctrl+B arrows' });
		client.reportPaneTitle('p1', { source: 'example.hints', clearTitle: true });

		expect(
			runner.calls.map(({ args }) => args),
		).toEqual([
			['pane', 'list', '--workspace', 'w1'],
			['pane', 'report-metadata', 'p1', '--source', 'example.hints', '--title', 'Ctrl+B arrows'],
			['pane', 'report-metadata', 'p1', '--source', 'example.hints', '--clear-title'],
		]);
	});

	it('gets a pane through the shared transport', () => {
		const runner = new StubCommandRunner({
			error: undefined,
			status: 0,
			stdout: JSON.stringify({ result: { pane: { pane_id: 'p1', tab_id: 't1', workspace_id: 'w1' } } }),
			stderr: '',
		});

		const client = new HerdrCliClient('/mock/herdr', runner);

		expect(
			client.getPane('p1'),
		).toEqual({ pane_id: 'p1', tab_id: 't1', workspace_id: 'w1' });
		expect(runner.calls[0]?.args).toEqual(['pane', 'get', 'p1']);
	});

	it('returns undefined when a pane is not found', () => {
		const runner = new StubCommandRunner({
			error: undefined,
			status: 1,
			stdout: '',
			stderr: JSON.stringify({ error: { code: 'pane_not_found', message: 'missing pane' } }),
		});

		const client = new HerdrCliClient('/mock/herdr', runner);

		expect(
			client.getPane('missing'),
		).toBeUndefined();
		expect(runner.calls[0]?.args).toEqual(['pane', 'get', 'missing']);
	});

	it('preserves structured errors from pane lookups', () => {
		const runner = new StubCommandRunner({
			error: undefined,
			status: 1,
			stdout: '',
			stderr: JSON.stringify({ error: { code: 'server_unavailable', message: 'server unavailable' } }),
		});

		const client = new HerdrCliClient('/mock/herdr', runner);

		try {
			client.getPane('p1');
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(HerdrCommandError);
			expect((error as HerdrCommandError).code).toBe('server_unavailable');
		}

		expect(runner.calls[0]?.args).toEqual(['pane', 'get', 'p1']);
	});

	it('preserves command-runner errors from pane lookups', () => {
		const processError = new Error('spawn failed');

		const runner = new StubCommandRunner({
			error: processError,
			status: null,
			stdout: '',
			stderr: '',
		});

		const client = new HerdrCliClient('/mock/herdr', runner);

		try {
			client.getPane('p1');
			expect.unreachable();
		} catch (error) {
			expect(error).toBeInstanceOf(HerdrCommandError);
			expect((error as HerdrCommandError).cause).toBe(processError);
		}

		expect(runner.calls[0]?.args).toEqual(['pane', 'get', 'p1']);
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
