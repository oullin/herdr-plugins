import type { HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
import type { StateRepositoryPort } from '#tmux-keybindings/application/ports/state-repository-port';
import type { ConfigurationSnapshot, Pane } from '#tmux-keybindings/domain/models';

export class FakeHerdrClient implements HerdrClientPort {
	readonly closedPaneIds: string[] = [];
	readonly openedTargetPaneIds: string[] = [];
	readonly validatedPaths: string[] = [];
	reloadCalls = 0;
	validationError: Error | undefined;
	closeResult = true;
	openedPane: Pane = { pane_id: 'w1:p-panel', tab_id: 'w1:t1', workspace_id: 'w1' };
	panes = new Map<string, Pane>();

	validateConfig(configPath: string): void {
		this.validatedPaths.push(configPath);

		if (this.validationError) {
			throw this.validationError;
		}
	}

	reloadConfig(): void {
		this.reloadCalls += 1;
	}

	getPane(paneId: string): Pane | undefined {
		return this.panes.get(paneId);
	}

	openBindingsPane(targetPaneId: string): Pane {
		this.openedTargetPaneIds.push(targetPaneId);

		return this.openedPane;
	}

	closePluginPane(paneId: string): boolean {
		this.closedPaneIds.push(paneId);

		return this.closeResult;
	}
}

export class FakeStateRepository implements StateRepositoryPort {
	automaticApplyDisabled = false;
	readonly snapshots = new Map<string, ConfigurationSnapshot>();
	readonly panes = new Map<string, string>();

	loadConfigurationSnapshot(configPath: string): ConfigurationSnapshot | undefined {
		return this.snapshots.get(configPath);
	}

	saveConfigurationSnapshot(snapshot: ConfigurationSnapshot): void {
		this.snapshots.set(snapshot.configPath, snapshot);
	}

	deleteConfigurationSnapshot(configPath: string): void {
		this.snapshots.delete(configPath);
	}

	isAutomaticApplyDisabled(): boolean {
		return this.automaticApplyDisabled;
	}

	setAutomaticApplyDisabled(disabled: boolean): void {
		this.automaticApplyDisabled = disabled;
	}

	getTrackedPane(workspaceId: string, tabId: string): string | undefined {
		return this.panes.get(`${workspaceId}:${tabId}`);
	}

	setTrackedPane(workspaceId: string, tabId: string, paneId: string): void {
		this.panes.set(`${workspaceId}:${tabId}`, paneId);
	}

	deleteTrackedPane(workspaceId: string, tabId: string): void {
		this.panes.delete(`${workspaceId}:${tabId}`);
	}
}
