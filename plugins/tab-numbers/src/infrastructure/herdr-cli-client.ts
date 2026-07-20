import type { HerdrClientPort } from '../application/ports/herdr-client-port.ts';
import type { Tab, Workspace } from '../domain/models.ts';
import { HerdrCommandError } from '../errors/herdr-command-error.ts';
import { NodeCommandRunner, type CommandRunner } from './command-runner.ts';

type JsonObject = Record<string, unknown>;

interface ApiError {
	readonly code?: string;
	readonly message?: string;
}

function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
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

export class HerdrCliClient implements HerdrClientPort {
	private readonly binPath: string;
	private readonly runner: CommandRunner;

	constructor(binPath = process.env['HERDR_BIN_PATH'] ?? 'herdr', runner: CommandRunner = new NodeCommandRunner()) {
		this.binPath = binPath;
		this.runner = runner;
	}

	listWorkspaces(): readonly Workspace[] {
		const result = this.call(['workspace', 'list']);
		const workspaces = result['workspaces'];

		if (!Array.isArray(workspaces)) {
			throw new HerdrCommandError('herdr workspace list returned no workspaces');
		}

		return workspaces.map((workspace) => HerdrCliClient.parseWorkspace(workspace));
	}

	listTabs(workspaceId: string): readonly Tab[] {
		const result = this.call(['tab', 'list', '--workspace', workspaceId]);
		const tabs = result['tabs'];

		if (!Array.isArray(tabs)) {
			throw new HerdrCommandError('herdr tab list returned no tabs');
		}

		return tabs.map((tab) => HerdrCliClient.parseTab(tab));
	}

	getTab(tabId: string): Tab {
		const result = this.call(['tab', 'get', tabId]);
		const tab = result['tab'];

		if (tab === undefined) {
			throw new HerdrCommandError(`herdr tab get returned no tab for ${tabId}`);
		}

		return HerdrCliClient.parseTab(tab);
	}

	renameTab(tabId: string, label: string): void {
		this.call(['tab', 'rename', tabId, label]);
	}

	private call(args: readonly string[]): JsonObject {
		const command = `${this.binPath} ${args.join(' ')}`;
		const result = this.runner.run(this.binPath, args);

		if (result.error) {
			throw new HerdrCommandError(`Could not run ${command}: ${result.error.message}`, {
				cause: result.error,
			});
		}

		if (result.status !== 0) {
			const rawError = result.stderr.trim();
			const apiError = this.parseApiError(rawError);
			const detail = (apiError?.message ?? rawError) || `exit status ${result.status ?? 'unknown'}`;

			throw new HerdrCommandError(`${command} failed: ${detail}`, { code: apiError?.code });
		}

		const response = this.parseJson(result.stdout, `${command} returned malformed JSON`);

		if (!isJsonObject(response)) {
			throw new HerdrCommandError(`${command} returned an invalid response`);
		}

		if ('error' in response) {
			const apiError = toApiError(response['error']);
			const message = apiError?.message ?? JSON.stringify(response['error']);

			throw new HerdrCommandError(`${command} failed: ${message}`, { code: apiError?.code });
		}

		const commandResult = response['result'];

		if (!isJsonObject(commandResult)) {
			throw new HerdrCommandError(`${command} returned no result`);
		}

		return commandResult;
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

	private static parseWorkspace(value: unknown): Workspace {
		if (!isJsonObject(value) || typeof value['workspace_id'] !== 'string') {
			throw new HerdrCommandError('Herdr returned an invalid workspace');
		}

		return { workspace_id: value['workspace_id'] };
	}

	private static parseTab(value: unknown): Tab {
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
}
