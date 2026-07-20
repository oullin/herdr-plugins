import type { ConfigurationManager } from '#tmux-keybindings/application/configuration-manager';
import type { PanelToggle } from '#tmux-keybindings/application/panel-toggle';
import type { Environment } from '#tmux-keybindings/domain/models';
import { PluginError } from '#tmux-keybindings/errors/plugin-error';

export class PluginApplication {
	private readonly configuration: ConfigurationManager;
	private readonly panelToggle: PanelToggle;

	constructor(configuration: ConfigurationManager, panelToggle: PanelToggle) {
		this.configuration = configuration;
		this.panelToggle = panelToggle;
	}

	run(action: string | undefined, environment: Environment = process.env, automatic = false): void {
		try {
			switch (action) {
				case 'apply': {
					const result = this.configuration.apply(environment, automatic);

					process.stdout.write(`Tmux keybindings: ${result}\n`);
					break;
				}

				case 'restore': {
					const result = this.configuration.restore(environment);

					process.stdout.write(`Tmux keybindings: ${result}\n`);
					break;
				}

				case 'toggle': {
					const result = this.panelToggle.toggle(environment);

					process.stdout.write(`Tmux keybinding panel: ${result}\n`);
					break;
				}

				default:
					throw new PluginError(`Unknown tmux-keybindings action: ${action ?? '(missing)'}`);
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);

			process.stderr.write(`Tmux keybindings failed: ${message}\n`);
			process.exitCode = 1;
		}
	}
}
