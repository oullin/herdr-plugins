export type { Environment } from '@oullin/herdr-plugin-core';

export interface ConfigurationSnapshot {
	readonly version: 1 | 2 | 3 | 4 | 5;
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
