import type { Pane, PaneTitleUpdate } from '#pane-navigation-hints/domain/models';

export interface HerdrClientPort {
	listPanes(workspaceId?: string): readonly Pane[];
	getPane(paneId: string): Pane | undefined;
	reportPaneTitle(paneId: string, update: PaneTitleUpdate): void;
	validateConfig(configPath: string): void;
}
