import { HerdrCommandError } from '#herdr-plugin-core/errors';
import type { HerdrCliTransport } from '#herdr-plugin-core/herdr-cli/transport';
import { isJsonObject } from '#herdr-plugin-core/json';
import type { Pane, PluginPaneOptions } from '#herdr-plugin-core/models';
import type { PaneClient } from '#herdr-plugin-core/ports';

export class HerdrPaneClient implements PaneClient {
	private readonly transport: HerdrCliTransport;

	constructor(transport: HerdrCliTransport) {
		this.transport = transport;
	}

	getPane(paneId: string): Pane | undefined {
		const args = ['pane', 'get', paneId];
		const result = this.transport.execute(args);

		if (result.error || result.status !== 0) {
			return undefined;
		}

		return this.parse(this.transport.decodeResult(result.stdout, args)['pane']);
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
