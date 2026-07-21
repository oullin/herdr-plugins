import { HerdrCommandError } from '#herdr-plugin-core/errors';
import type { HerdrCliTransport } from '#herdr-plugin-core/herdr-cli/transport';
import { isJsonObject } from '#herdr-plugin-core/json';
import type { Pane, PaneTitleUpdate, PluginPaneOptions } from '#herdr-plugin-core/models';
import type { PaneClient } from '#herdr-plugin-core/ports';

export class HerdrPaneClient implements PaneClient {
	private readonly transport: HerdrCliTransport;

	constructor(transport: HerdrCliTransport) {
		this.transport = transport;
	}

	listPanes(workspaceId?: string): readonly Pane[] {
		const panes = this.transport.call(['pane', 'list', ...(workspaceId === undefined ? [] : ['--workspace', workspaceId])])['panes'];

		if (!Array.isArray(panes)) {
			throw new HerdrCommandError('Herdr did not return a pane list');
		}

		return panes.map((pane) => this.parse(pane));
	}

	getPane(paneId: string): Pane | undefined {
		const args = ['pane', 'get', paneId];

		try {
			return this.parse(this.transport.call(args)['pane']);
		} catch (error) {
			const commandError = error as HerdrCommandError;

			if (commandError.code === 'pane_not_found') {
				return undefined;
			}

			throw error;
		}
	}

	reportPaneTitle(paneId: string, update: PaneTitleUpdate): void {
		this.transport.run(['pane', 'report-metadata', paneId, '--source', update.source, ...('title' in update ? ['--title', update.title] : ['--clear-title'])]);
	}

	openPluginPane(options: PluginPaneOptions): Pane {
		const args = [
			'plugin',
			'pane',
			'open',
			'--plugin',
			options.pluginId,
			'--entrypoint',
			options.entrypoint,
			'--placement',
			options.placement ?? 'split',
			'--target-pane',
			options.targetPaneId,
			'--direction',
			options.direction ?? 'right',
			...(options.focus === true ? [] : ['--no-focus']),
		];

		const pluginPane = this.transport.call(args)['plugin_pane'];

		if (!isJsonObject(pluginPane)) {
			throw new HerdrCommandError('Herdr did not return the opened plugin pane');
		}

		return this.parse(pluginPane['pane']);
	}

	closePluginPane(paneId: string): boolean {
		const result = this.transport.execute(['plugin', 'pane', 'close', paneId]);

		return !result.error && result.status === 0;
	}

	private parse(value: unknown): Pane {
		if (!isJsonObject(value) || typeof value['pane_id'] !== 'string' || typeof value['tab_id'] !== 'string' || typeof value['workspace_id'] !== 'string') {
			throw new HerdrCommandError('Herdr returned an invalid pane');
		}

		return {
			pane_id: value['pane_id'],
			tab_id: value['tab_id'],
			workspace_id: value['workspace_id'],
		};
	}
}
