import { spawnSync } from 'node:child_process';

import type { Environment } from '#herdr-plugin-core/models';

export interface CommandResult {
	readonly error: Error | undefined;
	readonly status: number | null;
	readonly stdout: string;
	readonly stderr: string;
}

export interface CommandRunner {
	run(binPath: string, args: readonly string[], environment?: Environment): CommandResult;
}

export class NodeCommandRunner implements CommandRunner {
	run(binPath: string, args: readonly string[], environment: Environment = process.env): CommandResult {
		const result = spawnSync(
			binPath,
			[...args],
			{
				encoding: 'utf8',
				env: environment,
				stdio: ['ignore', 'pipe', 'pipe'],
			},
		);

		return {
			error: result.error,
			status: result.status,
			stdout: result.stdout,
			stderr: result.stderr,
		};
	}
}
