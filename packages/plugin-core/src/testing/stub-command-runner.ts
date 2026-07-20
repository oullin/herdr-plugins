import type { CommandResult, CommandRunner } from '#herdr-plugin-core/command-runner';
import type { Environment } from '#herdr-plugin-core/models';

export interface CommandCall {
	readonly binPath: string;
	readonly args: readonly string[];
	readonly environment?: Environment;
}

export class StubCommandRunner implements CommandRunner {
	readonly calls: CommandCall[] = [];

	private readonly results: CommandResult[];

	constructor(...results: readonly CommandResult[]) {
		this.results = [...results];
	}

	run(binPath: string, args: readonly string[], environment?: Environment): CommandResult {
		this.calls.push({ binPath, args, ...(environment ? { environment } : {}) });

		const result = this.results.shift();

		if (!result) {
			throw new Error(`No stub command result configured for ${binPath} ${args.join(' ')}`);
		}

		return result;
	}
}
