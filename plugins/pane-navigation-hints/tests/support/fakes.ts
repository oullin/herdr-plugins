import type { HerdrClientPort } from '#pane-navigation-hints/application/ports/herdr-client-port';
import type { KeybindingConfigurationPort } from '#pane-navigation-hints/application/ports/keybinding-configuration-port';
import { DEFAULT_PANE_NAVIGATION_BINDINGS } from '#pane-navigation-hints/domain/default-keybindings';
import type { Environment, KeybindingConfiguration, Pane, PaneTitleUpdate } from '#pane-navigation-hints/domain/models';

export class FakeHerdrClient implements HerdrClientPort {
	readonly panes: Pane[];
	readonly reports: { readonly paneId: string; readonly update: PaneTitleUpdate }[] = [];
	readonly validatedConfigPaths: string[] = [];

	constructor(panes: readonly Pane[] = []) {
		this.panes = [...panes];
	}

	listPanes(workspaceId?: string): readonly Pane[] {
		return workspaceId === undefined ? this.panes : this.panes.filter((pane) => pane.workspace_id === workspaceId);
	}

	getPane(paneId: string): Pane | undefined {
		return this.panes.find((pane) => pane.pane_id === paneId);
	}

	reportPaneTitle(paneId: string, update: PaneTitleUpdate): void {
		this.reports.push({ paneId, update });
	}

	validateConfig(configPath: string): void {
		this.validatedConfigPaths.push(configPath);
	}
}

export class FakeKeybindingConfiguration implements KeybindingConfigurationPort {
	readonly environments: (Environment | undefined)[] = [];
	configuration: KeybindingConfiguration = {
		configPath: '/config/herdr/config.toml',
		bindings: DEFAULT_PANE_NAVIGATION_BINDINGS,
	};

	read(environment?: Environment): KeybindingConfiguration {
		this.environments.push(environment);

		return this.configuration;
	}
}

export const panes: readonly Pane[] = [
	{ pane_id: 'w1:p1', tab_id: 'w1:t1', workspace_id: 'w1' },
	{ pane_id: 'w1:p2', tab_id: 'w1:t1', workspace_id: 'w1' },
];
