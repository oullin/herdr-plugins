import type { Pane, PluginPaneOptions, Tab, Workspace } from '#herdr-plugin-core/models';

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
	getPane(paneId: string): Pane | undefined;
	openPluginPane(options: PluginPaneOptions): Pane;
	closePluginPane(paneId: string): boolean;
}

export interface HerdrClient extends WorkspaceClient, TabClient, ConfigClient, PaneClient {}
