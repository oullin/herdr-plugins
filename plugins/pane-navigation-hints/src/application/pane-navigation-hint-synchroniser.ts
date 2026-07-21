import type { HerdrClientPort } from '#pane-navigation-hints/application/ports/herdr-client-port';
import type { KeybindingConfigurationPort } from '#pane-navigation-hints/application/ports/keybinding-configuration-port';
import type { Environment } from '#pane-navigation-hints/domain/models';
import type { NavigationHintFormatter } from '#pane-navigation-hints/domain/navigation-hint-formatter';

export const PANE_TITLE_SOURCE = 'oullin.pane-navigation-hints';

export class PaneNavigationHintSynchroniser {
	private readonly client: HerdrClientPort;
	private readonly configuration: KeybindingConfigurationPort;
	private readonly formatter: NavigationHintFormatter;

	constructor(client: HerdrClientPort, configuration: KeybindingConfigurationPort, formatter: NavigationHintFormatter) {
		this.client = client;
		this.configuration = configuration;
		this.formatter = formatter;
	}

	refreshAll(environment: Environment = process.env): number {
		const title = this.title(environment);
		const panes = this.client.listPanes();

		for (const pane of panes) {
			this.client.reportPaneTitle(pane.pane_id, { source: PANE_TITLE_SOURCE, title });
		}

		return panes.length;
	}

	refreshPane(paneId: string, environment: Environment = process.env): number {
		if (this.client.getPane(paneId) === undefined) {
			return 0;
		}

		this.client.reportPaneTitle(paneId, { source: PANE_TITLE_SOURCE, title: this.title(environment) });

		return 1;
	}

	clearAll(): number {
		const panes = this.client.listPanes();

		for (const pane of panes) {
			this.client.reportPaneTitle(pane.pane_id, { source: PANE_TITLE_SOURCE, clearTitle: true });
		}

		return panes.length;
	}

	private title(environment: Environment): string {
		const configuration = this.configuration.read(environment);

		this.client.validateConfig(configuration.configPath);

		return this.formatter.format(configuration.bindings);
	}
}
