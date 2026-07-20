import type { HerdrClientPort } from '#tmux-keybindings/application/ports/herdr-client-port';
import { PANE_ENTRYPOINT, PLUGIN_ID } from '#tmux-keybindings/domain/keybinding-profile';
import type { Pane } from '#tmux-keybindings/domain/models';
import { PluginError } from '#tmux-keybindings/errors/plugin-error';
import { NodeCommandRunner, type CommandRunner } from '#tmux-keybindings/infrastructure/command-runner';

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class HerdrCliClient implements HerdrClientPort {
	private readonly binPath: string;
	private readonly runner: CommandRunner;

	constructor(binPath = process.env['HERDR_BIN_PATH'] ?? 'herdr', runner: CommandRunner = new NodeCommandRunner()) {
		this.binPath = binPath;
		this.runner = runner;
	}

	validateConfig(configPath: string): void {
		this.run(['config', 'check'], { ...process.env, HERDR_CONFIG_PATH: configPath });
	}

	reloadConfig(): void {
		this.run(['server', 'reload-config']);
	}

	getPane(paneId: string): Pane | undefined {
		const result = this.runner.run(this.binPath, ['pane', 'get', paneId]);

		if (result.status !== 0 || result.error) {
			return undefined;
		}

		return this.parsePane(this.resultObject(result.stdout, ['pane', 'get', paneId])['pane']);
	}

	openBindingsPane(targetPaneId: string): Pane {
		const args = ['plugin', 'pane', 'open', '--plugin', PLUGIN_ID, '--entrypoint', PANE_ENTRYPOINT, '--placement', 'split', '--target-pane', targetPaneId, '--direction', 'right', '--no-focus'];

		const result = this.resultObject(this.run(args), args);
		const pluginPane = result['plugin_pane'];

		if (!isJsonObject(pluginPane)) {
			throw new PluginError('Herdr did not return the opened plugin pane');
		}

		return this.parsePane(pluginPane['pane']);
	}

	closePluginPane(paneId: string): boolean {
		const result = this.runner.run(this.binPath, ['plugin', 'pane', 'close', paneId]);

		return !result.error && result.status === 0;
	}

	private run(args: readonly string[], environment?: NodeJS.ProcessEnv): string {
		const result = this.runner.run(this.binPath, args, environment);
		const command = `${this.binPath} ${args.join(' ')}`;

		if (result.error) {
			throw new PluginError(`Could not run ${command}: ${result.error.message}`, { cause: result.error });
		}

		if (result.status !== 0) {
			const detail = result.stderr.trim() || `exit status ${result.status ?? 'unknown'}`;

			throw new PluginError(`${command} failed: ${detail}`);
		}

		return result.stdout;
	}

	private resultObject(stdout: string, args: readonly string[]): JsonObject {
		let response: unknown;

		try {
			response = JSON.parse(stdout) as unknown;
		} catch (error) {
			throw new PluginError(`${this.binPath} ${args.join(' ')} returned malformed JSON`, { cause: error });
		}

		if (!isJsonObject(response) || !isJsonObject(response['result'])) {
			throw new PluginError(`${this.binPath} ${args.join(' ')} returned no result`);
		}

		return response['result'];
	}

	private parsePane(value: unknown): Pane {
		if (!isJsonObject(value) || typeof value['pane_id'] !== 'string' || typeof value['tab_id'] !== 'string' || typeof value['workspace_id'] !== 'string') {
			throw new PluginError('Herdr returned an invalid pane');
		}

		return {
			pane_id: value['pane_id'],
			tab_id: value['tab_id'],
			workspace_id: value['workspace_id'],
		};
	}
}
