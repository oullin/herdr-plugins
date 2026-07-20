import type { HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
import type { StateRepositoryPort } from '#tmux-keybindings/application/ports/state-repository-port';
import type { Environment } from '#tmux-keybindings/domain/models';
import { PluginError } from '#tmux-keybindings/errors/plugin-error';
import { PluginContext } from '@oullin/herdr-plugin-core';

export type ToggleResult = 'opened' | 'closed';

export class PanelToggle {
	private readonly client: HerdrClientPort;
	private readonly state: StateRepositoryPort;

	constructor(client: HerdrClientPort, state: StateRepositoryPort) {
		this.client = client;
		this.state = state;
	}

	toggle(environment: Environment = process.env): ToggleResult {
		const context = new PluginContext(environment);
		const workspaceId = context.workspaceId();
		const tabId = context.tabId();
		const activePaneId = context.paneId();

		if (!workspaceId || !tabId || !activePaneId) {
			throw new PluginError('The keybinding panel requires an active workspace, tab, and pane');
		}

		const trackedPaneId = this.state.getTrackedPane(workspaceId, tabId);

		if (trackedPaneId) {
			const pane = this.client.getPane(trackedPaneId);

			if (pane && pane.workspace_id === workspaceId && pane.tab_id === tabId && this.client.closePluginPane(trackedPaneId)) {
				this.state.deleteTrackedPane(workspaceId, tabId);

				return 'closed';
			}

			this.state.deleteTrackedPane(workspaceId, tabId);
		}

		const pane = this.client.openBindingsPane(activePaneId);

		if (pane.workspace_id !== workspaceId || pane.tab_id !== tabId) {
			throw new PluginError('Herdr opened the keybinding panel outside the active tab');
		}

		this.state.setTrackedPane(workspaceId, tabId, pane.pane_id);

		return 'opened';
	}
}
