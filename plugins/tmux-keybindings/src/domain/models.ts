export type Environment = Readonly<Record<string, string | undefined>>;

export interface Pane {
	readonly pane_id: string;
	readonly tab_id: string;
	readonly workspace_id: string;
}

export interface ConfigurationSnapshot {
	readonly version: 1;
	readonly configPath: string;
	readonly keysSectionExisted: boolean;
	readonly assignments: Readonly<Record<string, string | null>>;
	readonly displacedCommands: readonly DisplacedCommand[];
}

export interface DisplacedCommand {
	readonly line: number;
	readonly text: string;
}

export interface ConfigurationEdit {
	readonly content: string;
	readonly snapshot: ConfigurationSnapshot;
}
