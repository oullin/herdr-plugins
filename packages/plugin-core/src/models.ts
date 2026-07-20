export type Environment = Readonly<Record<string, string | undefined>>;

export type JsonObject = Record<string, unknown>;

export interface Workspace {
	readonly workspace_id: string;
}

export interface Tab {
	readonly tab_id: string;
	readonly workspace_id: string;
	readonly label: string;
	readonly number: number;
}

export interface Pane {
	readonly pane_id: string;
	readonly tab_id: string;
	readonly workspace_id: string;
}

export interface PluginPaneOptions {
	readonly pluginId: string;
	readonly entrypoint: string;
	readonly targetPaneId: string;
	readonly placement?: 'split';
	readonly direction?: 'down' | 'left' | 'right' | 'up';
	readonly focus?: boolean;
}
