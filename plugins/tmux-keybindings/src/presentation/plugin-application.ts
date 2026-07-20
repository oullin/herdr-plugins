import type { ConfigurationManager } from '#tmux-keybindings/application/configuration-manager';
import type { PanelToggle } from '#tmux-keybindings/application/panel-toggle';
import type { Environment } from '#tmux-keybindings/domain/models';
import { PluginError } from '#tmux-keybindings/errors/plugin-error';
import { executePlugin } from '@oullin/herdr-plugin-core';

export class PluginApplication {
	private readonly configuration: ConfigurationManager;
	private readonly panelToggle: PanelToggle;

	constructor(configuration: ConfigurationManager, panelToggle: PanelToggle) {
		this.configuration = configuration;
		this.panelToggle = panelToggle;
	}

	run(action: string | undefined, environment: Environment = process.env, automatic = false): void {
		executePlugin(
			() => {
					switch (action) {
						case 'apply': {
							return `Tmux keybindings: ${this.configuration.apply(environment, automatic)}`;
						}

						case 'restore': {
							return `Tmux keybindings: ${this.configuration.restore(environment)}`;
						}

						case 'toggle': {
							return `Tmux keybinding panel: ${this.panelToggle.toggle(environment)}`;
						}

						default:
							throw new PluginError(`Unknown tmux-keybindings action: ${action ?? '(missing)'}`);
					}
				},
			{
					failurePrefix: 'Tmux keybindings failed',
					successMessage: (message) => message,
				},
		);
	}
}
