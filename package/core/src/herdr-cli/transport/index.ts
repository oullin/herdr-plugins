import type { CommandResult, CommandRunner } from '#herdr-plugin-core/command-runner';
import { NodeCommandRunner } from '#herdr-plugin-core/command-runner';
import { HerdrCommandError } from '#herdr-plugin-core/errors';
import { HerdrResponseDecoder } from '#herdr-plugin-core/herdr-cli/responses';
import type { Environment, JsonObject } from '#herdr-plugin-core/models';

export class HerdrCliTransport {
	readonly binPath: string;
	readonly responses: HerdrResponseDecoder;
	readonly runner: CommandRunner;

	constructor(binPath = process.env['HERDR_BIN_PATH'] ?? 'herdr', runner: CommandRunner = new NodeCommandRunner(), responses: HerdrResponseDecoder = new HerdrResponseDecoder()) {
		this.binPath = binPath;
		this.responses = responses;
		this.runner = runner;
	}

	execute(args: readonly string[], environment?: Environment): CommandResult {
		return this.runner.run(this.binPath, args, environment);
	}

	run(args: readonly string[], environment?: Environment): string {
		const result = this.execute(args, environment);
		const command = this.command(args);

		if (result.error) {
			throw new HerdrCommandError(`Could not run ${command}: ${result.error.message}`, { cause: result.error });
		}

		if (result.status !== 0) {
			const rawError = result.stderr.trim();
			const apiError = this.responses.decodeError(rawError);
			const detail = (apiError?.message ?? rawError) || `exit status ${result.status ?? 'unknown'}`;

			throw new HerdrCommandError(`${command} failed: ${detail}`, { code: apiError?.code });
		}

		return result.stdout;
	}

	call(args: readonly string[], environment?: Environment): JsonObject {
		return this.decodeResult(this.run(args, environment), args);
	}

	decodeResult(stdout: string, args: readonly string[]): JsonObject {
		return this.responses.decodeResult(stdout, this.command(args));
	}

	private command(args: readonly string[]): string {
		return `${this.binPath} ${args.join(' ')}`;
	}
}
