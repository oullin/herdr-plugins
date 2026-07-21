import type { PaneNavigationHintSynchroniser } from '#pane-navigation-hints/application/pane-navigation-hint-synchroniser';
import type { Environment, PaneHintResult } from '#pane-navigation-hints/domain/models';
import { PluginError } from '#pane-navigation-hints/errors/plugin-error';
import { PluginContext } from '@oullin/herdr-plugin-core';

export type PaneNavigationHintsCommand = 'clear' | 'pane-created' | 'refresh';

export class PaneNavigationHintsPlugin {
	private readonly synchroniser: PaneNavigationHintSynchroniser;

	constructor(synchroniser: PaneNavigationHintSynchroniser) {
		this.synchroniser = synchroniser;
	}

	run(command: string | undefined, environment: Environment = process.env): PaneHintResult {
		switch (command) {
			case 'refresh':
				return { operation: 'refreshed', panes: this.synchroniser.refreshAll(environment) };

			case 'clear':
				return { operation: 'cleared', panes: this.synchroniser.clearAll() };

			case 'pane-created': {
				const context = new PluginContext(environment);

				if (context.event !== 'pane.created') {
					throw new PluginError(`Expected pane.created event, received ${context.event ?? '(missing)'}`);
				}

				const paneId = context.paneId();

				if (!paneId) {
					throw new PluginError('pane.created did not include a pane id');
				}

				return { operation: 'refreshed', panes: this.synchroniser.refreshPane(paneId, environment) };
			}

			default:
				throw new PluginError(`Unknown pane-navigation-hints command: ${command ?? '(missing)'}`);
		}
	}
}
