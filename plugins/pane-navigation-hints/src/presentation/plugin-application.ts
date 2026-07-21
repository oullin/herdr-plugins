import type { PaneNavigationHintsPlugin } from '#pane-navigation-hints/application/pane-navigation-hints-plugin';
import type { Environment } from '#pane-navigation-hints/domain/models';
import { executePlugin } from '@oullin/herdr-plugin-core';

export class PluginApplication {
	private readonly plugin: PaneNavigationHintsPlugin;

	constructor(plugin: PaneNavigationHintsPlugin) {
		this.plugin = plugin;
	}

	run(command: string | undefined, environment: Environment = process.env): void {
		executePlugin(
			() => this.plugin.run(command, environment),
			{
				failurePrefix: 'Pane navigation hints failed',
				successMessage: (result) => `Pane navigation hints ${result.operation} (${result.panes} panes)`,
			},
		);
	}
}
