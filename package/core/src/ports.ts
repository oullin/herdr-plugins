import type { Pane, PaneTitleUpdate, PluginPaneOptions, Tab, Workspace } from '#herdr-plugin-core/models';

export interface WorkspaceClient {
	listWorkspaces(): readonly Workspace[];
}

export interface TabClient {
	listTabs(workspaceId: string): readonly Tab[];
	getTab(tabId: string): Tab;
	renameTab(tabId: string, label: string): void;
}

export interface ConfigClient {
	validateConfig(configPath: string): void;
	reloadConfig(): void;
}

export interface PaneClient {
	listPanes(workspaceId?: string): readonly Pane[];
	getPane(paneId: string): Pane | undefined;
	reportPaneTitle(paneId: string, update: PaneTitleUpdate): void;
	openPluginPane(options: PluginPaneOptions): Pane;
	closePluginPane(paneId: string): boolean;
}

export interface HerdrClient extends WorkspaceClient, TabClient, ConfigClient, PaneClient {}
