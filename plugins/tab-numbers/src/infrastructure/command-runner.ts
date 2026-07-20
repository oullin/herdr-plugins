import { spawnSync } from 'node:child_process';

export interface CommandResult {
	readonly error: Error | undefined;
	readonly status: number | null;
	readonly stdout: string;
	readonly stderr: string;
}

export interface CommandRunner {
	run(binPath: string, args: readonly string[]): CommandResult;
}

export class NodeCommandRunner implements CommandRunner {
	run(binPath: string, args: readonly string[]): CommandResult {
		const result = spawnSync(
			binPath,
			[...args],
			{
				encoding: 'utf8',
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
