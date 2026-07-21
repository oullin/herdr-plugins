import type { HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
import type { Environment } from '#tmux-keybindings/domain/models';
import { PluginError } from '#tmux-keybindings/errors/plugin-error';
import { PluginContext } from '@oullin/herdr-plugin-core';

export type ToggleResult = 'opened';

export class PanelToggle {
	private readonly client: HerdrClientPort;

	constructor(client: HerdrClientPort) {
		this.client = client;
	}

	toggle(environment: Environment = process.env): ToggleResult {
		const context = new PluginContext(environment);
		const activePaneId = context.paneId();

		if (!activePaneId) {
			throw new PluginError('The keybinding dialog requires an active pane');
		}

		this.client.openBindingsPopup();

		return 'opened';
	}
}
