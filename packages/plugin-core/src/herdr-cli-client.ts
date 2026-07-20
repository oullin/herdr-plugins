import type { CommandRunner } from '#herdr-plugin-core/command-runner';
import { NodeCommandRunner } from '#herdr-plugin-core/command-runner';
import { HerdrCommandError } from '#herdr-plugin-core/errors';
import { isJsonObject } from '#herdr-plugin-core/json';
import type { Environment, JsonObject, Pane, PluginPaneOptions, Tab, Workspace } from '#herdr-plugin-core/models';
import type { HerdrClient } from '#herdr-plugin-core/ports';

interface ApiError {
	readonly code?: string;
	readonly message?: string;
}

function toApiError(value: unknown): ApiError | undefined {
	if (!isJsonObject(value)) {
		return undefined;
	}

	const code = value['code'];
	const message = value['message'];

	return {
		...(typeof code === 'string' ? { code } : {}),
		...(typeof message === 'string' ? { message } : {}),
	};
}

export class HerdrCliClient implements HerdrClient {
	readonly binPath: string;
	readonly runner: CommandRunner;

	constructor(binPath = process.env['HERDR_BIN_PATH'] ?? 'herdr', runner: CommandRunner = new NodeCommandRunner()) {
		this.binPath = binPath;
		this.runner = runner;
	}

	listWorkspaces(): readonly Workspace[] {
		const workspaces = this.call(['workspace', 'list'])['workspaces'];

		if (!Array.isArray(workspaces)) {
			throw new HerdrCommandError('herdr workspace list returned no workspaces');
		}

		return workspaces.map((workspace) => this.parseWorkspace(workspace));
	}

	listTabs(workspaceId: string): readonly Tab[] {
		const tabs = this.call(['tab', 'list', '--workspace', workspaceId])['tabs'];

		if (!Array.isArray(tabs)) {
			throw new HerdrCommandError('herdr tab list returned no tabs');
		}

		return tabs.map((tab) => this.parseTab(tab));
	}

	getTab(tabId: string): Tab {
		const tab = this.call(['tab', 'get', tabId])['tab'];

		if (tab === undefined) {
			throw new HerdrCommandError(`herdr tab get returned no tab for ${tabId}`);
		}

		return this.parseTab(tab);
	}

	renameTab(tabId: string, label: string): void {
		this.call(['tab', 'rename', tabId, label]);
	}

	validateConfig(configPath: string): void {
		this.run(['config', 'check'], { ...process.env, HERDR_CONFIG_PATH: configPath });
	}

	reloadConfig(): void {
		this.run(['server', 'reload-config']);
	}

	getPane(paneId: string): Pane | undefined {
		const result = this.runner.run(this.binPath, ['pane', 'get', paneId]);

		if (result.error || result.status !== 0) {
			return undefined;
		}

		return this.parsePane(this.resultObject(result.stdout, ['pane', 'get', paneId])['pane']);
	}

	openPluginPane(options: PluginPaneOptions): Pane {
		const args = [
			'plugin',
			'pane',
			'open',
			'--plugin',
			options.pluginId,
			'--entrypoint',
			options.entrypoint,
			'--placement',
			options.placement ?? 'split',
			'--target-pane',
			options.targetPaneId,
			'--direction',
			options.direction ?? 'right',
			...(options.focus === true ? [] : ['--no-focus']),
		];

		const pluginPane = this.call(args)['plugin_pane'];

		if (!isJsonObject(pluginPane)) {
			throw new HerdrCommandError('Herdr did not return the opened plugin pane');
		}

		return this.parsePane(pluginPane['pane']);
	}

	closePluginPane(paneId: string): boolean {
		const result = this.runner.run(this.binPath, ['plugin', 'pane', 'close', paneId]);

		return !result.error && result.status === 0;
	}

	call(args: readonly string[], environment?: Environment): JsonObject {
		return this.resultObject(this.run(args, environment), args);
	}

	run(args: readonly string[], environment?: Environment): string {
		const result = this.runner.run(this.binPath, args, environment);
		const command = `${this.binPath} ${args.join(' ')}`;

		if (result.error) {
			throw new HerdrCommandError(`Could not run ${command}: ${result.error.message}`, { cause: result.error });
		}

		if (result.status !== 0) {
			const rawError = result.stderr.trim();
			const apiError = this.parseApiError(rawError);
			const detail = (apiError?.message ?? rawError) || `exit status ${result.status ?? 'unknown'}`;

			throw new HerdrCommandError(`${command} failed: ${detail}`, { code: apiError?.code });
		}

		return result.stdout;
	}

	private resultObject(stdout: string, args: readonly string[]): JsonObject {
		const command = `${this.binPath} ${args.join(' ')}`;
		const response = this.parseJson(stdout, `${command} returned malformed JSON`);

		if (!isJsonObject(response)) {
			throw new HerdrCommandError(`${command} returned an invalid response`);
		}

		if ('error' in response) {
			const apiError = toApiError(response['error']);
			const message = apiError?.message ?? JSON.stringify(response['error']);

			throw new HerdrCommandError(`${command} failed: ${message}`, { code: apiError?.code });
		}

		const result = response['result'];

		if (!isJsonObject(result)) {
			throw new HerdrCommandError(`${command} returned no result`);
		}

		return result;
	}

	private parseApiError(rawError: string): ApiError | undefined {
		if (rawError.length === 0) {
			return undefined;
		}

		try {
			const response = JSON.parse(rawError) as unknown;

			return isJsonObject(response) ? toApiError(response['error']) : undefined;
		} catch {
			return undefined;
		}
	}

	private parseJson(value: string, errorMessage: string): unknown {
		try {
			return JSON.parse(value) as unknown;
		} catch (error) {
			throw new HerdrCommandError(errorMessage, { cause: error });
		}
	}

	private parseWorkspace(value: unknown): Workspace {
		if (!isJsonObject(value) || typeof value['workspace_id'] !== 'string') {
			throw new HerdrCommandError('Herdr returned an invalid workspace');
		}

		return { workspace_id: value['workspace_id'] };
	}

	private parseTab(value: unknown): Tab {
		if (
			!isJsonObject(value) ||
			typeof value['tab_id'] !== 'string' ||
			typeof value['workspace_id'] !== 'string' ||
			typeof value['label'] !== 'string' ||
			!Number.isInteger(value['number']) ||
			(value['number'] as number) < 1
		) {
			throw new HerdrCommandError('Herdr returned an invalid tab');
		}

		return {
			tab_id: value['tab_id'],
			workspace_id: value['workspace_id'],
			label: value['label'],
			number: value['number'] as number,
		};
	}

	private parsePane(value: unknown): Pane {
		if (!isJsonObject(value) || typeof value['pane_id'] !== 'string' || typeof value['tab_id'] !== 'string' || typeof value['workspace_id'] !== 'string') {
			throw new HerdrCommandError('Herdr returned an invalid pane');
		}

		return {
			pane_id: value['pane_id'],
			tab_id: value['tab_id'],
			workspace_id: value['workspace_id'],
		};
	}
}
